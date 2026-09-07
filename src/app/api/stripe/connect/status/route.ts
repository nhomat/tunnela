import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

// Vérifie l'état réel du compte Connect auprès de Stripe (plus fiable qu'un
// cache qui n'attendrait que le webhook, utile juste après le retour
// d'onboarding) et resynchronise la copie locale au passage.
export async function GET() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("stripe_connect_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!abonnement?.stripe_connect_account_id) {
    return NextResponse.json({ connected: false });
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(abonnement.stripe_connect_account_id);

  const status = {
    details_submitted: Boolean(account.details_submitted),
    charges_enabled: Boolean(account.charges_enabled),
    payouts_enabled: Boolean(account.payouts_enabled),
  };

  await supabase
    .from("abonnements")
    .update({
      stripe_connect_details_submitted: status.details_submitted,
      stripe_connect_charges_enabled: status.charges_enabled,
      stripe_connect_payouts_enabled: status.payouts_enabled,
    })
    .eq("user_id", user.id);

  return NextResponse.json({ connected: true, ...status });
}
