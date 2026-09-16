"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { useCurrentPlan } from "@/components/feature-gate";
import { PageLoading } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";

const SPINNER_CYCLE_MS = 900;

type MaintenanceState = "loading" | "on" | "off";

export default function AdminMaintenancePage() {
  const { t } = useApp();
  const { isAdmin, loading: planLoading } = useCurrentPlan();
  const [maintenance, setMaintenance] = useState<MaintenanceState>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    void (async () => {
      const res = await fetch("/api/admin/maintenance");
      if (res.ok) {
        const data = (await res.json()) as { maintenanceMode: boolean };
        setMaintenance(data.maintenanceMode ? "on" : "off");
      }
    })();
  }, [isAdmin]);

  async function toggleMaintenance() {
    if (maintenance === "loading" || busy) return;
    const next = maintenance !== "on";
    const confirmMsg = next ? t.admin.maintenanceConfirmEnable : t.admin.maintenanceConfirmDisable;
    if (!window.confirm(confirmMsg)) return;

    setBusy(true);
    const res = await fetch("/api/admin/maintenance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maintenanceMode: next }),
    });
    if (res.ok) setMaintenance(next ? "on" : "off");
    setBusy(false);
  }

  const showLoading = useHoldLoadingAnimation(planLoading, SPINNER_CYCLE_MS);

  if (showLoading) return <PageLoading />;

  if (!isAdmin) {
    return <p className="text-sm text-[var(--foreground)]/60">{t.admin.notAllowed}</p>;
  }

  return (
    <div className="tunnel-enter max-w-2xl">
      <div className="mb-2 flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 2.5l1.4 2.8 3.1.4-2.2 2.2.5 3.1L10 9.5 7.2 11l.5-3.1-2.2-2.2 3.1-.4L10 2.5z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path d="M4 15.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.admin.maintenanceTitle}</h1>
      </div>
      <p className="mb-8 text-[var(--foreground)]/70">{t.admin.maintenanceSubtitle}</p>

      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--foreground)]/70">
          {maintenance === "loading"
            ? "…"
            : maintenance === "on"
              ? t.admin.maintenanceActive
              : t.admin.maintenanceInactive}
        </p>
        <button
          type="button"
          onClick={() => void toggleMaintenance()}
          disabled={maintenance === "loading" || busy}
          className={`transition-base rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            maintenance === "on" ? "bg-[var(--danger)] text-white hover:opacity-90" : "btn-primary"
          }`}
        >
          {maintenance === "on" ? t.admin.maintenanceDisable : t.admin.maintenanceEnable}
        </button>
      </div>
    </div>
  );
}
