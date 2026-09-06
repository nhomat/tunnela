"use client";

import { useState } from "react";
import { useApp } from "@/components/providers";
import { calculerRevisionLoyer, type IndexationResult } from "@/lib/indexation";
import { useCurrentPlan } from "@/components/feature-gate";
import { hasFeature } from "@/lib/types";

export default function CalculateurPage() {
  const { t } = useApp();
  const { plan } = useCurrentPlan();
  const canAutoIndex = plan !== null && hasFeature(plan, "autoIndex");

  const [loyerBase, setLoyerBase] = useState("");
  const [indiceReference, setIndiceReference] = useState("");
  const [indiceNouveau, setIndiceNouveau] = useState("");
  const [type, setType] = useState<"ILC" | "ILAT">("ILC");
  const [clauseActive, setClauseActive] = useState(false);
  const [plancher, setPlancher] = useState("");
  const [plafond, setPlafond] = useState("");
  const [result, setResult] = useState<IndexationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAutoIndexInfo, setShowAutoIndexInfo] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = calculerRevisionLoyer({
        loyerBase: Number(loyerBase),
        indiceReference: Number(indiceReference),
        indiceNouveau: Number(indiceNouveau),
        type,
        clauseTunnel: clauseActive
          ? {
              actif: true,
              planchmentPct: plancher ? Number(plancher) : undefined,
              plafondPct: plafond ? Number(plafond) : undefined,
            }
          : undefined,
      });
      setResult(res);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : t.auth.error);
    }
  }

  return (
    <div className="tunnel-enter">
      <h1 className="mb-8 font-serif text-2xl">{t.calculateur.title}</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium">{t.calculateur.loyerBase}</span>
            <input
              type="number"
              step="0.01"
              required
              className="input transition-base"
              value={loyerBase}
              onChange={(e) => setLoyerBase(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">{t.calculateur.type}</span>
            <select
              className="input transition-base"
              value={type}
              onChange={(e) => setType(e.target.value as "ILC" | "ILAT")}
            >
              <option value="ILC">ILC</option>
              <option value="ILAT">ILAT</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t.calculateur.indiceReference}</span>
              <input
                type="number"
                step="0.01"
                required
                className="input transition-base"
                value={indiceReference}
                onChange={(e) => setIndiceReference(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t.calculateur.indiceNouveau}</span>
              <input
                type="number"
                step="0.01"
                required
                className="input transition-base"
                value={indiceNouveau}
                onChange={(e) => setIndiceNouveau(e.target.value)}
              />
            </label>
          </div>

          {canAutoIndex && (
            <div>
              <button
                type="button"
                onClick={() => setShowAutoIndexInfo(true)}
                className="btn-secondary transition-base text-sm"
              >
                {t.calculateur.autoIndexButton}
              </button>
              {showAutoIndexInfo && (
                <p className="mt-2 text-xs text-[var(--accent)]">
                  {t.calculateur.autoIndexComingSoon}
                </p>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={clauseActive}
              onChange={(e) => setClauseActive(e.target.checked)}
            />
            {t.calculateur.clauseTunnel}
          </label>

          {clauseActive && (
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t.calculateur.plancher}</span>
                <input
                  type="number"
                  step="0.01"
                  className="input transition-base"
                  value={plancher}
                  onChange={(e) => setPlancher(e.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">{t.calculateur.plafond}</span>
                <input
                  type="number"
                  step="0.01"
                  className="input transition-base"
                  value={plafond}
                  onChange={(e) => setPlafond(e.target.value)}
                />
              </label>
            </div>
          )}

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <button type="submit" className="btn-primary transition-base">
            {t.calculateur.calculer}
          </button>
        </form>

        <div className="card tunnel-enter">
          {result ? (
            <dl className="flex flex-col gap-4">
              <Row label={t.calculateur.variationBrute} value={`${result.variationBrutePct} %`} />
              <Row
                label={t.calculateur.variationAppliquee}
                value={`${result.variationAppliqueePct} %`}
              />
              <Row
                label={t.calculateur.loyerRevise}
                value={`${result.loyerRevise.toLocaleString("fr-FR")} €`}
                emphasis
              />
              <Row
                label={t.calculateur.ecart}
                value={`${result.ecart >= 0 ? "+" : ""}${result.ecart.toLocaleString("fr-FR")} €`}
              />
              {result.plafondApplique && (
                <p className="text-sm text-[var(--accent)]">{t.calculateur.plafondApplique}</p>
              )}
              {result.plancherApplique && (
                <p className="text-sm text-[var(--accent)]">{t.calculateur.plancherApplique}</p>
              )}
            </dl>
          ) : (
            <p className="text-sm text-[var(--foreground)]/60">—</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-[var(--foreground)]/70">{label}</dt>
      <dd className={emphasis ? "font-serif text-xl" : "text-sm font-medium"}>{value}</dd>
    </div>
  );
}
