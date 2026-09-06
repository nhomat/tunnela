"use client";

import { useMemo, useState } from "react";
import { useApp } from "./providers";
import { PLANS } from "@/lib/stripe";
import type { Plan } from "@/lib/types";

const FEATURE_MATRIX: Record<Plan, { generator: boolean; alerts: boolean; prioritySupport: boolean; dedicatedContact: boolean }> = {
  decouverte: { generator: false, alerts: false, prioritySupport: false, dedicatedContact: false },
  cabinet: { generator: true, alerts: true, prioritySupport: false, dedicatedContact: false },
  portefeuille: { generator: true, alerts: true, prioritySupport: true, dedicatedContact: false },
  fonciere: { generator: true, alerts: true, prioritySupport: true, dedicatedContact: true },
};

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

export function PlanComparator() {
  const { t } = useApp();
  const [nbBaux, setNbBaux] = useState(10);

  const recommended = useMemo(() => recommendPlan(nbBaux), [nbBaux]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
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
            <tr className="border-b border-[var(--border-color)]">
              <td className="px-4 py-3 text-[var(--foreground)]/70">
                {t.pricing.compareFeatures.generator}
              </td>
              {PLANS.map((plan) => (
                <td key={plan.id} className="px-4 py-3 text-center">
                  <Check value={FEATURE_MATRIX[plan.id].generator} />
                </td>
              ))}
            </tr>
            <tr className="border-b border-[var(--border-color)]">
              <td className="px-4 py-3 text-[var(--foreground)]/70">
                {t.pricing.compareFeatures.alerts}
              </td>
              {PLANS.map((plan) => (
                <td key={plan.id} className="px-4 py-3 text-center">
                  <Check value={FEATURE_MATRIX[plan.id].alerts} />
                </td>
              ))}
            </tr>
            <tr className="border-b border-[var(--border-color)]">
              <td className="px-4 py-3 text-[var(--foreground)]/70">
                {t.pricing.compareFeatures.prioritySupport}
              </td>
              {PLANS.map((plan) => (
                <td key={plan.id} className="px-4 py-3 text-center">
                  <Check value={FEATURE_MATRIX[plan.id].prioritySupport} />
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-3 text-[var(--foreground)]/70">
                {t.pricing.compareFeatures.dedicatedContact}
              </td>
              {PLANS.map((plan) => (
                <td key={plan.id} className="px-4 py-3 text-center">
                  <Check value={FEATURE_MATRIX[plan.id].dedicatedContact} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
