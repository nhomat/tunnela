import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin.from("app_config").select("maintenance_mode").eq("id", 1).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ maintenanceMode: Boolean(data?.maintenance_mode) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { maintenanceMode } = (await request.json()) as { maintenanceMode?: boolean };
  if (typeof maintenanceMode !== "boolean") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("app_config")
    .update({ maintenance_mode: maintenanceMode, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ maintenanceMode });
}
