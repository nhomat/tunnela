"use client";

import { useState } from "react";
import { useApp } from "@/components/providers";
import { useCurrentPlan } from "@/components/feature-gate";
import { PageLoading } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";
import type { Plan } from "@/lib/types";

const SPINNER_CYCLE_MS = 900;
const PLAN_ORDER: Plan[] = ["decouverte", "cabinet", "portefeuille", "fonciere"];

export default function TutorielPage() {
  const { t } = useApp();
  const { plan, loading } = useCurrentPlan();
  const showLoading = useHoldLoadingAnimation(loading, SPINNER_CYCLE_MS);
  const [selected, setSelected] = useState<Plan | null>(null);

  if (showLoading) return <PageLoading />;

  const active = selected ?? plan ?? "decouverte";

  return (
    <div className="tunnel-enter max-w-2xl">
      <div className="mb-2 flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8.5 7l5 3-5 3V7Z" fill="currentColor" />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.tutoriel.title}</h1>
      </div>
      <p className="mb-6 text-sm text-[var(--foreground)]/70">{t.tutoriel.subtitle}</p>

      <div className="mb-6 flex flex-wrap gap-2">
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

      <div className="card card-hover tunnel-visual-frame mb-6 flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden">
        <span className="tutoriel-play-badge">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M7 5.5L16 11L7 16.5V5.5Z" fill="currentColor" />
          </svg>
        </span>
        <p className="text-sm text-[var(--foreground)]/60">{t.tutoriel.videoComingSoon}</p>
      </div>

      <ol className="flex flex-col gap-3">
        {t.tutoriel.plans[active].steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm">
            <span className="tutoriel-step-index">{i + 1}</span>
            <span className="pt-0.5 text-[var(--foreground)]/80">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
