import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { hasFeature } from "@/lib/types";
import type { Plan } from "@/lib/types";

const MAX_LENGTH = 20_000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  const plan = (abonnement?.plan as Plan) ?? "decouverte";
  if (!hasFeature(plan, "notifyEmail")) {
    return NextResponse.json({ error: "plan_required" }, { status: 403 });
  }

  const { allowed } = await checkRateLimit(`send-revision:${user.id}`, {
    max: 20,
    windowMinutes: 10,
  });
  if (!allowed) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const { bailId, subject, text } = (await request.json()) as {
    bailId?: string;
    subject?: string;
    text?: string;
  };

  if (
    !bailId ||
    !subject?.trim() ||
    !text?.trim() ||
    subject.length > 300 ||
    text.length > MAX_LENGTH
  ) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // Le destinataire n'est jamais pris depuis la requête : il est toujours
  // relu depuis le bail lui-même (visibilité déjà bornée par les policies
  // RLS de la table `baux`), pour empêcher qu'un client altéré transforme
  // cette route en relais d'emails vers une adresse arbitraire.
  const { data: bail } = await supabase
    .from("baux")
    .select("preneur_email")
    .eq("id", bailId)
    .maybeSingle();

  if (!bail?.preneur_email) {
    return NextResponse.json({ error: "bail_not_found" }, { status: 404 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "resend_not_configured" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.ALERT_FROM_EMAIL ?? "Tunnela <alertes@tunnela.fr>",
    to: bail.preneur_email,
    subject,
    text,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
