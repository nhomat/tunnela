import Stripe from "stripe";
import type { Plan } from "./types";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY n'est pas configurée.");
  }
  return new Stripe(secretKey);
}

export interface PlanDefinition {
  id: Plan;
  nom: string;
  prixMensuel: number | null;
  limiteBaux: number | null;
  priceEnvVar: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "decouverte",
    nom: "Découverte",
    prixMensuel: 0,
    limiteBaux: 3,
    priceEnvVar: "",
  },
  {
    id: "cabinet",
    nom: "Cabinet",
    prixMensuel: 35,
    limiteBaux: 20,
    priceEnvVar: "STRIPE_PRICE_CABINET",
  },
  {
    id: "portefeuille",
    nom: "Portefeuille",
    prixMensuel: 150,
    limiteBaux: 100,
    priceEnvVar: "STRIPE_PRICE_PORTEFEUILLE",
  },
  {
    id: "fonciere",
    nom: "Foncière",
    prixMensuel: 290,
    limiteBaux: 500,
    priceEnvVar: "STRIPE_PRICE_FONCIERE",
  },
];

export function priceIdForPlan(plan: Plan): string | null {
  const def = PLANS.find((p) => p.id === plan);
  if (!def || !def.priceEnvVar) return null;
  return process.env[def.priceEnvVar] ?? null;
}

export function planForPriceId(priceId: string): Plan | null {
  for (const def of PLANS) {
    if (def.priceEnvVar && process.env[def.priceEnvVar] === priceId) {
      return def.id;
    }
  }
  return null;
}

// Add-on Coop (multi-utilisateurs + partage d'équipe) : un supplément
// ajouté à l'abonnement de base existant, pas un palier séparé.
export const COOP_ADDON_NOM = "Coop";
export const COOP_ADDON_PRIX_MENSUEL = 150;

export function coopAddonPriceId(): string | null {
  return process.env.STRIPE_PRICE_COOP_ADDON ?? null;
}

// URL de base de l'application, utilisée pour construire les liens de
// redirection Stripe (Checkout, Account Links Connect, etc.).
export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://tunnela.vercel.app";
}
