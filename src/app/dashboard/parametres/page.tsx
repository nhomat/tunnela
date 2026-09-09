"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { useCurrentPlan } from "@/components/feature-gate";
import { hasFeature } from "@/lib/types";
import { exportBaux, type ExportFormat } from "@/lib/bail-export";
import { PageLoading } from "@/components/table-skeleton";
import { PasswordInput } from "@/components/password-input";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";
import type { Bail } from "@/lib/types";

const SPINNER_CYCLE_MS = 900;
const EXPORT_FORMAT_OPTIONS: ExportFormat[] = ["csv", "xlsx", "pdf", "json"];

export default function ParametresPage() {
  const { t, swipeTransitionEnabled, setSwipeTransitionEnabled } = useApp();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { plan } = useCurrentPlan();

  const [nomBailleur, setNomBailleur] = useState("");
  const [alertDelai, setAlertDelai] = useState(30);
  const [loading, setLoading] = useState(true);
  const [savingProfil, setSavingProfil] = useState(false);
  const [profilSaved, setProfilSaved] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<
    "idle" | "saving" | "saved" | "error" | "mismatch" | "wrongCurrent"
  >("idle");

  const [exporting, setExporting] = useState(false);
  const [exportFormats, setExportFormats] = useState<ExportFormat[]>(["csv"]);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserEmail(user.email ?? null);
      const { data } = await supabase
        .from("abonnements")
        .select("nom_bailleur_defaut, alert_delai_jours")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setNomBailleur(data.nom_bailleur_defaut ?? "");
        setAlertDelai(data.alert_delai_jours ?? 30);
      }
      setLoading(false);
    })();
  }, [supabase]);

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
    if (newPassword.length < 8 || !currentPassword || !userEmail) return;
    if (newPassword !== confirmPassword) {
      setPasswordStatus("mismatch");
      return;
    }
    setPasswordStatus("saving");

    // On exige le mot de passe actuel avant tout changement : ré-authentifier
    // l'utilisateur confirme que c'est bien le titulaire du compte qui agit,
    // et pas quelqu'un profitant d'une session déjà ouverte.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });
    if (reauthError) {
      setPasswordStatus("wrongCurrent");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordStatus("error");
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus("saved");
      setTimeout(() => setPasswordStatus("idle"), 2500);
    }
  }

  function toggleExportFormat(format: ExportFormat) {
    setExportFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  }

  async function handleExport() {
    if (exportFormats.length === 0) return;
    setExporting(true);
    const { data } = await supabase.from("baux").select("*");
    exportBaux((data as Bail[]) ?? [], exportFormats);
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

  const showLoading = useHoldLoadingAnimation(loading, SPINNER_CYCLE_MS);
  if (showLoading) return <PageLoading />;

  return (
    <div className="tunnel-enter flex max-w-2xl flex-col gap-8">
      <div className="flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.parametres.title}</h1>
      </div>

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
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium">{t.parametres.currentPasswordLabel}</span>
            <PasswordInput
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              showLabel={t.auth.showPassword}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t.parametres.newPasswordLabel}</span>
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                minLength={8}
                showLabel={t.auth.showPassword}
                blockPaste
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t.parametres.confirmPasswordLabel}</span>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                minLength={8}
                showLabel={t.auth.showPassword}
                blockPaste
              />
            </label>
          </div>
          <div>
            <button
              type="submit"
              disabled={
                passwordStatus === "saving" ||
                newPassword.length < 8 ||
                !currentPassword ||
                !confirmPassword
              }
              className="btn-primary transition-base disabled:opacity-60"
            >
              {t.parametres.changePassword}
            </button>
          </div>
        </form>
        {passwordStatus === "saved" && (
          <p className="mt-2 text-sm text-[var(--success)]">{t.parametres.passwordSaved}</p>
        )}
        {passwordStatus === "error" && (
          <p className="mt-2 text-sm text-[var(--danger)]">{t.parametres.passwordError}</p>
        )}
        {passwordStatus === "mismatch" && (
          <p className="mt-2 text-sm text-[var(--danger)]">{t.parametres.passwordMismatch}</p>
        )}
        {passwordStatus === "wrongCurrent" && (
          <p className="mt-2 text-sm text-[var(--danger)]">{t.parametres.passwordWrongCurrent}</p>
        )}
      </section>

      <section className="card">
        <h2 className="mb-1 font-serif text-lg">{t.parametres.interfaceTitle}</h2>
        <p className="mb-4 text-sm text-[var(--foreground)]/70">{t.parametres.interfaceSubtitle}</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={swipeTransitionEnabled}
            onChange={(e) => setSwipeTransitionEnabled(e.target.checked)}
          />
          {t.parametres.swipeTransitionLabel}
        </label>
        <p className="mt-1 text-xs text-[var(--foreground)]/60">{t.parametres.swipeTransitionHint}</p>
      </section>

      <section className="card">
        <h2 className="mb-1 font-serif text-lg">{t.parametres.dataTitle}</h2>
        <p className="mb-4 text-sm text-[var(--foreground)]/70">{t.parametres.dataSubtitle}</p>
        <div className="mb-4 flex flex-wrap gap-4">
          {EXPORT_FORMAT_OPTIONS.map((format) => (
            <label key={format} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={exportFormats.includes(format)}
                onChange={() => toggleExportFormat(format)}
              />
              {format.toUpperCase()}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || exportFormats.length === 0}
          className="btn-secondary transition-base disabled:opacity-60"
        >
          {exporting ? "…" : t.parametres.exportCsv}
        </button>
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
