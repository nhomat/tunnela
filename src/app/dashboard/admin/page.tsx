"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { useCurrentPlan } from "@/components/feature-gate";
import { PageLoading } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";
import { formatPrixMensuel } from "@/lib/stripe";
import type { Plan } from "@/lib/types";

const SPINNER_CYCLE_MS = 900;

type AdminStats = {
  totalUsers: number;
  actifCount: number;
  byPlan: Partial<Record<Plan, number>>;
  coopActifCount: number;
  bauxCount: number;
  mrrEstimate: number;
};

const PLAN_ORDER: Plan[] = ["decouverte", "cabinet", "portefeuille", "fonciere"];

export default function AdminPage() {
  const { t, locale } = useApp();
  const { isAdmin, loading: planLoading } = useCurrentPlan();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    void (async () => {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats((await res.json()) as AdminStats);
      setLoading(false);
    })();
  }, [isAdmin]);

  const showLoading = useHoldLoadingAnimation(planLoading || (isAdmin && loading), SPINNER_CYCLE_MS);

  if (showLoading) return <PageLoading />;

  if (!isAdmin) {
    return <p className="text-sm text-[var(--foreground)]/60">{t.admin.notAllowed}</p>;
  }

  return (
    <div className="tunnel-enter max-w-3xl">
      <div className="mb-2 flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="2.5" y="3" width="15" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2.5 8h15" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 5.5v-2M14 5.5v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.admin.overviewTitle}</h1>
      </div>
      <p className="mb-8 text-[var(--foreground)]/70">{t.admin.overviewSubtitle}</p>

      {!stats ? (
        <p className="text-sm text-[var(--foreground)]/60">{t.admin.prospectionError}</p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Link
              href="/dashboard/admin/comptes?filter=tous"
              className="card card-hover transition-base flex flex-col items-center gap-1 text-center"
            >
              <span className="font-serif text-3xl text-[var(--accent)]">{stats.totalUsers}</span>
              <span className="text-sm text-[var(--foreground)]/70">{t.admin.totalUsers}</span>
            </Link>
            <Link
              href="/dashboard/admin/comptes?filter=actifs"
              className="card card-hover transition-base flex flex-col items-center gap-1 text-center"
            >
              <span className="font-serif text-3xl text-[var(--accent)]">{stats.actifCount}</span>
              <span className="text-sm text-[var(--foreground)]/70">{t.admin.activeUsers}</span>
            </Link>
            <Link
              href="/dashboard/admin/comptes?filter=tous&sort=baux"
              className="card card-hover transition-base flex flex-col items-center gap-1 text-center"
            >
              <span className="font-serif text-3xl text-[var(--accent)]">{stats.bauxCount}</span>
              <span className="text-sm text-[var(--foreground)]/70">{t.admin.totalBaux}</span>
            </Link>
            <Link
              href="/dashboard/admin/comptes?filter=payants"
              className="card card-hover transition-base flex flex-col items-center gap-1 text-center"
            >
              <span className="font-serif text-3xl text-[var(--accent)]">
                {formatPrixMensuel(stats.mrrEstimate, locale)} €
              </span>
              <span className="text-sm text-[var(--foreground)]/70">{t.admin.mrrEstimate}</span>
            </Link>
            <Link
              href="/dashboard/admin/comptes?filter=coop"
              className="card card-hover transition-base flex flex-col items-center gap-1 text-center"
            >
              <span className="font-serif text-3xl text-[var(--accent)]">{stats.coopActifCount}</span>
              <span className="text-sm text-[var(--foreground)]/70">{t.admin.coopActive}</span>
            </Link>
          </div>
          <p className="mb-8 text-xs text-[var(--foreground)]/60">{t.admin.mrrEstimateHint}</p>

          <div className="card mb-8">
            <h2 className="mb-4 font-serif text-lg">{t.admin.byPlan}</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {PLAN_ORDER.map((plan) => (
                <li key={plan} className="border-b border-[var(--border-color)] last:border-0">
                  <Link
                    href={`/dashboard/admin/comptes?filter=${plan}`}
                    className="transition-base flex items-center justify-between py-2 hover:text-[var(--accent)]"
                  >
                    <span className="capitalize text-[var(--foreground)]/80">{plan}</span>
                    <span className="font-medium">{stats.byPlan[plan] ?? 0}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
