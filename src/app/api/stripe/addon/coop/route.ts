import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Le reste de la logique tourne en service_role : abonnements n'a pas de
  // policy UPDATE générale pour les utilisateurs normaux (voir schema.sql),
  // et cette route valide déjà l'identité via la session au-dessus.
  const supabase = createAdminClient();

  const { action } = (await request.json()) as { action?: "subscribe" | "unsubscribe" };

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("plan, stripe_subscription_id, coop_actif, stripe_coop_item_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!abonnement) {
    return NextResponse.json({ error: "no_subscription" }, { status: 400 });
  }

  const stripe = getStripe();

  if (action === "unsubscribe") {
    if (abonnement.stripe_coop_item_id) {
      await stripe.subscriptionItems.del(abonnement.stripe_coop_item_id);
    }
    await supabase
      .from("abonnements")
      .update({ coop_actif: false, stripe_coop_item_id: null })
      .eq("user_id", user.id);
    // Supprime l'équipe possédée : cascade sur membres_equipe et
    // messages_equipe. Sans effet si l'utilisateur n'a jamais créé d'équipe.
    await supabase.from("equipes").delete().eq("proprietaire_user_id", user.id);
    return NextResponse.json({ coop_actif: false });
  }

  // action === "subscribe" : active seulement l'accès à la fonctionnalité
  // Coop (création d'équipe, invitations). La facturation (20 €/mois par
  // personne) ne démarre qu'à la première invitation — voir syncCoopBilling.
  if (abonnement.plan === "decouverte" || !abonnement.stripe_subscription_id) {
    return NextResponse.json({ error: "plan_required" }, { status: 400 });
  }
  if (abonnement.coop_actif) {
    return NextResponse.json({ coop_actif: true });
  }

  await supabase.from("abonnements").update({ coop_actif: true }).eq("user_id", user.id);

  return NextResponse.json({ coop_actif: true });
}
