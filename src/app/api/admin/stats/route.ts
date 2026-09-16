import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/stripe";
import type { Plan } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: own } = await supabase
    .from("abonnements")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!own?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const [{ data: abonnements, error: abonnementsError }, { count: bauxCount }] = await Promise.all([
    admin.from("abonnements").select("plan, statut, coop_actif"),
    admin.from("baux").select("*", { count: "exact", head: true }),
  ]);

  if (abonnementsError) {
    return NextResponse.json({ error: abonnementsError.message }, { status: 500 });
  }

  const byPlan: Record<string, number> = {};
  let actifCount = 0;
  let coopActifCount = 0;
  let mrrEstimate = 0;

  for (const row of abonnements ?? []) {
    const plan = row.plan as Plan;
    byPlan[plan] = (byPlan[plan] ?? 0) + 1;
    if (row.statut === "actif") actifCount += 1;
    if (row.coop_actif) coopActifCount += 1;
    if (row.statut === "actif" && plan !== "decouverte") {
      const def = PLANS.find((p) => p.id === plan);
      if (def?.prixMensuel) mrrEstimate += def.prixMensuel;
    }
  }

  return NextResponse.json({
    totalUsers: abonnements?.length ?? 0,
    actifCount,
    byPlan,
    coopActifCount,
    bauxCount: bauxCount ?? 0,
    mrrEstimate: Math.round(mrrEstimate * 100) / 100,
  });
}
