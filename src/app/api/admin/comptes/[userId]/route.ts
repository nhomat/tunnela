import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { PLANS } from "@/lib/stripe";
import type { Plan } from "@/lib/types";

const PLAN_IDS = PLANS.map((p) => p.id);

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { userId } = await params;
  const admin = createAdminClient();

  const [{ data: abonnement, error: abonnementError }, { data: authUser, error: authUserError }, { data: baux }] =
    await Promise.all([
      admin.from("abonnements").select("*").eq("user_id", userId).maybeSingle(),
      admin.auth.admin.getUserById(userId),
      admin.from("baux").select("id, preneur, adresse, statut").eq("user_id", userId),
    ]);

  if (abonnementError) {
    return NextResponse.json({ error: abonnementError.message }, { status: 500 });
  }
  if (authUserError || !authUser?.user) {
    return NextResponse.json({ error: "compte introuvable" }, { status: 404 });
  }
  if (!abonnement) {
    return NextResponse.json({ error: "abonnement introuvable" }, { status: 404 });
  }

  const { data: equipe } = await admin
    .from("equipes")
    .select("id, nom")
    .eq("proprietaire_user_id", userId)
    .maybeSingle();

  let equipeInfo: { nom: string; membresActifs: number } | null = null;
  if (equipe) {
    const { count } = await admin
      .from("membres_equipe")
      .select("*", { count: "exact", head: true })
      .eq("equipe_id", equipe.id)
      .eq("statut", "actif");
    equipeInfo = { nom: equipe.nom, membresActifs: count ?? 0 };
  }

  return NextResponse.json({
    userId,
    email: authUser.user.email ?? "",
    createdAt: authUser.user.created_at ?? null,
    plan: abonnement.plan as Plan,
    statut: abonnement.statut as string,
    isAdmin: Boolean(abonnement.is_admin),
    coopActif: Boolean(abonnement.coop_actif),
    stripeCustomerId: abonnement.stripe_customer_id as string | null,
    stripeSubscriptionId: abonnement.stripe_subscription_id as string | null,
    baux: baux ?? [],
    equipe: equipeInfo,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { userId } = await params;
  const body = (await request.json()) as { plan?: string; statut?: string; isAdmin?: boolean };

  const updates: Record<string, unknown> = {};

  if (body.plan !== undefined) {
    if (!PLAN_IDS.includes(body.plan as Plan)) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }
    updates.plan = body.plan;
  }

  if (body.statut !== undefined) {
    // Le blocage ("suspendu") exige une confirmation par code envoyé par
    // email — voir POST /api/admin/comptes/[userId]/action. Seule la
    // réactivation ("actif") est autorisée ici, en écriture directe.
    if (body.statut !== "actif") {
      return NextResponse.json({ error: "use_confirmation_flow" }, { status: 400 });
    }
    updates.statut = body.statut;
  }

  if (body.isAdmin !== undefined) {
    if (userId === auth.user.id && !body.isAdmin) {
      return NextResponse.json({ error: "cannot_self_demote" }, { status: 400 });
    }
    updates.is_admin = body.isAdmin;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no_updates" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("abonnements")
    .update(updates)
    .eq("user_id", userId)
    .select("user_id, plan, statut, is_admin, coop_actif")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    userId: data.user_id,
    plan: data.plan,
    statut: data.statut,
    isAdmin: Boolean(data.is_admin),
    coopActif: Boolean(data.coop_actif),
  });
}
