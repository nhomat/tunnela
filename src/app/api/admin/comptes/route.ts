import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Plan } from "@/lib/types";

const USERS_PAGE_SIZE = 1000;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: own } = await supabase
    .from("abonnements")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!own?.is_admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const [{ data: abonnements, error: abonnementsError }, usersResult, { data: bauxRows, error: bauxError }] =
    await Promise.all([
      admin.from("abonnements").select("user_id, plan, is_admin, statut, coop_actif"),
      admin.auth.admin.listUsers({ page: 1, perPage: USERS_PAGE_SIZE }),
      admin.from("baux").select("user_id"),
    ]);

  if (abonnementsError) {
    return NextResponse.json({ error: abonnementsError.message }, { status: 500 });
  }
  if (usersResult.error) {
    return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
  }
  if (bauxError) {
    return NextResponse.json({ error: bauxError.message }, { status: 500 });
  }

  const emailByUserId = new Map<string, string>();
  const createdAtByUserId = new Map<string, string | null>();
  for (const u of usersResult.data.users) {
    if (u.email) emailByUserId.set(u.id, u.email);
    createdAtByUserId.set(u.id, u.created_at ?? null);
  }

  const bauxCountByUserId = new Map<string, number>();
  for (const row of bauxRows ?? []) {
    const key = row.user_id as string;
    bauxCountByUserId.set(key, (bauxCountByUserId.get(key) ?? 0) + 1);
  }

  const comptes = (abonnements ?? []).map((row) => ({
    userId: row.user_id as string,
    email: emailByUserId.get(row.user_id as string) ?? "",
    plan: row.plan as Plan,
    statut: row.statut as string,
    coopActif: Boolean(row.coop_actif),
    isAdmin: Boolean(row.is_admin),
    bauxCount: bauxCountByUserId.get(row.user_id as string) ?? 0,
    createdAt: createdAtByUserId.get(row.user_id as string) ?? null,
  }));

  return NextResponse.json({ comptes });
}
