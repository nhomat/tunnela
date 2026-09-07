import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Compte les requêtes récentes pour un "bucket" (ex. "contact:1.2.3.4") et
 * enregistre celle-ci. Pensé pour les endpoints publics non authentifiés,
 * où il n'y a pas d'utilisateur à qui imputer un quota. Best-effort : une
 * erreur d'écriture ne bloque jamais la requête d'origine.
 */
export async function checkRateLimit(
  bucket: string,
  { max, windowMinutes }: { max: number; windowMinutes: number }
): Promise<{ allowed: boolean }> {
  try {
    const supabase = createAdminClient();
    const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

    const { count } = await supabase
      .from("rate_limit_hits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .gte("created_at", since);

    if ((count ?? 0) >= max) {
      return { allowed: false };
    }

    await supabase.from("rate_limit_hits").insert({ bucket });
    return { allowed: true };
  } catch {
    // Un problème d'infra (Supabase indisponible, mal configuré) ne doit
    // jamais transformer une simple limite de débit en panne totale de la
    // route appelante : on laisse passer la requête.
    return { allowed: true };
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
