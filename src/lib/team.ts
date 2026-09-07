import type { createClient } from "./supabase/client";
import type { Plan } from "./types";

type SupabaseClient = ReturnType<typeof createClient>;

export interface TeamContext {
  equipeId: string | null;
  equipeNom: string | null;
  isOwner: boolean;
  /** true si CE compte (propriétaire ou membre actif) a accès aux fonctionnalités Coop. */
  coopAccess: boolean;
  /** Plan à utiliser pour les limites/fonctionnalités : le sien, ou celui du
   * propriétaire de l'équipe si membre actif d'une équipe Coop active. */
  effectivePlan: Plan;
}

export interface TeamMember {
  id: string;
  user_id: string | null;
  email: string;
  role: "proprietaire" | "membre";
  statut: "invite" | "actif";
  invited_at: string;
}

/**
 * Coop est un add-on payé par le propriétaire de l'équipe (coop_actif sur
 * son abonnement) ; ses membres gardent chacun leur propre compte et
 * héritent de l'accès aux fonctionnalités d'équipe tant qu'ils sont actifs
 * dans cette équipe, sans souscrire individuellement.
 */
export async function resolveTeamContext(
  supabase: SupabaseClient,
  userId: string,
  ownPlan: Plan,
  ownCoopActif: boolean
): Promise<TeamContext> {
  if (ownCoopActif) {
    const { data: equipe } = await supabase
      .from("equipes")
      .select("id, nom")
      .eq("proprietaire_user_id", userId)
      .maybeSingle();
    if (equipe) {
      return {
        equipeId: equipe.id,
        equipeNom: equipe.nom,
        isOwner: true,
        coopAccess: true,
        effectivePlan: ownPlan,
      };
    }
    return { equipeId: null, equipeNom: null, isOwner: false, coopAccess: true, effectivePlan: ownPlan };
  }

  const { data: membership } = await supabase
    .from("membres_equipe")
    .select("equipe_id, equipes:equipe_id(nom, proprietaire_user_id)")
    .eq("user_id", userId)
    .eq("statut", "actif")
    .maybeSingle();

  const equipesRaw = membership?.equipes as
    | { nom: string; proprietaire_user_id: string }
    | { nom: string; proprietaire_user_id: string }[]
    | null
    | undefined;
  const equipeInfo = Array.isArray(equipesRaw) ? (equipesRaw[0] ?? null) : (equipesRaw ?? null);

  if (membership?.equipe_id && equipeInfo?.proprietaire_user_id) {
    const { data: ownerAbo } = await supabase
      .from("abonnements")
      .select("plan, coop_actif")
      .eq("user_id", equipeInfo.proprietaire_user_id)
      .maybeSingle();
    if (ownerAbo?.coop_actif) {
      return {
        equipeId: membership.equipe_id,
        equipeNom: equipeInfo.nom,
        isOwner: false,
        coopAccess: true,
        effectivePlan: ownerAbo.plan as Plan,
      };
    }
  }

  return { equipeId: null, equipeNom: null, isOwner: false, coopAccess: false, effectivePlan: ownPlan };
}

export async function listTeamMembers(
  supabase: SupabaseClient,
  equipeId: string
): Promise<TeamMember[]> {
  const { data } = await supabase
    .from("membres_equipe")
    .select("id, user_id, email, role, statut, invited_at")
    .eq("equipe_id", equipeId)
    .order("invited_at", { ascending: true });
  return (data as TeamMember[]) ?? [];
}

export interface TeamMessage {
  id: string;
  user_id: string;
  contenu: string;
  created_at: string;
}

export async function listTeamMessages(
  supabase: SupabaseClient,
  equipeId: string
): Promise<TeamMessage[]> {
  const { data } = await supabase
    .from("messages_equipe")
    .select("id, user_id, contenu, created_at")
    .eq("equipe_id", equipeId)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data as TeamMessage[]) ?? [];
}
