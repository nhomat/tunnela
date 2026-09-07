"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { useCurrentPlan } from "@/components/feature-gate";
import { hasFeature } from "@/lib/types";
import { exportBauxAsCsv } from "@/lib/csv-import";
import { PageLoading } from "@/components/table-skeleton";
import { PasswordInput } from "@/components/password-input";
import type { Bail } from "@/lib/types";

export default function ParametresPage() {
  const { t } = useApp();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { plan } = useCurrentPlan();

  const [nomBailleur, setNomBailleur] = useState("");
  const [alertDelai, setAlertDelai] = useState(30);
  const [loading, setLoading] = useState(true);
  const [savingProfil, setSavingProfil] = useState(false);
  const [profilSaved, setProfilSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [exporting, setExporting] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const searchParams = useSearchParams();
  const [connectAccountId, setConnectAccountId] = useState<string | null>(null);
  const [connectDetailsSubmitted, setConnectDetailsSubmitted] = useState(false);
  const [connectChargesEnabled, setConnectChargesEnabled] = useState(false);
  const [connectPending, setConnectPending] = useState(false);
  const [connectError, setConnectError] = useState(false);

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
        .from("abonnements")
        .select(
          "nom_bailleur_defaut, alert_delai_jours, stripe_connect_account_id, stripe_connect_details_submitted, stripe_connect_charges_enabled"
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setNomBailleur(data.nom_bailleur_defaut ?? "");
        setAlertDelai(data.alert_delai_jours ?? 30);
        setConnectAccountId(data.stripe_connect_account_id);
        setConnectDetailsSubmitted(Boolean(data.stripe_connect_details_submitted));
        setConnectChargesEnabled(Boolean(data.stripe_connect_charges_enabled));
      }
      setLoading(false);
    })();
  }, [supabase]);

  async function handleConnectStripe() {
    setConnectPending(true);
    setConnectError(false);
    try {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error();
      window.location.href = data.url;
    } catch {
      setConnectError(true);
      setConnectPending(false);
    }
  }

  async function refreshConnectStatus() {
    setConnectPending(true);
    try {
      const res = await fetch("/api/stripe/connect/status");
      const data = await res.json();
      if (data.connected) {
        setConnectDetailsSubmitted(Boolean(data.details_submitted));
        setConnectChargesEnabled(Boolean(data.charges_enabled));
      }
    } finally {
      setConnectPending(false);
    }
  }

  // Retour depuis l'onboarding Stripe hébergé : "success" revérifie le
  // statut réel (avant même que le webhook n'arrive), "refresh" relance
  // directement une nouvelle inscription si le lien précédent a expiré ou
  // a été abandonné en cours de route.
  useEffect(() => {
    const stripeConnect = searchParams.get("stripe_connect");
    if (stripeConnect === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refreshConnectStatus();
      router.replace("/dashboard/parametres");
    } else if (stripeConnect === "refresh") {
      router.replace("/dashboard/parametres");
      void handleConnectStripe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleSaveProfil(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfil(true);
    const { error } = await supabase.rpc("update_my_parametres", {
      p_nom_bailleur: nomBailleur,
      p_alert_delai_jours: alertDelai,
    });
    if (!error) {
      setProfilSaved(true);
      setTimeout(() => setProfilSaved(false), 2500);
    }
    setSavingProfil(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) return;
    setPasswordStatus("saving");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordStatus("error");
    } else {
      setNewPassword("");
      setPasswordStatus("saved");
      setTimeout(() => setPasswordStatus("idle"), 2500);
    }
  }

  async function handleExport() {
    setExporting(true);
    const { data } = await supabase.from("baux").select("*");
    const csv = exportBauxAsCsv((data as Bail[]) ?? []);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tunnela-portefeuille.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "SUPPRIMER") return;
    setDeleting(true);
    setDeleteError(false);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setDeleteError(true);
      setDeleting(false);
    }
  }

  if (loading) return <PageLoading />;

  return (
    <div className="tunnel-enter flex max-w-2xl flex-col gap-8">
      <h1 className="font-serif text-2xl">{t.parametres.title}</h1>

      <section className="card">
        <h2 className="mb-1 font-serif text-lg">{t.parametres.profilTitle}</h2>
        <p className="mb-4 text-sm text-[var(--foreground)]/70">{t.parametres.profilSubtitle}</p>
        <form onSubmit={handleSaveProfil} className="flex flex-col gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium">{t.parametres.bailleurLabel}</span>
            <input
              className="input transition-base"
              value={nomBailleur}
              onChange={(e) => setNomBailleur(e.target.value)}
              placeholder={t.parametres.bailleurPlaceholder}
            />
          </label>

          {hasFeature(plan ?? "decouverte", "alerts") && (
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t.parametres.alertDelaiLabel}</span>
              <input
                type="number"
                min={7}
                max={90}
                className="input transition-base w-32"
                value={alertDelai}
                onChange={(e) => setAlertDelai(Number(e.target.value))}
              />
              <span className="ml-2 text-xs text-[var(--foreground)]/60">{t.parametres.alertDelaiHint}</span>
            </label>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={savingProfil} className="btn-primary transition-base disabled:opacity-60">
              {t.parametres.save}
            </button>
            {profilSaved && <span className="text-sm text-[var(--success)]">{t.parametres.saved}</span>}
          </div>
        </form>
      </section>

      <section className="card">
        <h2 className="mb-1 font-serif text-lg">{t.parametres.securityTitle}</h2>
        <p className="mb-4 text-sm text-[var(--foreground)]/70">{t.parametres.securitySubtitle}</p>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-medium">{t.parametres.newPasswordLabel}</span>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              minLength={8}
              showLabel={t.auth.showPassword}
              hideLabel={t.auth.hidePassword}
            />
          </label>
          <button
            type="submit"
            disabled={passwordStatus === "saving" || newPassword.length < 8}
            className="btn-primary transition-base disabled:opacity-60"
          >
            {t.parametres.changePassword}
          </button>
        </form>
        {passwordStatus === "saved" && (
          <p className="mt-2 text-sm text-[var(--success)]">{t.parametres.passwordSaved}</p>
        )}
        {passwordStatus === "error" && (
          <p className="mt-2 text-sm text-[var(--danger)]">{t.parametres.passwordError}</p>
        )}
      </section>

      <section className="card">
        <h2 className="mb-1 font-serif text-lg">{t.parametres.dataTitle}</h2>
        <p className="mb-4 text-sm text-[var(--foreground)]/70">{t.parametres.dataSubtitle}</p>
        <button type="button" onClick={handleExport} disabled={exporting} className="btn-secondary transition-base disabled:opacity-60">
          {t.parametres.exportCsv}
        </button>
      </section>

      <section className="card">
        <h2 className="mb-1 font-serif text-lg">{t.parametres.connectTitle}</h2>
        <p className="mb-4 text-sm text-[var(--foreground)]/70">{t.parametres.connectSubtitle}</p>

        {!connectAccountId && (
          <button
            type="button"
            onClick={handleConnectStripe}
            disabled={connectPending}
            className="btn-primary transition-base disabled:opacity-60"
          >
            {connectPending ? "…" : t.parametres.connectButton}
          </button>
        )}

        {connectAccountId && !connectChargesEnabled && (
          <>
            <p className="mb-3 text-sm text-[var(--accent)]">
              {connectDetailsSubmitted ? t.parametres.connectReviewing : t.parametres.connectIncomplete}
            </p>
            <button
              type="button"
              onClick={handleConnectStripe}
              disabled={connectPending}
              className="btn-primary transition-base disabled:opacity-60"
            >
              {connectPending ? "…" : t.parametres.connectResume}
            </button>
          </>
        )}

        {connectAccountId && connectChargesEnabled && (
          <div className="flex items-center gap-2 text-sm text-[var(--success)]">
            <span aria-hidden="true">✓</span>
            <span>{t.parametres.connectActive}</span>
          </div>
        )}

        {connectAccountId && (
          <button
            type="button"
            onClick={refreshConnectStatus}
            disabled={connectPending}
            className="transition-base mt-3 block text-xs text-[var(--foreground)]/60 hover:underline disabled:opacity-60"
          >
            {t.parametres.connectRefresh}
          </button>
        )}

        {connectError && <p className="mt-2 text-sm text-[var(--danger)]">{t.parametres.connectError}</p>}
      </section>

      <section className="card border-[var(--danger)]/40">
        <h2 className="mb-1 font-serif text-lg text-[var(--danger)]">{t.parametres.dangerTitle}</h2>
        <p className="mb-4 text-sm text-[var(--foreground)]/70">{t.parametres.dangerSubtitle}</p>
        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium">{t.parametres.dangerConfirmLabel}</span>
          <input
            className="input transition-base max-w-xs"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="SUPPRIMER"
          />
        </label>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== "SUPPRIMER" || deleting}
          style={{ background: "var(--danger)", color: "var(--color-papier)" }}
          className="btn-primary transition-base disabled:opacity-50"
        >
          {t.parametres.deleteAccount}
        </button>
        {deleteError && <p className="mt-2 text-sm text-[var(--danger)]">{t.parametres.deleteError}</p>}
      </section>
    </div>
  );
}
