"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Papa from "papaparse";
import { useApp } from "@/components/providers";
import { useCurrentPlan } from "@/components/feature-gate";
import { PageLoading, TableSkeleton } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";
import { PLANS } from "@/lib/stripe";
import type { Plan } from "@/lib/types";

const SPINNER_CYCLE_MS = 900;
const SKELETON_CYCLE_MS = 1400;
const PLAN_IDS: Plan[] = ["decouverte", "cabinet", "portefeuille", "fonciere"];

type Compte = {
  userId: string;
  email: string;
  plan: Plan;
  statut: string;
  coopActif: boolean;
  isAdmin: boolean;
  bauxCount: number;
  createdAt: string | null;
};

export default function AdminComptesPage() {
  return (
    <Suspense>
      <AdminComptesContent />
    </Suspense>
  );
}

function AdminComptesContent() {
  const { t, locale } = useApp();
  const { isAdmin, loading: planLoading } = useCurrentPlan();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") ?? "tous";
  const sort = searchParams.get("sort");

  const [comptes, setComptes] = useState<Compte[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    void (async () => {
      const res = await fetch("/api/admin/comptes");
      if (res.ok) setComptes(((await res.json()) as { comptes: Compte[] }).comptes);
      setLoading(false);
    })();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    if (!comptes) return [];
    let list = comptes;
    if (filter === "actifs") list = list.filter((c) => c.statut === "actif");
    else if (filter === "payants") list = list.filter((c) => c.statut === "actif" && c.plan !== "decouverte");
    else if (filter === "coop") list = list.filter((c) => c.coopActif);
    else if ((PLAN_IDS as string[]).includes(filter)) list = list.filter((c) => c.plan === filter);

    if (sort === "baux") list = [...list].sort((a, b) => b.bauxCount - a.bauxCount);

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) => c.email.toLowerCase().includes(q));

    return list;
  }, [comptes, filter, sort, search]);

  function exportCsv() {
    const rows = filtered.map((c) => [
      c.email,
      c.plan,
      c.statut,
      c.coopActif ? "oui" : "non",
      c.isAdmin ? "oui" : "non",
      String(c.bauxCount),
      c.createdAt ?? "",
    ]);
    const csv = Papa.unparse([
      ["Email", "Plan", "Statut", "Coop", "Admin", "Baux", "Créé le"],
      ...rows,
    ]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tunnela-comptes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filterLabel = useMemo(() => {
    if (filter === "actifs") return t.admin.comptesFilterActifs;
    if (filter === "payants") return t.admin.comptesFilterPayants;
    if (filter === "coop") return t.admin.comptesFilterCoop;
    const planDef = PLANS.find((p) => p.id === filter);
    if (planDef) return planDef.nom;
    return t.admin.comptesFilterAll;
  }, [filter, t]);

  const showPlanLoading = useHoldLoadingAnimation(planLoading, SPINNER_CYCLE_MS);
  const showDataLoading = useHoldLoadingAnimation(isAdmin && loading, SKELETON_CYCLE_MS);

  if (showPlanLoading) return <PageLoading />;

  if (!isAdmin) {
    return <p className="text-sm text-[var(--foreground)]/60">{t.admin.notAllowed}</p>;
  }

  return (
    <div className="tunnel-enter max-w-4xl">
      <Link
        href="/dashboard/admin"
        className="transition-base mb-4 inline-block text-sm text-[var(--foreground)]/60 hover:text-[var(--accent)]"
      >
        {t.admin.backToAdmin}
      </Link>
      <div className="mb-2 flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3.5 17c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.admin.comptesTitle}</h1>
      </div>
      <p className="mb-4 text-[var(--foreground)]/70">
        {filtered.length} · {filterLabel}
      </p>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.admin.comptesSearchPlaceholder}
          className="field-input sm:max-w-xs"
        />
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="transition-base rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
        >
          {t.admin.comptesExportCsv}
        </button>
      </div>

      {showDataLoading ? (
        <TableSkeleton rows={6} />
      ) : !comptes ? (
        <p className="card text-sm text-[var(--danger)]">{t.admin.prospectionError}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--foreground)]/60">{t.admin.comptesEmpty}</p>
      ) : (
        <div data-hscroll="true" className="card overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--foreground)]/60">
                <th className="px-4 py-3">{t.admin.comptesEmail}</th>
                <th className="px-4 py-3">{t.admin.comptesPlan}</th>
                <th className="px-4 py-3">{t.admin.comptesStatut}</th>
                <th className="px-4 py-3">{t.admin.comptesCoop}</th>
                <th className="px-4 py-3">{t.admin.comptesAdmin}</th>
                <th className="px-4 py-3">{t.admin.comptesBaux}</th>
                <th className="px-4 py-3">{t.admin.comptesCreatedAt}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((compte) => (
                <tr
                  key={compte.userId}
                  className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--accent)]/5"
                >
                  <td className="p-0">
                    <Link
                      href={`/dashboard/admin/comptes/${compte.userId}`}
                      className="transition-base block px-4 py-3 hover:text-[var(--accent)]"
                    >
                      {compte.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{compte.plan}</td>
                  <td className="px-4 py-3">{compte.statut}</td>
                  <td className="px-4 py-3">{compte.coopActif ? t.admin.yes : t.admin.no}</td>
                  <td className="px-4 py-3">{compte.isAdmin ? t.admin.yes : t.admin.no}</td>
                  <td className="px-4 py-3">{compte.bauxCount}</td>
                  <td className="px-4 py-3">
                    {compte.createdAt
                      ? new Date(compte.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
