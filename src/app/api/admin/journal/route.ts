import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const USERS_PAGE_SIZE = 1000;
const JOURNAL_LIMIT = 200;

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const admin = createAdminClient();

  const [{ data: rows, error }, usersResult] = await Promise.all([
    admin
      .from("admin_action_codes")
      .select("id, admin_user_id, target_user_id, action, used, method, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(JOURNAL_LIMIT),
    admin.auth.admin.listUsers({ page: 1, perPage: USERS_PAGE_SIZE }),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (usersResult.error) {
    return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
  }

  const emailByUserId = new Map<string, string>();
  for (const u of usersResult.data.users) {
    if (u.email) emailByUserId.set(u.id, u.email);
  }

  const entries = (rows ?? []).map((row) => {
    const expired = new Date(row.expires_at as string) < new Date();
    const status = row.used ? "confirmed" : expired ? "expired" : "pending";
    return {
      id: row.id as string,
      adminEmail: emailByUserId.get(row.admin_user_id as string) ?? row.admin_user_id,
      targetEmail: emailByUserId.get(row.target_user_id as string) ?? row.target_user_id,
      action: row.action as string,
      status,
      method: (row.method as string) ?? "email",
      createdAt: row.created_at as string,
    };
  });

  return NextResponse.json({ entries });
}
