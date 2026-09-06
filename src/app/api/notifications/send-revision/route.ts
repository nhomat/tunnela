import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { hasFeature } from "@/lib/types";
import type { Plan } from "@/lib/types";

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

  const { to, subject, text } = (await request.json()) as {
    to?: string;
    subject?: string;
    text?: string;
  };

  if (!to || !subject || !text) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "resend_not_configured" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.ALERT_FROM_EMAIL ?? "Tunnela <alertes@tunnela.fr>",
    to,
    subject,
    text,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
