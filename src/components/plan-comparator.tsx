"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "./providers";
import { PLANS, COOP_ADDON_NOM, COOP_ADDON_PRIX_MENSUEL } from "@/lib/stripe";
import { hasFeature } from "@/lib/types";
import type { Feature, Plan } from "@/lib/types";

const SLIDER_MAX = 150;

function recommendPlan(nbBaux: number): Plan {
  if (nbBaux <= 3) return "decouverte";
  if (nbBaux <= 20) return "cabinet";
  if (nbBaux <= 100) return "portefeuille";
  return "fonciere";
}

function Check({ value }: { value: boolean }) {
  return value ? (
    <span aria-hidden="true" className="text-[var(--success)]">
      ✓
    </span>
  ) : (
    <span aria-hidden="true" className="text-[var(--foreground)]/25">
      —
    </span>
  );
}

const FEATURE_ROWS: Feature[] = [
  "generator",
  "pdfExport",
  "alerts",
  "revisionWorkflow",
  "search",
  "csvImport",
  "echeancier",
  "notifyEmail",
  "prioritySupport",
  "autoIndex",
  "dedicatedContact",
];

export function PlanComparator({ onSelect }: { onSelect?: (plan: Plan) => void }) {
  const { t } = useApp();
  const router = useRouter();
  const [nbBaux, setNbBaux] = useState(10);

  const recommended = useMemo(() => recommendPlan(nbBaux), [nbBaux]);
  const isMax = nbBaux >= SLIDER_MAX;
  const thumbScale = 1 + (nbBaux / SLIDER_MAX) ** 3 * 0.8;

  function handleSelectRecommended() {
    if (onSelect) {
      onSelect(recommended);
    } else {
      router.push("/signup");
    }
  }

  return (
    <section id="comparateur" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <h2 className="font-serif text-3xl font-medium">{t.pricing.compareTitle}</h2>
        <p className="mt-2 text-[var(--foreground)]/70">{t.pricing.compareSubtitle}</p>
      </div>

      <div className="card mx-auto max-w-xl">
        <label htmlFor="nbBaux" className="mb-2 block text-sm font-medium">
          {t.pricing.compareLeasesLabel} :{" "}
          <span className="font-serif text-lg">{isMax ? "150+" : nbBaux}</span>
        </label>
        <input
          id="nbBaux"
          type="range"
          min={1}
          max={SLIDER_MAX}
          value={nbBaux}
          onChange={(e) => setNbBaux(Number(e.target.value))}
          className="range-slider"
          style={{ "--thumb-scale": thumbScale } as CSSProperties}
        />
        <div className="plan-recommend-box mt-6">
          <button
            type="button"
            onClick={handleSelectRecommended}
            key={recommended}
            className="plan-flip card-hover flex w-full flex-wrap items-center justify-between gap-4 rounded-lg bg-[var(--foreground)]/[0.04] px-4 py-3 text-left"
          >
            <div>
              <span className="text-sm text-[var(--foreground)]/70">{t.pricing.compareRecommended}</span>
              <p className="font-serif text-xl text-[var(--accent)]">
                {PLANS.find((p) => p.id === recommended)?.nom}
              </p>
            </div>
            <span className="btn-primary transition-base pointer-events-none text-sm">{t.pricing.cta}</span>
          </button>
        </div>
      </div>

      <h3 className="mb-6 mt-16 text-center font-serif text-2xl">{t.pricing.compareTableTitle}</h3>
      <div className="overflow-x-auto">
        <table className="mx-auto w-full max-w-4xl min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--foreground)]/60">
                {t.pricing.compareFeatureCol}
              </th>
              {PLANS.map((plan) => (
                <th
                  key={plan.id}
                  className={`px-4 py-3 text-center font-serif text-base font-normal ${
                    plan.id === recommended ? "text-[var(--accent)]" : ""
                  }`}
                >
                  {plan.nom}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border-color)]">
              <td className="px-4 py-3 text-[var(--foreground)]/70">
                {t.pricing.compareFeatures.maxLeases}
              </td>
              {PLANS.map((plan) => (
                <td key={plan.id} className="px-4 py-3 text-center">
                  {plan.limiteBaux === null ? "∞" : plan.limiteBaux}
                </td>
              ))}
            </tr>
            <tr className="border-b border-[var(--border-color)]">
              <td className="px-4 py-3 text-[var(--foreground)]/70">
                {t.pricing.compareFeatures.calculator}
              </td>
              {PLANS.map((plan) => (
                <td key={plan.id} className="px-4 py-3 text-center">
                  <Check value={true} />
                </td>
              ))}
            </tr>
            {FEATURE_ROWS.map((feature) => (
              <tr key={feature} className="border-b border-[var(--border-color)] last:border-0">
                <td className="px-4 py-3 text-[var(--foreground)]/70">
                  {t.pricing.compareFeatures[feature]}
                </td>
                {PLANS.map((plan) => (
                  <td key={plan.id} className="px-4 py-3 text-center">
                    <Check value={hasFeature(plan.id, feature)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[var(--foreground)]/60">
        {t.pricing.addonNote.replace("{nom}", COOP_ADDON_NOM).replace("{prix}", String(COOP_ADDON_PRIX_MENSUEL))}
      </p>
    </section>
  );
}
