"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { useCurrentPlan } from "@/components/feature-gate";
import { PageLoading } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";
import { PLANS } from "@/lib/stripe";
import type { Plan } from "@/lib/types";

const SPINNER_CYCLE_MS = 900;
const PLAN_IDS: Plan[] = ["decouverte", "cabinet", "portefeuille", "fonciere"];

type CompteDetail = {
  userId: string;
  email: string;
  createdAt: string | null;
  plan: Plan;
  statut: string;
  isAdmin: boolean;
  coopActif: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  baux: { id: string; preneur: string | null; adresse: string | null; statut: string | null }[];
  equipe: { nom: string; membresActifs: number } | null;
};

type SensitiveAction = "delete" | "suspend";
type ConfirmStep = { action: SensitiveAction; code: string } | null;

export default function AdminCompteDetailPage() {
  const { t, locale } = useApp();
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { isAdmin, loading: planLoading } = useCurrentPlan();

  const [compte, setCompte] = useState<CompteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("decouverte");
  const [savingPlan, setSavingPlan] = useState(false);
  const [confirmStep, setConfirmStep] = useState<ConfirmStep>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    void (async () => {
      const res = await fetch(`/api/admin/comptes/${userId}`);
      if (res.ok) {
        const data = (await res.json()) as CompteDetail;
        setCompte(data);
        setSelectedPlan(data.plan);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [isAdmin, userId]);

  const showLoading = useHoldLoadingAnimation(planLoading || (isAdmin && loading), SPINNER_CYCLE_MS);

  if (showLoading) return <PageLoading />;

  if (!isAdmin) {
    return <p className="text-sm text-[var(--foreground)]/60">{t.admin.notAllowed}</p>;
  }

  if (notFound || !compte) {
    return <p className="card text-sm text-[var(--danger)]">{t.admin.prospectionError}</p>;
  }

  async function savePlan() {
    if (!compte || selectedPlan === compte.plan) return;
    setSavingPlan(true);
    const res = await fetch(`/api/admin/comptes/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selectedPlan }),
    });
    if (res.ok) setCompte((prev) => (prev ? { ...prev, plan: selectedPlan } : prev));
    setSavingPlan(false);
  }

  async function toggleIsAdmin() {
    if (!compte) return;
    const next = !compte.isAdmin;
    if (!window.confirm(next ? t.admin.confirmGrantAdmin : t.admin.confirmRevokeAdmin)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/comptes/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: next }),
    });
    if (res.ok) setCompte((prev) => (prev ? { ...prev, isAdmin: next } : prev));
    setBusy(false);
  }

  async function reactivate() {
    if (!compte) return;
    if (!window.confirm(t.admin.confirmReactivate)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/comptes/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "actif" }),
    });
    if (res.ok) setCompte((prev) => (prev ? { ...prev, statut: "actif" } : prev));
    setBusy(false);
  }

  async function requestCode(action: SensitiveAction) {
    const confirmMsg = action === "delete" ? t.admin.confirmRequestDelete : t.admin.confirmRequestSuspend;
    if (!window.confirm(confirmMsg)) return;
    setBusy(true);
    setActionError(null);
    const res = await fetch(`/api/admin/comptes/${userId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "request", action }),
    });
    setBusy(false);
    if (res.ok) {
      setConfirmStep({ action, code: "" });
    } else {
      setActionError(t.admin.actionCodeError);
    }
  }

  async function confirmCode() {
    if (!confirmStep || !confirmStep.code) return;
    setBusy(true);
    setActionError(null);
    const res = await fetch(`/api/admin/comptes/${userId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "confirm", action: confirmStep.action, code: confirmStep.code }),
    });
    setBusy(false);
    if (!res.ok) {
      setActionError(t.admin.actionCodeInvalid);
      return;
    }
    if (confirmStep.action === "delete") {
      router.push("/dashboard/admin/comptes");
      return;
    }
    setConfirmStep(null);
    setCompte((prev) => (prev ? { ...prev, statut: "suspendu" } : prev));
  }

  return (
    <div className="tunnel-enter max-w-2xl">
      <Link
        href="/dashboard/admin/comptes"
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
        <h1 className="font-serif text-2xl break-all">{compte.email}</h1>
      </div>
      <p className="mb-8 text-sm text-[var(--foreground)]/60">
        {compte.createdAt
          ? new Date(compte.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")
          : "—"}
      </p>

      <div className="card mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--foreground)]/70">{t.admin.comptesStatut}</span>
          <span
            className={`text-sm font-medium ${
              compte.statut === "suspendu" ? "text-[var(--danger)]" : "text-[var(--foreground)]"
            }`}
          >
            {compte.statut}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--foreground)]/70">{t.admin.comptesCoop}</span>
          <span className="text-sm font-medium">{compte.coopActif ? t.admin.yes : t.admin.no}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--foreground)]/70">{t.admin.comptesAdmin}</span>
          <button
            type="button"
            onClick={() => void toggleIsAdmin()}
            disabled={busy}
            className="transition-base text-sm font-medium text-[var(--accent)] hover:underline disabled:opacity-50"
          >
            {compte.isAdmin ? t.admin.revokeAdmin : t.admin.grantAdmin}
          </button>
        </div>
        {compte.equipe && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground)]/70">{t.admin.equipeLabel}</span>
            <span className="text-sm font-medium">
              {compte.equipe.nom} · {compte.equipe.membresActifs}
            </span>
          </div>
        )}
      </div>

      <div className="card mb-6 flex flex-col gap-3">
        <label htmlFor="plan-select" className="text-sm text-[var(--foreground)]/70">
          {t.admin.comptesPlan}
        </label>
        <div className="flex gap-2">
          <select
            id="plan-select"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value as Plan)}
            className="field-input flex-1"
          >
            {PLAN_IDS.map((planId) => (
              <option key={planId} value={planId}>
                {PLANS.find((p) => p.id === planId)?.nom ?? planId}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void savePlan()}
            disabled={savingPlan || selectedPlan === compte.plan}
            className="btn-primary transition-base disabled:opacity-50"
          >
            {t.admin.savePlan}
          </button>
        </div>
      </div>

      {(compte.stripeCustomerId || compte.stripeSubscriptionId) && (
        <div className="card mb-6 flex flex-col gap-2">
          <h2 className="mb-1 font-serif text-lg">Stripe</h2>
          {compte.stripeCustomerId && (
            <a
              href={`https://dashboard.stripe.com/customers/${compte.stripeCustomerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-base text-sm text-[var(--accent)] hover:underline"
            >
              {t.admin.stripeCustomerLink}
            </a>
          )}
          {compte.stripeSubscriptionId && (
            <a
              href={`https://dashboard.stripe.com/subscriptions/${compte.stripeSubscriptionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-base text-sm text-[var(--accent)] hover:underline"
            >
              {t.admin.stripeSubscriptionLink}
            </a>
          )}
        </div>
      )}

      <div className="card mb-6">
        <h2 className="mb-4 font-serif text-lg">
          {t.admin.comptesBaux} · {compte.baux.length}
        </h2>
        {compte.baux.length === 0 ? (
          <p className="text-sm text-[var(--foreground)]/60">{t.admin.comptesEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {compte.baux.map((bail) => (
              <li key={bail.id} className="border-b border-[var(--border-color)] py-2 last:border-0">
                {bail.preneur ?? "—"} · {bail.adresse ?? "—"} · {bail.statut ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card border border-[var(--danger)]/30">
        <h2 className="mb-1 font-serif text-lg text-[var(--danger)]">{t.admin.dangerZone}</h2>
        <p className="mb-4 text-sm text-[var(--foreground)]/70">{t.admin.dangerZoneHint}</p>

        {confirmStep ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--foreground)]/70">{t.admin.enterCodeHint}</p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={confirmStep.code}
                onChange={(e) => setConfirmStep({ ...confirmStep, code: e.target.value })}
                className="field-input flex-1"
                placeholder="123456"
              />
              <button
                type="button"
                onClick={() => void confirmCode()}
                disabled={busy || !confirmStep.code}
                className="rounded-full bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white transition-base hover:opacity-90 disabled:opacity-50"
              >
                {t.admin.confirmAction}
              </button>
              <button
                type="button"
                onClick={() => setConfirmStep(null)}
                className="transition-base px-3 py-2 text-sm text-[var(--foreground)]/60 hover:text-[var(--accent)]"
              >
                {t.admin.cancelAction}
              </button>
            </div>
            {actionError && <p className="text-sm text-[var(--danger)]">{actionError}</p>}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            {compte.statut === "suspendu" ? (
              <button
                type="button"
                onClick={() => void reactivate()}
                disabled={busy}
                className="btn-primary transition-base disabled:opacity-50"
              >
                {t.admin.reactivate}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void requestCode("suspend")}
                disabled={busy}
                className="rounded-full border border-[var(--danger)] px-4 py-2 text-sm font-medium text-[var(--danger)] transition-base hover:bg-[var(--danger)]/10 disabled:opacity-50"
              >
                {t.admin.suspendAccount}
              </button>
            )}
            <button
              type="button"
              onClick={() => void requestCode("delete")}
              disabled={busy}
              className="rounded-full bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white transition-base hover:opacity-90 disabled:opacity-50"
            >
              {t.admin.deleteAccount}
            </button>
            {actionError && <p className="w-full text-sm text-[var(--danger)]">{actionError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
