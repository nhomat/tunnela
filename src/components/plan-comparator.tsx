"use client";

import { useMemo, useState } from "react";
import { useApp } from "./providers";
import { PLANS } from "@/lib/stripe";
import { hasFeature } from "@/lib/types";
import type { Feature, Plan } from "@/lib/types";

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
  "search",
  "csvImport",
  "echeancier",
  "prioritySupport",
  "autoIndex",
  "dedicatedContact",
];

export function PlanComparator() {
  const { t } = useApp();
  const [nbBaux, setNbBaux] = useState(10);

  const recommended = useMemo(() => recommendPlan(nbBaux), [nbBaux]);

  return (
    <section id="comparateur" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <h2 className="font-serif text-3xl font-medium">{t.pricing.compareTitle}</h2>
        <p className="mt-2 text-[var(--foreground)]/70">{t.pricing.compareSubtitle}</p>
      </div>

      <div className="card mx-auto max-w-xl">
        <label htmlFor="nbBaux" className="mb-2 block text-sm font-medium">
          {t.pricing.compareLeasesLabel} : <span className="font-serif text-lg">{nbBaux}</span>
        </label>
        <input
          id="nbBaux"
          type="range"
          min={1}
          max={150}
          value={nbBaux}
          onChange={(e) => setNbBaux(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="mt-6 flex items-center justify-between rounded-lg bg-[var(--foreground)]/[0.04] px-4 py-3">
          <span className="text-sm text-[var(--foreground)]/70">{t.pricing.compareRecommended}</span>
          <span className="font-serif text-xl text-[var(--accent)]">
            {PLANS.find((p) => p.id === recommended)?.nom}
          </span>
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
    </section>
  );
}
