"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { FeatureGate, useCurrentPlan } from "@/components/feature-gate";
import { TableSkeleton } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import type { Bail } from "@/lib/types";

const SKELETON_CYCLE_MS = 1400;

export default function EcheancierPage() {
  const { plan } = useCurrentPlan();

  return (
    <FeatureGate feature="echeancier" plan={plan}>
      <Echeancier />
    </FeatureGate>
  );
}

function Echeancier() {
  const { t } = useApp();
  const [baux, setBaux] = useState<Bail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data } = await supabase
        .from("baux")
        .select("*")
        .order("date_prochaine_revision", { ascending: true, nullsFirst: false });
      if (data) setBaux(data as Bail[]);
      setLoading(false);
    })();
  }, []);

  const groups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    const within30: Bail[] = [];
    const upcoming: Bail[] = [];
    const noDate: Bail[] = [];

    for (const bail of baux) {
      if (!bail.date_prochaine_revision) {
        noDate.push(bail);
        continue;
      }
      const date = new Date(bail.date_prochaine_revision);
      if (date <= in30Days) {
        within30.push(bail);
      } else {
        upcoming.push(bail);
      }
    }

    return { within30, upcoming, noDate };
  }, [baux]);

  const showLoading = useHoldLoadingAnimation(loading, SKELETON_CYCLE_MS);
  if (showLoading) {
    return <TableSkeleton />;
  }

  if (baux.length === 0) {
    return (
      <div className="tunnel-enter">
        <h1 className="mb-2 font-serif text-2xl">{t.echeancier.title}</h1>
        <p className="mb-8 text-[var(--foreground)]/70">{t.echeancier.subtitle}</p>
        <p className="text-sm text-[var(--foreground)]/60">{t.echeancier.empty}</p>
      </div>
    );
  }

  return (
    <div className="tunnel-enter">
      <h1 className="mb-2 font-serif text-2xl">{t.echeancier.title}</h1>
      <p className="mb-8 text-[var(--foreground)]/70">{t.echeancier.subtitle}</p>

      <div className="flex flex-col gap-10">
        <EcheancierGroup title={t.echeancier.within30} baux={groups.within30} highlight />
        <EcheancierGroup title={t.echeancier.upcoming} baux={groups.upcoming} />
        <EcheancierGroup title={t.echeancier.noDate} baux={groups.noDate} />
      </div>
    </div>
  );
}

function EcheancierGroup({
  title,
  baux,
  highlight,
}: {
  title: string;
  baux: Bail[];
  highlight?: boolean;
}) {
  const { t } = useApp();
  if (baux.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 font-serif text-lg">
        {title} <span className="text-sm font-sans text-[var(--foreground)]/50">({baux.length})</span>
      </h2>
      <div className="flex flex-col gap-2">
        {baux.map((bail) => (
          <div
            key={bail.id}
            className={`card flex flex-wrap items-center justify-between gap-3 py-3 ${
              highlight ? "border-[var(--accent)]/50" : ""
            }`}
          >
            <div>
              <p className="font-medium">{bail.preneur}</p>
              <p className="text-sm text-[var(--foreground)]/60">{bail.adresse ?? "—"}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--foreground)]/70">
                {bail.date_prochaine_revision ?? "—"}
              </span>
              <StatutBadge statut={bail.statut} label={t.baux.statuts[bail.statut]} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatutBadge({ statut, label }: { statut: Bail["statut"]; label: string }) {
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
