import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncCoopBilling } from "@/lib/coop-billing";

export async function POST(request: Request) {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { memberId } = (await request.json()) as { memberId?: string };
  if (!memberId) {
    return NextResponse.json({ error: "invalid_member" }, { status: 400 });
  }

  const { data: membre } = await authClient
    .from("membres_equipe")
    .select("id, equipes:equipe_id(proprietaire_user_id)")
    .eq("id", memberId)
    .maybeSingle();

  const equipeInfo = membre?.equipes as
    | { proprietaire_user_id: string }
    | { proprietaire_user_id: string }[]
    | null
    | undefined;
  const proprietaireId = Array.isArray(equipeInfo) ? equipeInfo[0]?.proprietaire_user_id : equipeInfo?.proprietaire_user_id;

  if (!membre || proprietaireId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await authClient.from("membres_equipe").delete().eq("id", memberId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await syncCoopBilling(createAdminClient(), user.id);

  return NextResponse.json({ removed: true });
}
