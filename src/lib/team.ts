import type { createClient } from "./supabase/client";
import type { Plan } from "./types";

type SupabaseClient = ReturnType<typeof createClient>;

export interface TeamContext {
  equipeId: string | null;
  equipeNom: string | null;
  isOwner: boolean;
  effectivePlan: Plan;
}

export interface TeamMember {
  id: string;
  email: string;
  role: "proprietaire" | "membre";
  statut: "invite" | "actif";
  invited_at: string;
}

/**
 * Un abonnement Coop est payé par le propriétaire de l'équipe ; ses membres
 * gardent chacun leur propre compte mais héritent du plan "coop" tant qu'ils
 * sont actifs dans cette équipe, sans payer individuellement.
 */
export async function resolveTeamContext(
  supabase: SupabaseClient,
  userId: string,
  ownPlan: Plan
): Promise<TeamContext> {
  if (ownPlan === "coop") {
    const { data: equipe } = await supabase
      .from("equipes")
      .select("id, nom")
      .eq("proprietaire_user_id", userId)
      .maybeSingle();
    if (equipe) {
      return { equipeId: equipe.id, equipeNom: equipe.nom, isOwner: true, effectivePlan: "coop" };
    }
    return { equipeId: null, equipeNom: null, isOwner: false, effectivePlan: "coop" };
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
      .select("plan")
      .eq("user_id", equipeInfo.proprietaire_user_id)
      .maybeSingle();
    if (ownerAbo?.plan === "coop") {
      return {
        equipeId: membership.equipe_id,
        equipeNom: equipeInfo.nom,
        isOwner: false,
        effectivePlan: "coop",
      };
    }
  }

  return { equipeId: null, equipeNom: null, isOwner: false, effectivePlan: ownPlan };
}

export async function listTeamMembers(
  supabase: SupabaseClient,
  equipeId: string
): Promise<TeamMember[]> {
  const { data } = await supabase
    .from("membres_equipe")
    .select("id, email, role, statut, invited_at")
    .eq("equipe_id", equipeId)
    .order("invited_at", { ascending: true });
  return (data as TeamMember[]) ?? [];
}
