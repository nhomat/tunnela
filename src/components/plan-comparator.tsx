"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "./providers";
import { PLANS, COOP_ADDON_NOM, COOP_ADDON_PRIX_PAR_PERSONNE } from "@/lib/stripe";
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
  const [openPlan, setOpenPlan] = useState<Plan | null>(null);

  const recommended = useMemo(() => recommendPlan(nbBaux), [nbBaux]);
  const isMax = nbBaux >= SLIDER_MAX;
  const thumbScale = 0.85 + (nbBaux / SLIDER_MAX) * 0.35;

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

      {/* Mobile : un tableau de 4 colonnes force le défilement horizontal
          et un texte tassé illisible sur petit écran. On le remplace par un
          accordéon (un plan à la fois), repliable, avec la même donnée. */}
      <div className="mx-auto flex max-w-xl flex-col gap-3 sm:hidden">
        {PLANS.map((plan) => {
          const open = openPlan === plan.id;
          return (
            <div key={plan.id} className="card">
              <button
                type="button"
                onClick={() => setOpenPlan(open ? null : plan.id)}
                className="transition-base flex w-full items-center justify-between gap-4 text-left"
                aria-expanded={open}
              >
                <span
                  className={`font-serif text-lg ${
                    plan.id === recommended ? "text-[var(--accent)]" : ""
                  }`}
                >
                  {plan.nom}
                </span>
                <span
                  aria-hidden="true"
                  className={`transition-base flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] ${
                    open ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <ul className="mt-4 flex flex-col gap-2 text-sm">
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-[var(--foreground)]/70">{t.pricing.compareFeatures.maxLeases}</span>
                      <span>{plan.limiteBaux === null ? "∞" : plan.limiteBaux}</span>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="text-[var(--foreground)]/70">{t.pricing.compareFeatures.calculator}</span>
                      <Check value={true} />
                    </li>
                    {FEATURE_ROWS.map((feature) => (
                      <li key={feature} className="flex items-center justify-between gap-2">
                        <span className="text-[var(--foreground)]/70">{t.pricing.compareFeatures[feature]}</span>
                        <Check value={hasFeature(plan.id, feature)} />
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/offres/${plan.id}`}
                    className="transition-base mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
                  >
                    {plan.nom} →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mx-auto hidden max-w-4xl overflow-x-auto sm:block">
        <table className="w-full min-w-[560px] text-left text-sm">
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
                  <Link href={`/offres/${plan.id}`} className="transition-base hover:text-[var(--accent)]">
                    {plan.nom}
                  </Link>
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

      <div className="card card-hover mx-auto mt-10 flex max-w-2xl flex-col items-center gap-3 border-[var(--accent)]/40 bg-[var(--accent)]/[0.06] text-center">
        <p className="text-base text-[var(--foreground)]/85">
          {t.pricing.addonNote.replace("{nom}", COOP_ADDON_NOM).replace("{prix}", String(COOP_ADDON_PRIX_PAR_PERSONNE))}
        </p>
        <Link href="/#tarifs" className="btn-primary transition-base text-sm">
          {t.pricing.addonNoteCta.replace("{nom}", COOP_ADDON_NOM)}
        </Link>
      </div>
    </section>
  );
}
