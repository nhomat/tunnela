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

export function calculerStatutConformite(
  bail: Pick<Bail, "indice" | "clause_tunnel">
): StatutConformite {
  if (bail.indice === "ICC") return "non_conforme";
  if (bail.clause_tunnel && (bail.indice === "ILC" || bail.indice === "ILAT")) {
    return "conforme";
  }
  return "a_verifier";
}
