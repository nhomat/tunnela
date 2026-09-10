"use client";

import { useState } from "react";
import Image from "next/image";
import { useApp } from "@/components/providers";
import { useCurrentPlan } from "@/components/feature-gate";
import { PageLoading } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";
import { Reveal } from "@/components/reveal";
import type { Plan } from "@/lib/types";
import type { Dictionary } from "@/i18n/dictionary";

const SPINNER_CYCLE_MS = 900;
const PLAN_ORDER: Plan[] = ["decouverte", "cabinet", "portefeuille", "fonciere"];

type GuideStep = {
  titleKey: keyof Pick<
    Dictionary["tutoriel"],
    | "guidePortefeuilleTitle"
    | "guideRevisionTitle"
    | "guideCalculateurTitle"
    | "guideClauseTitle"
    | "guideEcheancierTitle"
  >;
  bodyKey: keyof Pick<
    Dictionary["tutoriel"],
    | "guidePortefeuilleBody"
    | "guideRevisionBody"
    | "guideCalculateurBody"
    | "guideClauseBody"
    | "guideEcheancierBody"
  >;
  src: string;
  width: number;
  height: number;
};

const GUIDE_STEPS: GuideStep[] = [
  {
    titleKey: "guidePortefeuilleTitle",
    bodyKey: "guidePortefeuilleBody",
    src: "/tutoriel/portefeuille.png",
    width: 1320,
    height: 640,
  },
  {
    titleKey: "guideRevisionTitle",
    bodyKey: "guideRevisionBody",
    src: "/tutoriel/revision.png",
    width: 900,
    height: 1100,
  },
  {
    titleKey: "guideCalculateurTitle",
    bodyKey: "guideCalculateurBody",
    src: "/tutoriel/calculateur.png",
    width: 1100,
    height: 800,
  },
  {
    titleKey: "guideClauseTitle",
    bodyKey: "guideClauseBody",
    src: "/tutoriel/clause.png",
    width: 1100,
    height: 820,
  },
  {
    titleKey: "guideEcheancierTitle",
    bodyKey: "guideEcheancierBody",
    src: "/tutoriel/echeancier.png",
    width: 1100,
    height: 760,
  },
];

export default function TutorielPage() {
  const { t } = useApp();
  const { plan, loading } = useCurrentPlan();
  const showLoading = useHoldLoadingAnimation(loading, SPINNER_CYCLE_MS);
  const [selected, setSelected] = useState<Plan | null>(null);

  if (showLoading) return <PageLoading />;

  const active = selected ?? plan ?? "decouverte";

  return (
    <div className="tunnel-enter max-w-4xl">
      <div className="mb-2 flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8.5 7l5 3-5 3V7Z" fill="currentColor" />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.tutoriel.title}</h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-[var(--foreground)]/70">{t.tutoriel.subtitle}</p>

      <div className="mb-6 flex max-w-2xl flex-wrap gap-2">
        {PLAN_ORDER.map((planId) => (
          <button
            key={planId}
            type="button"
            onClick={() => setSelected(planId)}
            className={`transition-base rounded-full px-4 py-2 text-sm font-medium ${
              active === planId
                ? "bg-[var(--accent)] text-[var(--color-prusse)]"
                : "border border-[var(--border-color)] hover:border-[var(--accent)]"
            }`}
          >
            {t.tutoriel.plans[planId].title}
            {plan === planId && <span className="ml-1 text-xs opacity-70">•</span>}
          </button>
        ))}
      </div>

      <ol className="mb-16 flex max-w-2xl flex-col gap-3">
        {t.tutoriel.plans[active].steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="tutoriel-step-index">{i + 1}</span>
            <span className="pt-0.5 text-[var(--foreground)]/80">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mb-8">
        <h2 className="font-serif text-2xl">{t.tutoriel.guideTitle}</h2>
        <p className="mt-1 text-sm text-[var(--foreground)]/70">{t.tutoriel.guideSubtitle}</p>
      </div>

      <div className="flex flex-col gap-12">
        {GUIDE_STEPS.map((step, i) => (
          <Reveal key={step.src} delay={i * 80}>
            <div className="card card-hover flex flex-col gap-4">
              <div>
                <h3 className="font-serif text-lg">{t.tutoriel[step.titleKey]}</h3>
                <p className="mt-1 text-sm text-[var(--foreground)]/70">{t.tutoriel[step.bodyKey]}</p>
              </div>
              <div className="overflow-hidden rounded-lg border border-[var(--border-color)]">
                <Image
                  src={step.src}
                  alt={t.tutoriel[step.titleKey]}
                  width={step.width}
                  height={step.height}
                  className="w-full"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
