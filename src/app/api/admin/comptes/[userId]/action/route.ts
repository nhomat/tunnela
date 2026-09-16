import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

const CODE_TTL_MINUTES = 10;
const ACTIONS = ["delete", "suspend"] as const;
type SensitiveAction = (typeof ACTIONS)[number];

function isSensitiveAction(value: unknown): value is SensitiveAction {
  return typeof value === "string" && (ACTIONS as readonly string[]).includes(value);
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Actions admin destructrices (suppression, blocage temporaire d'un compte) :
// exigent un code à 6 chiffres envoyé par email à tunnela.team@gmail.com et
// noa972971@gmail.com avant exécution, en deux temps (step "request" puis
// "confirm").
export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { userId } = await params;

  if (userId === auth.user.id) {
    return NextResponse.json({ error: "cannot_target_self" }, { status: 400 });
  }

  const body = (await request.json()) as { step?: string; action?: string; code?: string };

  if (!isSensitiveAction(body.action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
  const action = body.action;

  const admin = createAdminClient();

  if (body.step === "confirm") {
    if (!body.code) {
      return NextResponse.json({ error: "missing_code" }, { status: 400 });
    }

    const { data: pending } = await admin
      .from("admin_action_codes")
      .select("id, code, expires_at")
      .eq("admin_user_id", auth.user.id)
      .eq("target_user_id", userId)
      .eq("action", action)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!pending || pending.code !== body.code || new Date(pending.expires_at as string) < new Date()) {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }

    await admin.from("admin_action_codes").update({ used: true }).eq("id", pending.id as string);

    if (action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ done: true, action });
    }

    const { error } = await admin.from("abonnements").update({ statut: "suspendu" }).eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ done: true, action });
  }

  const { allowed } = await checkRateLimit(`admin-action-code:${auth.user.id}`, {
    max: 10,
    windowMinutes: 10,
  });
  if (!allowed) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const { data: targetUser, error: targetUserError } = await admin.auth.admin.getUserById(userId);
  if (targetUserError || !targetUser?.user) {
    return NextResponse.json({ error: "compte introuvable" }, { status: 404 });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();

  const { error: insertError } = await admin.from("admin_action_codes").insert({
    admin_user_id: auth.user.id,
    target_user_id: userId,
    action,
    code,
    expires_at: expiresAt,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const actionLabel = action === "delete" ? "suppression" : "blocage temporaire";
    const recipients = [
      process.env.ADMIN_ACTION_CONFIRM_EMAIL ?? "tunnela.team@gmail.com",
      process.env.ADMIN_ACTION_CONFIRM_EMAIL_SECONDARY ?? "noa972971@gmail.com",
    ];
    const { error: sendError } = await resend.emails.send({
      from: process.env.ALERT_FROM_EMAIL ?? "Tunnela <alertes@tunnela.fr>",
      to: recipients,
      subject: `Code de confirmation — ${actionLabel} de compte sur Tunnela`,
      text: `Bonjour,\n\nUne demande de ${actionLabel} a été initiée pour le compte ${targetUser.user.email} par l'administrateur ${auth.user.email}.\n\nCode de confirmation : ${code}\n\nCe code expire dans ${CODE_TTL_MINUTES} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nL'équipe Tunnela`,
    });
    if (sendError) {
      console.error("admin action code email failed", sendError);
    }
  }

  return NextResponse.json({ sent: true });
}
