export type IndexType = "ILC" | "ILAT" | "ICC";

export type StatutConformite = "conforme" | "a_verifier" | "non_conforme";

export type Plan = "decouverte" | "cabinet" | "portefeuille" | "fonciere" | "coop";

export type Periodicite = "annuelle" | "trimestrielle";

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
  indice_reference: number | null;
  periodicite: Periodicite;
  preneur_email: string | null;
  equipe_id: string | null;
  visible_equipe: boolean;
  created_at?: string;
}

export function prochaineDateApres(dateActuelle: string | null, periodicite: Periodicite): string {
  const base = dateActuelle ? new Date(dateActuelle) : new Date();
  if (periodicite === "annuelle") {
    base.setFullYear(base.getFullYear() + 1);
  } else {
    base.setMonth(base.getMonth() + 3);
  }
  return base.toISOString().slice(0, 10);
}

export interface Abonnement {
  user_id: string;
  plan: Plan;
  is_admin: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  statut: string;
  nom_bailleur_defaut: string | null;
  alert_delai_jours: number;
  updated_at?: string;
}

export const PLAN_LIMITS: Record<Plan, number | null> = {
  decouverte: 3,
  cabinet: 20,
  portefeuille: 100,
  fonciere: null,
  coop: null,
};

export function limiteBaux(plan: Plan): number | null {
  return PLAN_LIMITS[plan];
}

export type Feature =
  | "generator"
  | "pdfExport"
  | "alerts"
  | "revisionWorkflow"
  | "search"
  | "csvImport"
  | "echeancier"
  | "notifyEmail"
  | "prioritySupport"
  | "dedicatedContact"
  | "autoIndex"
  | "coopEquipe";

const PLAN_ORDER: Plan[] = ["decouverte", "cabinet", "portefeuille", "fonciere", "coop"];

const FEATURE_MIN_PLAN: Record<Feature, Plan> = {
  generator: "cabinet",
  pdfExport: "cabinet",
  alerts: "cabinet",
  revisionWorkflow: "cabinet",
  search: "portefeuille",
  csvImport: "portefeuille",
  echeancier: "portefeuille",
  notifyEmail: "portefeuille",
  prioritySupport: "portefeuille",
  dedicatedContact: "fonciere",
  autoIndex: "fonciere",
  coopEquipe: "coop",
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
