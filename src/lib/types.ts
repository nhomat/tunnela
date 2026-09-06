export type IndexType = "ILC" | "ILAT" | "ICC";

export type StatutConformite = "conforme" | "a_verifier" | "non_conforme";

export type Plan = "decouverte" | "cabinet" | "portefeuille" | "fonciere";

export interface Bail {
  id: string;
  user_id?: string;
  preneur: string;
  adresse: string | null;
  loyer_annuel: number;
  indice: IndexType;
  clause_tunnel: boolean;
  plancher_pct: number | null;
  plafond_pct: number | null;
  date_prochaine_revision: string | null;
  statut: StatutConformite;
  derniere_alerte_envoyee_le?: string | null;
  created_at?: string;
}

export interface Abonnement {
  user_id: string;
  plan: Plan;
  is_admin: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  statut: string;
  updated_at?: string;
}

export const PLAN_LIMITS: Record<Plan, number | null> = {
  decouverte: 3,
  cabinet: 20,
  portefeuille: 100,
  fonciere: null,
};

export function limiteBaux(plan: Plan): number | null {
  return PLAN_LIMITS[plan];
}

export type Feature =
  | "generator"
  | "pdfExport"
  | "alerts"
  | "search"
  | "csvImport"
  | "echeancier"
  | "prioritySupport"
  | "dedicatedContact"
  | "autoIndex";

const PLAN_ORDER: Plan[] = ["decouverte", "cabinet", "portefeuille", "fonciere"];

const FEATURE_MIN_PLAN: Record<Feature, Plan> = {
  generator: "cabinet",
  pdfExport: "cabinet",
  alerts: "cabinet",
  search: "portefeuille",
  csvImport: "portefeuille",
  echeancier: "portefeuille",
  prioritySupport: "portefeuille",
  dedicatedContact: "fonciere",
  autoIndex: "fonciere",
};

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(FEATURE_MIN_PLAN[feature]);
}

export function minPlanForFeature(feature: Feature): Plan {
  return FEATURE_MIN_PLAN[feature];
}

export function calculerStatutConformite(
  bail: Pick<Bail, "indice" | "clause_tunnel">
): StatutConformite {
  if (bail.indice === "ICC") return "non_conforme";
  if (bail.clause_tunnel && (bail.indice === "ILC" || bail.indice === "ILAT")) {
    return "conforme";
  }
  return "a_verifier";
}
