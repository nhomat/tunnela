import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, priceIdForPlan } from "@/lib/stripe";
import type { Plan } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { plan } = (await request.json()) as { plan: Plan };
  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: abonnement?.stripe_customer_id ?? undefined,
    customer_email: abonnement?.stripe_customer_id ? undefined : user.email,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/abonnement?checkout=success`,
    cancel_url: `${origin}/dashboard/abonnement?checkout=cancelled`,
    metadata: { user_id: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
