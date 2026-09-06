"use client";

import { useState } from "react";
import { useApp } from "./providers";
import { createClient } from "@/lib/supabase/client";
import { calculerRevisionLoyer, type IndexationResult } from "@/lib/indexation";
import { genererNotificationRevision } from "@/lib/clause-generator";
import { exportTextAsPdf } from "@/lib/pdf-export";
import { hasFeature, prochaineDateApres } from "@/lib/types";
import type { Bail, Plan } from "@/lib/types";
import { getLatestIndice } from "@/lib/indices";

export function RevisionPanel({
  bail,
  plan,
  onUpdated,
  onClose,
}: {
  bail: Bail;
  plan: Plan;
  onUpdated: () => void;
  onClose: () => void;
}) {
  const { t } = useApp();
  const canNotify = hasFeature(plan, "notifyEmail");
  const canAutoIndex = hasFeature(plan, "autoIndex");

  const [indiceNouveau, setIndiceNouveau] = useState("");
  const [autoIndexMessage, setAutoIndexMessage] = useState<string | null>(null);
  const [result, setResult] = useState<IndexationResult | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updated, setUpdated] = useState(false);

  const [bailleur, setBailleur] = useState("");
  const [dateEffet, setDateEffet] = useState("");
  const [notificationText, setNotificationText] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleAutoIndex() {
    const supabase = createClient();
    const latest = await getLatestIndice(supabase, bail.indice === "ICC" ? "ICC" : bail.indice);
    if (latest) {
      setIndiceNouveau(String(latest.valeur));
      setAutoIndexMessage(`${latest.valeur} (${latest.periode}, ${latest.source})`);
    } else {
      setAutoIndexMessage(t.revision.autoIndexNone);
    }
  }

  function handleCalculer(e: React.FormEvent) {
    e.preventDefault();
    if (bail.indice_reference === null || !indiceNouveau) return;
    setResult(
      calculerRevisionLoyer({
        loyerBase: bail.loyer_annuel,
        indiceReference: bail.indice_reference,
        indiceNouveau: Number(indiceNouveau),
        type: bail.indice === "ICC" ? "ILC" : bail.indice,
        clauseTunnel: bail.clause_tunnel
          ? {
              actif: true,
              planchmentPct: bail.plancher_pct ?? undefined,
              plafondPct: bail.plafond_pct ?? undefined,
            }
          : undefined,
      })
    );
    setUpdated(false);
  }

  async function handleUpdate() {
    if (!result) return;
    setUpdating(true);
    const supabase = createClient();
    await supabase
      .from("baux")
      .update({
        loyer_annuel: result.loyerRevise,
        indice_reference: Number(indiceNouveau),
        date_prochaine_revision: prochaineDateApres(bail.date_prochaine_revision, bail.periodicite),
        derniere_alerte_envoyee_le: null,
      })
      .eq("id", bail.id);
    setUpdating(false);
    setUpdated(true);
    onUpdated();
  }

  function handleGenerateNotification() {
    if (!result) return;
    const text = genererNotificationRevision({
      bailleur: bailleur || "[votre société]",
      preneur: bail.preneur,
      adresse: bail.adresse ?? "",
      ancienLoyer: bail.loyer_annuel,
      nouveauLoyer: result.loyerRevise,
      variationPct: result.variationAppliqueePct,
      indice: bail.indice,
      dateEffet: dateEffet || "[date d'effet]",
      clauseTunnelAppliquee: result.plafondApplique || result.plancherApplique,
    });
    setNotificationText(text);
  }

  function handleDownloadPdf() {
    exportTextAsPdf(
      t.revision.notifyTitle,
      notificationText,
      `notification-${bail.preneur}.pdf`.toLowerCase().replace(/\s+/g, "-")
    );
  }

  async function handleSendEmail() {
    if (!bail.preneur_email) return;
    setSendStatus("sending");
    try {
      const res = await fetch("/api/notifications/send-revision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: bail.preneur_email,
          subject: `Notification de révision de loyer — ${bail.preneur}`,
          text: notificationText,
        }),
      });
      if (!res.ok) throw new Error();
      setSendStatus("sent");
    } catch {
      setSendStatus("error");
    }
  }

  return (
    <div className="card tunnel-enter mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg">
          {t.revision.title} — {bail.preneur}
        </h2>
        <button type="button" onClick={onClose} className="text-sm text-[var(--foreground)]/60 hover:underline">
          {t.revision.close}
        </button>
      </div>

      {bail.indice_reference === null ? (
        <p className="text-sm text-[var(--danger)]">{t.revision.indiceReferenceMissing}</p>
      ) : (
        <>
          <form onSubmit={handleCalculer} className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t.baux.indiceReference}</span>
              <input className="input transition-base" value={bail.indice_reference} disabled />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t.revision.indiceNouveau}</span>
              <input
                type="number"
                step="0.01"
                required
                className="input transition-base"
                value={indiceNouveau}
                onChange={(e) => setIndiceNouveau(e.target.value)}
              />
              {canAutoIndex && (
                <button
                  type="button"
                  onClick={handleAutoIndex}
                  className="mt-1 text-xs text-[var(--accent)] hover:underline"
                >
                  {t.revision.autoIndexButton}
                </button>
              )}
            </label>
            <div className="flex items-end">
              <button type="submit" className="btn-primary transition-base w-full">
                {t.revision.calculer}
              </button>
            </div>
          </form>
          {autoIndexMessage && (
            <p className="mt-2 text-xs text-[var(--accent)]">{autoIndexMessage}</p>
          )}

          {result && (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <dl className="flex flex-col gap-2 text-sm">
                  <Row label={t.calculateur.variationAppliquee} value={`${result.variationAppliqueePct} %`} />
                  <Row
                    label={t.calculateur.loyerRevise}
                    value={`${result.loyerRevise.toLocaleString("fr-FR")} €`}
                    emphasis
                  />
                  <Row
                    label={t.calculateur.ecart}
                    value={`${result.ecart >= 0 ? "+" : ""}${result.ecart.toLocaleString("fr-FR")} €`}
                  />
                </dl>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={updating}
                  className="btn-primary transition-base mt-4 disabled:opacity-60"
                >
                  {t.revision.updateButton}
                </button>
                {updated && (
                  <p className="mt-2 text-sm text-[var(--success)]">{t.revision.updateSuccess}</p>
                )}
              </div>

              <div className="border-t border-[var(--border-color)] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <h3 className="mb-3 font-serif text-base">{t.revision.notifyTitle}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block font-medium">{t.clause.bailleur}</span>
                    <input
                      className="input transition-base"
                      value={bailleur}
                      onChange={(e) => setBailleur(e.target.value)}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-medium">{t.clause.dateEffet}</span>
                    <input
                      className="input transition-base"
                      placeholder="1er janvier 2027"
                      value={dateEffet}
                      onChange={(e) => setDateEffet(e.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateNotification}
                  className="btn-secondary transition-base mt-3 text-sm"
                >
                  {t.revision.generateNotification}
                </button>

                {notificationText && (
                  <>
                    <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-[var(--foreground)]/[0.03] p-3 font-sans text-xs">
                      {notificationText}
                    </pre>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        className="btn-secondary transition-base text-sm"
                      >
                        {t.clause.exportPdf}
                      </button>
                      {canNotify ? (
                        bail.preneur_email ? (
                          <button
                            type="button"
                            onClick={handleSendEmail}
                            disabled={sendStatus === "sending"}
                            className="btn-primary transition-base text-sm disabled:opacity-60"
                          >
                            {t.revision.sendEmail}
                          </button>
                        ) : (
                          <p className="text-xs text-[var(--accent)]">{t.revision.noEmail}</p>
                        )
                      ) : null}
                    </div>
                    {sendStatus === "sent" && (
                      <p className="mt-2 text-sm text-[var(--success)]">{t.revision.sendSuccess}</p>
                    )}
                    {sendStatus === "error" && (
                      <p className="mt-2 text-sm text-[var(--danger)]">{t.revision.sendError}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 last:border-0">
      <dt className="text-[var(--foreground)]/70">{label}</dt>
      <dd className={emphasis ? "font-serif text-lg" : "font-medium"}>{value}</dd>
    </div>
  );
}
