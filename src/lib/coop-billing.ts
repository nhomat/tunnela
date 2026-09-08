import { getStripe, coopAddonPriceId } from "./stripe";
import { createAdminClient } from "./supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Aligne la facturation Coop sur le nombre réel de personnes ajoutées à
 * l'équipe (lignes membres_equipe) : met à jour la quantité de l'item
 * d'abonnement Stripe dédié, le crée au premier membre ajouté, le supprime
 * quand l'équipe revient à zéro membre. À appeler après tout ajout ou
 * retrait d'un membre.
 */
export async function syncCoopBilling(supabase: AdminClient, ownerId: string): Promise<void> {
  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("stripe_subscription_id, stripe_coop_item_id")
    .eq("user_id", ownerId)
    .maybeSingle();

  if (!abonnement?.stripe_subscription_id) return;

  const { data: equipe } = await supabase
    .from("equipes")
    .select("id")
    .eq("proprietaire_user_id", ownerId)
    .maybeSingle();

  const quantity = equipe
    ? ((
        await supabase
          .from("membres_equipe")
          .select("id", { count: "exact", head: true })
          .eq("equipe_id", equipe.id)
      ).count ?? 0)
    : 0;

  const stripe = getStripe();

  if (quantity === 0) {
    if (abonnement.stripe_coop_item_id) {
      await stripe.subscriptionItems.del(abonnement.stripe_coop_item_id);
      await supabase.from("abonnements").update({ stripe_coop_item_id: null }).eq("user_id", ownerId);
    }
    return;
  }

  if (abonnement.stripe_coop_item_id) {
    await stripe.subscriptionItems.update(abonnement.stripe_coop_item_id, { quantity });
    return;
  }

  const priceId = coopAddonPriceId();
  if (!priceId) return;

  const item = await stripe.subscriptionItems.create({
    subscription: abonnement.stripe_subscription_id,
    price: priceId,
    quantity,
  });
  await supabase.from("abonnements").update({ stripe_coop_item_id: item.id }).eq("user_id", ownerId);
}
