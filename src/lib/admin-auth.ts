import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Vérifie que l'appelant est authentifié et admin, pour les routes
// /api/admin/*. Toujours re-vérifié côté serveur via createClient()
// (RLS-scopé à la ligne de l'appelant) : on ne fait jamais confiance à un
// état "isAdmin" côté client.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) } as const;
  }

  const { data: own } = await supabase
    .from("abonnements")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!own?.is_admin) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) } as const;
  }

  return { user } as const;
}
