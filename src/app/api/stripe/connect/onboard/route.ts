import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, appUrl } from "@/lib/stripe";

// Crée (une seule fois) le compte Stripe Connect Express de l'utilisateur,
// puis renvoie un lien d'inscription hébergé par Stripe (Account Link).
// Rejouable à tout moment : si le compte existe déjà mais que l'inscription
// est incomplète ou que le lien précédent a expiré, on régénère simplement
// un nouveau lien vers le même compte — jamais un second compte.
export async function POST() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const stripe = getStripe();

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("stripe_connect_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let accountId = abonnement?.stripe_connect_account_id ?? null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { tunnela_user_id: user.id },
    });
    accountId = account.id;

    const { error } = await supabase
      .from("abonnements")
      .update({ stripe_connect_account_id: accountId })
      .eq("user_id", user.id);

    if (error) {
      // Ne laisse pas un compte Stripe orphelin sans identifiant enregistré.
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }
  }

  const base = appUrl();
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${base}/dashboard/parametres?stripe_connect=refresh`,
    return_url: `${base}/dashboard/parametres?stripe_connect=success`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
