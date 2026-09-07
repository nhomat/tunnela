import { NextResponse } from "next/server";
import { getStripe, planForPriceId, coopAddonPriceId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id ?? session.metadata?.user_id;
      if (userId) {
        await supabase.from("abonnements").upsert({
          user_id: userId,
          plan: session.metadata?.plan ?? "cabinet",
          stripe_customer_id: (session.customer as string) ?? null,
          stripe_subscription_id: (session.subscription as string) ?? null,
          statut: "actif",
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const coopPriceId = coopAddonPriceId();

      let plan: ReturnType<typeof planForPriceId> = null;
      let coopItemId: string | null = null;
      for (const item of subscription.items.data) {
        const matchedPlan = planForPriceId(item.price.id);
        if (matchedPlan) plan = matchedPlan;
        if (coopPriceId && item.price.id === coopPriceId) coopItemId = item.id;
      }

      await supabase
        .from("abonnements")
        .update({
          plan: plan ?? undefined,
          statut: subscription.status,
          coop_actif: coopItemId !== null,
          stripe_coop_item_id: coopItemId,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("abonnements")
        .update({
          plan: "decouverte",
          statut: "annule",
          coop_actif: false,
          stripe_coop_item_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
