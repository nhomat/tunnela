import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasFeature } from "@/lib/types";
import type { Bail, Plan } from "@/lib/types";

const MAX_ALERT_WINDOW_DAYS = 90; // borne haute de alert_delai_jours

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
  windowEnd.setDate(windowEnd.getDate() + MAX_ALERT_WINDOW_DAYS);

  const { data: baux, error } = await supabase
    .from("baux")
    .select("*")
    .gte("date_prochaine_revision", isoDate(today))
    .lte("date_prochaine_revision", isoDate(windowEnd))
    .returns<Bail[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dueForAlert = (baux ?? []).filter(
    (b) => b.derniere_alerte_envoyee_le !== b.date_prochaine_revision
  );

  if (dueForAlert.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const userIds = [...new Set(dueForAlert.map((b) => b.user_id).filter(Boolean))] as string[];
  const { data: abonnements } = await supabase
    .from("abonnements")
    .select("user_id, plan, alert_delai_jours")
    .in("user_id", userIds);

  const settingsByUser = new Map(
    (abonnements ?? []).map((a) => [
      a.user_id as string,
      { plan: a.plan as Plan, delaiJours: a.alert_delai_jours as number },
    ])
  );

  const aEnvoyer = dueForAlert.filter((b) => {
    const settings = b.user_id ? settingsByUser.get(b.user_id) : undefined;
    if (!settings || !hasFeature(settings.plan, "alerts") || !b.date_prochaine_revision) return false;
    const joursRestants = Math.ceil(
      (new Date(b.date_prochaine_revision).getTime() - today.getTime()) / 86_400_000
    );
    return joursRestants <= settings.delaiJours;
  });

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
