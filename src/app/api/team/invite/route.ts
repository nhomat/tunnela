import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

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
    .select("coop_actif")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!abonnement?.coop_actif) {
    return NextResponse.json({ error: "addon_required" }, { status: 403 });
  }

  const { data: equipe } = await supabase
    .from("equipes")
    .select("id, nom")
    .eq("proprietaire_user_id", user.id)
    .maybeSingle();

  if (!equipe) {
    return NextResponse.json({ error: "no_team" }, { status: 400 });
  }

  const { email } = (await request.json()) as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from("membres_equipe")
    .insert({ equipe_id: equipe.id, email: email.toLowerCase().trim(), role: "membre" });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "already_invited" }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tunnela.vercel.app";
    await resend.emails.send({
      from: process.env.ALERT_FROM_EMAIL ?? "Tunnela <alertes@tunnela.fr>",
      to: email,
      subject: `Invitation à rejoindre l'équipe "${equipe.nom}" sur Tunnela`,
      text: `Bonjour,\n\nVous avez été invité(e) à rejoindre l'équipe "${equipe.nom}" sur Tunnela, le copilote des révisions de baux commerciaux.\n\nConnectez-vous avec cette adresse email (${email}) sur ${appUrl}/login pour rejoindre l'équipe automatiquement.\n\nÀ bientôt,\nL'équipe Tunnela`,
    });
  }

  return NextResponse.json({ invited: true });
}
