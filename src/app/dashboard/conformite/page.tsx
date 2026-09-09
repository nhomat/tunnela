"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { calculerStatutConformite } from "@/lib/types";
import type { Bail } from "@/lib/types";
import { PageLoading } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";

const SPINNER_CYCLE_MS = 900;

export default function ConformitePage() {
  const { t } = useApp();
  const supabase = useMemo(() => createClient(), []);
  const [baux, setBaux] = useState<Bail[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoading = useHoldLoadingAnimation(loading, SPINNER_CYCLE_MS);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("baux")
        .select("id, preneur, adresse, indice, clause_tunnel, statut")
        .eq("user_id", user.id);
      if (data) setBaux(data as Bail[]);
      setLoading(false);
    })();
  }, [supabase]);

  if (showLoading) return <PageLoading />;

  const total = baux.length;
  const conformes = baux.filter((b) => calculerStatutConformite(b) === "conforme").length;
  const pct = total > 0 ? Math.round((conformes / total) * 100) : 0;
  const attention = baux.filter((b) => calculerStatutConformite(b) !== "conforme");

  function reason(bail: Bail): string {
    return bail.indice === "ICC" ? t.conformite.why.icc : t.conformite.why.noClause;
  }

  return (
    <div className="tunnel-enter max-w-2xl">
      <div className="mb-2 flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 2.5l6.5 3v5c0 4-2.7 6.7-6.5 8-3.8-1.3-6.5-4-6.5-8v-5l6.5-3Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M7 10l2 2 4-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.conformite.title}</h1>
      </div>
      <p className="mb-8 text-[var(--foreground)]/70">{t.conformite.subtitle}</p>

      {total === 0 ? (
        <p className="text-sm text-[var(--foreground)]/60">{t.conformite.noLeases}</p>
      ) : (
        <>
          <div className="card mb-8 flex flex-col items-center gap-2 text-center">
            <span className="font-serif text-5xl text-[var(--accent)]">{pct}%</span>
            <span className="text-sm text-[var(--foreground)]/70">
              {conformes} / {total} {t.dashboard.conformity.toLowerCase()}
            </span>
          </div>

          <div className="card mb-8 flex flex-col gap-3">
            <h2 className="font-serif text-lg">{t.conformite.howItWorksTitle}</h2>
            <ul className="flex flex-col gap-2 text-sm text-[var(--foreground)]/80">
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-0.5 text-[var(--danger)]">✗</span>
                <span>{t.conformite.rule1}</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-0.5 text-[var(--success)]">✓</span>
                <span>{t.conformite.rule2}</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-0.5 text-[var(--accent)]">!</span>
                <span>{t.conformite.rule3}</span>
              </li>
            </ul>
            <p className="mt-2 text-xs text-[var(--foreground)]/60">{t.conformite.formula}</p>
          </div>

          {attention.length === 0 ? (
            <p className="text-sm text-[var(--success)]">{t.conformite.allCompliant}</p>
          ) : (
            <div className="card">
              <h2 className="mb-1 font-serif text-lg">{t.conformite.needsAttentionTitle}</h2>
              <p className="mb-4 text-sm text-[var(--foreground)]/70">{t.conformite.howToFixBody}</p>
              <ul className="flex flex-col gap-3">
                {attention.map((bail) => (
                  <li key={bail.id}>
                    <Link
                      href={`/dashboard/baux/${bail.id}`}
                      className="transition-base flex items-center justify-between gap-4 rounded-lg border border-[var(--border-color)] px-4 py-3 hover:border-[var(--accent)]/40 hover:bg-[var(--foreground)]/[0.03]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{bail.preneur}</p>
                        <p className="truncate text-xs text-[var(--foreground)]/60">{reason(bail)}</p>
                      </div>
                      <span aria-hidden="true" className="shrink-0 text-[var(--accent)]">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/clause" className="btn-secondary transition-base mt-6 inline-flex text-sm">
                {t.conformite.goToClauseTool}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
