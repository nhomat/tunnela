import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Bail } from "@/lib/types";

const ALERT_WINDOW_DAYS = 30;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + ALERT_WINDOW_DAYS);

  const { data: baux, error } = await supabase
    .from("baux")
    .select("*")
    .gte("date_prochaine_revision", isoDate(today))
    .lte("date_prochaine_revision", isoDate(windowEnd))
    .returns<Bail[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const aEnvoyer = (baux ?? []).filter(
    (b) => b.derniere_alerte_envoyee_le !== b.date_prochaine_revision
  );

  if (aEnvoyer.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  let sent = 0;

  for (const bail of aEnvoyer) {
    if (!bail.user_id) continue;

    const { data: userData } = await supabase.auth.admin.getUserById(bail.user_id);
    const email = userData?.user?.email;
    if (!email) continue;

    if (resend) {
      await resend.emails.send({
        from: process.env.ALERT_FROM_EMAIL ?? "Tunnela <alertes@tunnela.fr>",
        to: email,
        subject: `Révision de loyer à venir — ${bail.preneur}`,
        text: `Le bail de ${bail.preneur}${bail.adresse ? ` (${bail.adresse})` : ""} arrive à échéance de révision le ${bail.date_prochaine_revision}.\n\nConnectez-vous à Tunnela pour calculer la révision applicable : https://tunnela.fr/dashboard/calculateur`,
      });
    }

    await supabase
      .from("baux")
      .update({ derniere_alerte_envoyee_le: bail.date_prochaine_revision })
      .eq("id", bail.id);

    sent += 1;
  }

  return NextResponse.json({ sent });
}
