import { NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { nom, email, societe, telephone, message } = (await request.json()) as {
    nom?: string;
    email?: string;
    societe?: string;
    telephone?: string;
    message?: string;
  };

  if (!nom?.trim() || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "resend_not_configured" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.ALERT_FROM_EMAIL ?? "Tunnela <alertes@tunnela.fr>",
    to: process.env.CONTACT_EMAIL ?? "contact@tunnela.fr",
    replyTo: email,
    subject: `Demande de call — ${nom}${societe ? ` (${societe})` : ""}`,
    text: `Nouvelle demande de call depuis le site.\n\nNom : ${nom}\nEmail : ${email}\nTéléphone : ${telephone || "—"}\nSociété : ${societe || "—"}\n\nMessage :\n${message || "—"}`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
