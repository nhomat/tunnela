"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { hasFeature } from "@/lib/types";
import type { Bail } from "@/lib/types";
import { RevisionPanel } from "@/components/revision-panel";
import { useCurrentPlan } from "@/components/feature-gate";
import { PageLoading } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";

const SPINNER_CYCLE_MS = 900;

function StatutPill({ statut, label }: { statut: Bail["statut"]; label: string }) {
  const colors: Record<Bail["statut"], string> = {
    conforme: "var(--success)",
    a_verifier: "var(--accent)",
    non_conforme: "var(--danger)",
  };
  return (
    <span
      className="rounded-full px-2 py-1 text-xs font-medium"
      style={{
        color: colors[statut],
        backgroundColor: `color-mix(in srgb, ${colors[statut]} 14%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}

export default function BailFocusPage() {
  const { t, setActiveBailId } = useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const { plan: effectivePlan } = useCurrentPlan();
  const plan = effectivePlan ?? "decouverte";

  const [allBaux, setAllBaux] = useState<Bail[]>([]);
  const [loading, setLoading] = useState(true);
  const [revising, setRevising] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const { data } = await supabase.from("baux").select("*").order("created_at", { ascending: false });
    if (data) setAllBaux(data as Bail[]);
    setLoading(false);
  }

  const bail = allBaux.find((b) => b.id === params.id) ?? null;
  const canRevise = hasFeature(plan, "revisionWorkflow");
  const showLoading = useHoldLoadingAnimation(loading, SPINNER_CYCLE_MS);

  // Consulter un bail ici en fait le bail actif pour les autres outils
  // (calculateur, clause), pour enchaîner sans ressaisir ses informations.
  useEffect(() => {
    if (bail) setActiveBailId(bail.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bail?.id]);

  if (showLoading) return <PageLoading />;

  if (!bail) {
    return (
      <div className="tunnel-enter max-w-lg">
        <p className="text-sm text-[var(--foreground)]/70">{t.baux.focusNotFound}</p>
        <Link href="/dashboard/baux" className="btn-secondary transition-base mt-4 inline-flex text-sm">
          {t.baux.focusBackToList}
        </Link>
      </div>
    );
  }

  return (
    <div className="tunnel-enter max-w-2xl">
      <Link
        href="/dashboard/baux"
        className="transition-base mb-6 inline-block text-sm text-[var(--foreground)]/60 hover:text-[var(--accent)]"
      >
        ← {t.baux.focusBackToList}
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PageIcon3D>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="4" y="3" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </PageIcon3D>
          <h1 className="font-serif text-2xl">{bail.preneur}</h1>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[var(--foreground)]/60">{t.baux.focusChangeLease}</span>
          <select
            className="input transition-base w-auto"
            value={bail.id}
            onChange={(e) => router.push(`/dashboard/baux/${e.target.value}`)}
          >
            {allBaux.map((b) => (
              <option key={b.id} value={b.id}>
                {b.preneur}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card mb-8 flex flex-col gap-3">
        <h2 className="font-serif text-lg">{t.baux.focusDetailsTitle}</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--foreground)]/60">{t.baux.adresse}</dt>
            <dd>{bail.adresse ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--foreground)]/60">{t.baux.loyer}</dt>
            <dd>{bail.loyer_annuel.toLocaleString("fr-FR")} €</dd>
          </div>
          <div>
            <dt className="text-[var(--foreground)]/60">{t.baux.indice}</dt>
            <dd>{bail.indice}</dd>
          </div>
          <div>
            <dt className="text-[var(--foreground)]/60">{t.baux.clauseTunnel}</dt>
            <dd>{bail.clause_tunnel ? "✓" : "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--foreground)]/60">{t.baux.prochaineRevision}</dt>
            <dd>{bail.date_prochaine_revision ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--foreground)]/60">{t.baux.statut}</dt>
            <dd>
              <StatutPill statut={bail.statut} label={t.baux.statuts[bail.statut]} />
            </dd>
          </div>
        </dl>
        <div className="mt-2 flex flex-wrap gap-3">
          {canRevise && !revising && (
            <button
              type="button"
              onClick={() => setRevising(true)}
              className="btn-primary transition-base"
            >
              {t.baux.reviser}
            </button>
          )}
          <Link href="/dashboard/calculateur" className="btn-secondary transition-base">
            {t.calculateur.title}
          </Link>
          <Link href="/dashboard/clause" className="btn-secondary transition-base">
            {t.clause.title}
          </Link>
        </div>
      </div>

      {revising && (
        <RevisionPanel
          bail={bail}
          plan={plan}
          onUpdated={() => void load()}
          onClose={() => setRevising(false)}
        />
      )}
    </div>
  );
}
