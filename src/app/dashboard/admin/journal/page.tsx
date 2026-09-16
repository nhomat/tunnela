"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { useCurrentPlan } from "@/components/feature-gate";
import { PageLoading, TableSkeleton } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";

const SPINNER_CYCLE_MS = 900;
const SKELETON_CYCLE_MS = 1400;

type JournalEntry = {
  id: string;
  adminEmail: string;
  targetEmail: string;
  action: "delete" | "suspend";
  status: "confirmed" | "pending" | "expired";
  createdAt: string;
};

export default function AdminJournalPage() {
  const { t, locale } = useApp();
  const { isAdmin, loading: planLoading } = useCurrentPlan();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    void (async () => {
      const res = await fetch("/api/admin/journal");
      if (res.ok) setEntries(((await res.json()) as { entries: JournalEntry[] }).entries);
      setLoading(false);
    })();
  }, [isAdmin]);

  const showPlanLoading = useHoldLoadingAnimation(planLoading, SPINNER_CYCLE_MS);
  const showDataLoading = useHoldLoadingAnimation(isAdmin && loading, SKELETON_CYCLE_MS);

  if (showPlanLoading) return <PageLoading />;

  if (!isAdmin) {
    return <p className="text-sm text-[var(--foreground)]/60">{t.admin.notAllowed}</p>;
  }

  function statusLabel(status: JournalEntry["status"]) {
    if (status === "confirmed") return t.admin.journalStatusConfirmed;
    if (status === "expired") return t.admin.journalStatusExpired;
    return t.admin.journalStatusPending;
  }

  function actionLabel(action: JournalEntry["action"]) {
    return action === "delete" ? t.admin.deleteAccount : t.admin.suspendAccount;
  }

  return (
    <div className="tunnel-enter max-w-3xl">
      <div className="mb-2 flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 3.5h12v13H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M7 7h6M7 10h6M7 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.admin.journalTitle}</h1>
      </div>
      <p className="mb-8 text-[var(--foreground)]/70">{t.admin.journalSubtitle}</p>

      {showDataLoading ? (
        <TableSkeleton rows={6} />
      ) : !entries ? (
        <p className="card text-sm text-[var(--danger)]">{t.admin.prospectionError}</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-[var(--foreground)]/60">{t.admin.journalEmpty}</p>
      ) : (
        <div data-hscroll="true" className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--foreground)]/60">
                <th className="px-4 py-3">{t.admin.journalDate}</th>
                <th className="px-4 py-3">{t.admin.journalAdmin}</th>
                <th className="px-4 py-3">{t.admin.journalTarget}</th>
                <th className="px-4 py-3">{t.admin.journalAction}</th>
                <th className="px-4 py-3">{t.admin.journalStatus}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-[var(--border-color)] last:border-0">
                  <td className="px-4 py-3">
                    {new Date(entry.createdAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
                  </td>
                  <td className="px-4 py-3">{entry.adminEmail}</td>
                  <td className="px-4 py-3">{entry.targetEmail}</td>
                  <td className="px-4 py-3">{actionLabel(entry.action)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        entry.status === "confirmed"
                          ? "text-[var(--danger)]"
                          : entry.status === "pending"
                            ? "text-[var(--accent)]"
                            : "text-[var(--foreground)]/50"
                      }
                    >
                      {statusLabel(entry.status)}
                    </span>
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
