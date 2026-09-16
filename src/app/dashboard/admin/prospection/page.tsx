"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { useCurrentPlan } from "@/components/feature-gate";
import { PageLoading, TableSkeleton } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";

const SPINNER_CYCLE_MS = 900;
const SKELETON_CYCLE_MS = 1400;

type ReadyEntry = {
  nom: string;
  email: string;
  telephone: string;
  societe: string;
  type: string;
  fonctionnalite: string;
  statut: string;
};

type ProspectionData =
  | { configured: false }
  | { configured: true; ok: false; error: string }
  | {
      configured: true;
      ok: true;
      contacts: { total: number; contactedCount: number; byType: Record<string, number>; byReponse: Record<string, number> };
      ready: { total: number; list: ReadyEntry[] };
    };

export default function AdminProspectionPage() {
  const { t } = useApp();
  const { isAdmin, loading: planLoading } = useCurrentPlan();
  const [data, setData] = useState<ProspectionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    void (async () => {
      const res = await fetch("/api/admin/prospection");
      if (res.ok || res.status === 502) {
        setData((await res.json()) as ProspectionData);
      }
      setLoading(false);
    })();
  }, [isAdmin]);

  const showPlanLoading = useHoldLoadingAnimation(planLoading, SPINNER_CYCLE_MS);
  const showDataLoading = useHoldLoadingAnimation(isAdmin && loading, SKELETON_CYCLE_MS);

  if (showPlanLoading) return <PageLoading />;

  if (!isAdmin) {
    return <p className="text-sm text-[var(--foreground)]/60">{t.admin.notAllowed}</p>;
  }

  return (
    <div className="tunnel-enter max-w-3xl">
      <Link
        href="/dashboard/admin"
        className="transition-base mb-4 inline-block text-sm text-[var(--foreground)]/60 hover:text-[var(--accent)]"
      >
        {t.admin.backToAdmin}
      </Link>
      <div className="mb-2 flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2.5 16c0-2.8 2-4.5 4.5-4.5S11.5 13.2 11.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="14.5" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12.5 16c0-2.2 1.4-3.6 3-3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.admin.prospectionTitle}</h1>
      </div>
      <p className="mb-8 text-[var(--foreground)]/70">{t.admin.prospectionSubtitle}</p>

      {showDataLoading ? (
        <TableSkeleton rows={4} />
      ) : !data ? (
        <p className="card text-sm text-[var(--danger)]">{t.admin.prospectionError}</p>
      ) : !data.configured ? (
        <div className="card">
          <p className="mb-2 font-medium">{t.admin.prospectionNotConfigured}</p>
          <p className="text-sm text-[var(--foreground)]/70">{t.admin.prospectionNotConfiguredHint}</p>
        </div>
      ) : !data.ok ? (
        <p className="card text-sm text-[var(--danger)]">
          {t.admin.prospectionError} ({data.error})
        </p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="card flex flex-col items-center gap-1 text-center">
              <span className="font-serif text-3xl text-[var(--accent)]">{data.contacts.total}</span>
              <span className="text-sm text-[var(--foreground)]/70">{t.admin.totalContacts}</span>
            </div>
            <div className="card flex flex-col items-center gap-1 text-center">
              <span className="font-serif text-3xl text-[var(--accent)]">{data.contacts.contactedCount}</span>
              <span className="text-sm text-[var(--foreground)]/70">{t.admin.contactedContacts}</span>
            </div>
            <div className="card flex flex-col items-center gap-1 text-center">
              <span className="font-serif text-3xl text-[var(--accent)]">{data.ready.total}</span>
              <span className="text-sm text-[var(--foreground)]/70">{t.admin.readyTitle}</span>
            </div>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="card">
              <h2 className="mb-3 font-serif text-lg">{t.admin.byType}</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {Object.entries(data.contacts.byType).map(([type, count]) => (
                  <li key={type} className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 last:border-0 last:pb-0">
                    <span className="text-[var(--foreground)]/80">{type}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h2 className="mb-3 font-serif text-lg">{t.admin.byReponse}</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {Object.entries(data.contacts.byReponse).map(([reponse, count]) => (
                  <li key={reponse} className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 last:border-0 last:pb-0">
                    <span className="text-[var(--foreground)]/80">{reponse}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <h2 className="mb-3 font-serif text-lg">{t.admin.readyTitle}</h2>
          {data.ready.list.length === 0 ? (
            <p className="text-sm text-[var(--foreground)]/60">{t.admin.readyEmpty}</p>
          ) : (
            <div data-hscroll="true" className="card overflow-x-auto p-0">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--foreground)]/60">
                    <th className="px-4 py-3">{t.admin.readyName}</th>
                    <th className="px-4 py-3">{t.admin.readyEmail}</th>
                    <th className="px-4 py-3">{t.admin.readyPhone}</th>
                    <th className="px-4 py-3">{t.admin.readyCompany}</th>
                    <th className="px-4 py-3">{t.admin.readyType}</th>
                    <th className="px-4 py-3">{t.admin.readyFeature}</th>
                    <th className="px-4 py-3">{t.admin.readyStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ready.list.map((entry, i) => (
                    <tr key={`${entry.email}-${i}`} className="border-b border-[var(--border-color)] last:border-0">
                      <td className="px-4 py-3">{entry.nom}</td>
                      <td className="px-4 py-3">{entry.email}</td>
                      <td className="px-4 py-3">{entry.telephone}</td>
                      <td className="px-4 py-3">{entry.societe}</td>
                      <td className="px-4 py-3">{entry.type}</td>
                      <td className="px-4 py-3">{entry.fonctionnalite}</td>
                      <td className="px-4 py-3">{entry.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
