import type { createClient } from "./supabase/client";
import type { IndexType } from "./types";

type SupabaseClient = ReturnType<typeof createClient>;

export interface IndicePublie {
  id: string;
  indice: IndexType;
  periode: string;
  valeur: number;
  source: string;
}

/** Dernière valeur publiée connue pour un type d'indice (ILC/ILAT/ICC). */
export async function getLatestIndice(
  supabase: SupabaseClient,
  indice: IndexType
): Promise<IndicePublie | null> {
  const { data } = await supabase
    .from("indices_publies")
    .select("id, indice, periode, valeur, source")
    .eq("indice", indice)
    .order("periode", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as IndicePublie) ?? null;
}

export async function listIndices(supabase: SupabaseClient): Promise<IndicePublie[]> {
  const { data } = await supabase
    .from("indices_publies")
    .select("id, indice, periode, valeur, source")
    .order("periode", { ascending: false });
  return (data as IndicePublie[]) ?? [];
}
