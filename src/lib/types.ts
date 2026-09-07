export type IndexType = "ILC" | "ILAT" | "ICC";

export type StatutConformite = "conforme" | "a_verifier" | "non_conforme";

export type Plan = "decouverte" | "cabinet" | "portefeuille" | "fonciere";

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
  coop_actif: boolean;
  stripe_coop_item_id: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_details_submitted: boolean;
  stripe_connect_charges_enabled: boolean;
  stripe_connect_payouts_enabled: boolean;
  updated_at?: string;
}

// Foncière plafonné à 500 baux plutôt qu'illimité : au-delà, l'économie du
// plan à prix fixe ne tient plus — ces volumes relèvent de l'add-on Coop
// (multi-utilisateurs) ou d'un accord dédié.
export const PLAN_LIMITS: Record<Plan, number | null> = {
  decouverte: 3,
  cabinet: 20,
  portefeuille: 100,
  fonciere: 500,
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
  | "autoIndex";

const PLAN_ORDER: Plan[] = ["decouverte", "cabinet", "portefeuille", "fonciere"];

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
};

export function hasFeature(plan: Plan, feature: Feature): boolean {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(FEATURE_MIN_PLAN[feature]);
}

export function minPlanForFeature(feature: Feature): Plan {
  return FEATURE_MIN_PLAN[feature];
}

// L'add-on Coop (multi-utilisateurs + partage d'équipe) est un supplément
// payant indépendant du plan de base : il faut déjà être client payant
// (pas Découverte) pour pouvoir le souscrire.
export function canUseCoop(plan: Plan, coopActif: boolean): boolean {
  return coopActif && plan !== "decouverte";
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
