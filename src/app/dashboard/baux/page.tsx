"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { calculerStatutConformite, hasFeature, limiteBaux } from "@/lib/types";
import type { Bail, IndexType, Periodicite, StatutConformite } from "@/lib/types";
import { generateTemplateCsv, parseLeasesCsv } from "@/lib/csv-import";
import type { ImportResult } from "@/lib/csv-import";
import { RevisionPanel } from "@/components/revision-panel";
import { useCurrentPlan } from "@/components/feature-gate";
import { TableSkeleton } from "@/components/table-skeleton";
import { useHoldLoadingAnimation } from "@/lib/use-hold-loading-animation";
import { PageIcon3D } from "@/components/page-icon-3d";

const SKELETON_CYCLE_MS = 1400;

type FormState = {
  preneur: string;
  adresse: string;
  loyer_annuel: string;
  indice: IndexType;
  clause_tunnel: boolean;
  plancher_pct: string;
  plafond_pct: string;
  date_prochaine_revision: string;
  indice_reference: string;
  periodicite: Periodicite;
  preneur_email: string;
  visible_equipe: boolean;
};

const emptyForm: FormState = {
  preneur: "",
  adresse: "",
  loyer_annuel: "",
  indice: "ILC",
  clause_tunnel: false,
  plancher_pct: "",
  plafond_pct: "",
  date_prochaine_revision: "",
  indice_reference: "",
  periodicite: "annuelle",
  preneur_email: "",
  visible_equipe: false,
};

export default function BauxPage() {
  const { t } = useApp();
  const supabase = useMemo(() => createClient(), []);
  const { plan: effectivePlan, team } = useCurrentPlan();
  const plan = effectivePlan ?? "decouverte";

  const [baux, setBaux] = useState<Bail[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatutConformite | "all">("all");
  const [revisingId, setRevisingId] = useState<string | null>(null);
  const showLoading = useHoldLoadingAnimation(loading, SKELETON_CYCLE_MS);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setMyUserId(user.id);

    const { data } = await supabase.from("baux").select("*").order("created_at", { ascending: false });
    if (data) setBaux(data as Bail[]);
    setLoading(false);
  }

  const ownBaux = useMemo(() => baux.filter((b) => b.user_id === myUserId), [baux, myUserId]);
  const sharedBaux = useMemo(() => baux.filter((b) => b.user_id !== myUserId), [baux, myUserId]);

  const limit = limiteBaux(plan);
  const limitReached = limit !== null && ownBaux.length >= limit;
  const canSearch = hasFeature(plan, "search");
  const canImport = hasFeature(plan, "csvImport");
  const canRevise = hasFeature(plan, "revisionWorkflow");
  const canShareTeam = Boolean(team?.coopAccess) && Boolean(team?.equipeId);

  const visibleBaux = useMemo(() => {
    return ownBaux.filter((bail) => {
      if (statusFilter !== "all" && bail.statut !== statusFilter) return false;
      if (canSearch && search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          bail.preneur.toLowerCase().includes(q) ||
          (bail.adresse ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ownBaux, search, statusFilter, canSearch]);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setSaveError(null);
    setShowForm(true);
  }

  function openEditForm(bail: Bail) {
    setEditingId(bail.id);
    setForm({
      preneur: bail.preneur,
      adresse: bail.adresse ?? "",
      loyer_annuel: String(bail.loyer_annuel),
      indice: bail.indice as IndexType,
      clause_tunnel: bail.clause_tunnel,
      plancher_pct: bail.plancher_pct?.toString() ?? "",
      plafond_pct: bail.plafond_pct?.toString() ?? "",
      date_prochaine_revision: bail.date_prochaine_revision ?? "",
      indice_reference: bail.indice_reference?.toString() ?? "",
      periodicite: bail.periodicite,
      preneur_email: bail.preneur_email ?? "",
      visible_equipe: bail.visible_equipe,
    });
    setErrors({});
    setShowForm(true);
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, boolean>> = {};
    if (!form.preneur.trim()) next.preneur = true;
    if (!form.loyer_annuel || Number.isNaN(Number(form.loyer_annuel))) next.loyer_annuel = true;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const statut = calculerStatutConformite({
      indice: form.indice,
      clause_tunnel: form.clause_tunnel,
    });

    const payload = {
      preneur: form.preneur.trim(),
      adresse: form.adresse.trim() || null,
      loyer_annuel: Number(form.loyer_annuel),
      indice: form.indice,
      clause_tunnel: form.clause_tunnel,
      plancher_pct: form.plancher_pct ? Number(form.plancher_pct) : null,
      plafond_pct: form.plafond_pct ? Number(form.plafond_pct) : null,
      date_prochaine_revision: form.date_prochaine_revision || null,
      indice_reference: form.indice_reference ? Number(form.indice_reference) : null,
      periodicite: form.periodicite,
      preneur_email: form.preneur_email.trim() || null,
      statut,
      ...(canShareTeam
        ? { visible_equipe: form.visible_equipe, equipe_id: form.visible_equipe ? team!.equipeId : null }
        : {}),
    };

    const { error } = editingId
      ? await supabase.from("baux").update(payload).eq("id", editingId)
      : await supabase.from("baux").insert({ ...payload, user_id: user.id });

    setSaving(false);
    if (error) {
      setSaveError(t.baux.limitReached);
      return;
    }
    setSaveError(null);
    setShowForm(false);
    await loadData();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t.baux.delete + " ?")) return;
    await supabase.from("baux").delete().eq("id", id);
    await loadData();
  }

  return (
    <div className="tunnel-enter">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PageIcon3D>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="4" y="3" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </PageIcon3D>
          <h1 className="font-serif text-2xl">{t.baux.title}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {canImport && (
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              className="btn-secondary transition-base"
            >
              {t.baux.importCsv}
            </button>
          )}
          <button
            type="button"
            onClick={openCreateForm}
            disabled={limitReached}
            className="btn-primary transition-base disabled:opacity-50"
          >
            {t.baux.add}
          </button>
        </div>
      </div>

      {limitReached && (
        <div className="card mb-6 border-[var(--danger)]/40">
          <p className="text-sm">{t.baux.limitReached}</p>
          <Link href="/dashboard/abonnement" className="btn-secondary transition-base mt-3 inline-flex text-sm">
            {t.baux.upgrade}
          </Link>
        </div>
      )}

      {showImport && canImport && (
        <CsvImportPanel
          remainingCapacity={limit === null ? null : Math.max(0, limit - baux.length)}
          onImported={async () => {
            setShowImport(false);
            await loadData();
          }}
          onCancel={() => setShowImport(false)}
        />
      )}

      {showForm && (
        <>
          {saveError && (
            <p className="mb-3 text-sm text-[var(--danger)]">{saveError}</p>
          )}
          <BailForm
            form={form}
            setForm={setForm}
            errors={errors}
            saving={saving}
            canShareTeam={canShareTeam}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </>
      )}

      {revisingId &&
        (() => {
          const revisingBail = baux.find((b) => b.id === revisingId);
          if (!revisingBail) return null;
          return (
            <RevisionPanel
              bail={revisingBail}
              plan={plan}
              onUpdated={() => void loadData()}
              onClose={() => setRevisingId(null)}
            />
          );
        })()}

      {canSearch && baux.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="search"
            placeholder={t.baux.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input transition-base max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatutConformite | "all")}
            className="input transition-base w-auto"
          >
            <option value="all">{t.baux.filterAll}</option>
            <option value="conforme">{t.baux.statuts.conforme}</option>
            <option value="a_verifier">{t.baux.statuts.a_verifier}</option>
            <option value="non_conforme">{t.baux.statuts.non_conforme}</option>
          </select>
        </div>
      )}

      {showLoading ? (
        <TableSkeleton />
      ) : baux.length === 0 ? (
        <p className="text-sm text-[var(--foreground)]/60">{t.baux.empty}</p>
      ) : visibleBaux.length === 0 ? (
        <p className="text-sm text-[var(--foreground)]/60">{t.baux.noResults}</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--foreground)]/60">
                <th className="px-4 py-3">{t.baux.preneur}</th>
                <th className="px-4 py-3">{t.baux.adresse}</th>
                <th className="px-4 py-3">{t.baux.loyer}</th>
                <th className="px-4 py-3">{t.baux.indice}</th>
                <th className="px-4 py-3">{t.baux.clauseTunnel}</th>
                <th className="px-4 py-3">{t.baux.prochaineRevision}</th>
                <th className="px-4 py-3">{t.baux.statut}</th>
                <th className="px-4 py-3">{t.baux.actions}</th>
              </tr>
            </thead>
            <tbody>
              {visibleBaux.map((bail) => (
                <tr key={bail.id} className="border-b border-[var(--border-color)] last:border-0">
                  <td className="px-4 py-3 font-medium">{bail.preneur}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]/70">{bail.adresse ?? "—"}</td>
                  <td className="px-4 py-3">{bail.loyer_annuel.toLocaleString("fr-FR")} €</td>
                  <td className="px-4 py-3">{bail.indice}</td>
                  <td className="px-4 py-3">{bail.clause_tunnel ? "✓" : "—"}</td>
                  <td className="px-4 py-3">{bail.date_prochaine_revision ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatutBadge statut={bail.statut} label={t.baux.statuts[bail.statut]} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {canRevise && (
                        <button
                          type="button"
                          onClick={() => setRevisingId(bail.id)}
                          className="transition-base text-[var(--accent)] hover:underline"
                        >
                          {t.baux.reviser}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditForm(bail)}
                        className="transition-base text-[var(--accent)] hover:underline"
                      >
                        {t.baux.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(bail.id)}
                        className="transition-base text-[var(--danger)] hover:underline"
                      >
                        {t.baux.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canShareTeam && sharedBaux.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 font-serif text-lg">{t.baux.sharedByTeamTitle}</h2>
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--foreground)]/60">
                  <th className="px-4 py-3">{t.baux.preneur}</th>
                  <th className="px-4 py-3">{t.baux.loyer}</th>
                  <th className="px-4 py-3">{t.baux.indice}</th>
                  <th className="px-4 py-3">{t.baux.prochaineRevision}</th>
                  <th className="px-4 py-3">{t.baux.statut}</th>
                </tr>
              </thead>
              <tbody>
                {sharedBaux.map((bail) => (
                  <tr key={bail.id} className="border-b border-[var(--border-color)] last:border-0">
                    <td className="px-4 py-3 font-medium">{bail.preneur}</td>
                    <td className="px-4 py-3">{bail.loyer_annuel.toLocaleString("fr-FR")} €</td>
                    <td className="px-4 py-3">{bail.indice}</td>
                    <td className="px-4 py-3">{bail.date_prochaine_revision ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={bail.statut} label={t.baux.statuts[bail.statut]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CsvImportPanel({
  remainingCapacity,
  onImported,
  onCancel,
}: {
  remainingCapacity: number | null;
  onImported: () => void;
  onCancel: () => void;
}) {
  const { t } = useApp();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setResult(parseLeasesCsv(String(reader.result ?? "")));
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([generateTemplateCsv()], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tunnela-modele-baux.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function confirmImport() {
    if (!result || result.valid.length === 0) return;
    setImporting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setImporting(false);
      return;
    }

    const rows =
      remainingCapacity === null ? result.valid : result.valid.slice(0, remainingCapacity);

    if (rows.length > 0) {
      const { error } = await supabase
        .from("baux")
        .insert(rows.map((row) => ({ ...row, user_id: user.id })));
      if (error) {
        setImportError(true);
        setImporting(false);
        return;
      }
    }

    setImportError(false);
    setImporting(false);
    onImported();
  }

  return (
    <div className="card card-hover tunnel-enter mb-8">
      <h2 className="font-serif text-lg">{t.baux.importTitle}</h2>
      <p className="mt-2 text-sm text-[var(--foreground)]/70">{t.baux.importDropHint}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />
        <button type="button" onClick={downloadTemplate} className="btn-secondary transition-base text-sm">
          {t.baux.downloadTemplate}
        </button>
      </div>

      {importError && (
        <p className="mt-3 text-sm text-[var(--danger)]">{t.baux.limitReached}</p>
      )}

      {result && (
        <div className="mt-4 text-sm">
          <p className="text-[var(--success)]">
            {result.valid.length} {t.baux.importPreview}
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2 text-[var(--danger)]">
              <p>
                {result.errors.length} {t.baux.importRowErrors}
              </p>
              <ul className="mt-1 list-inside list-disc text-xs">
                {result.errors.slice(0, 10).map((err) => (
                  <li key={err.row}>
                    Ligne {err.row} : {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {remainingCapacity !== null && result.valid.length > remainingCapacity && (
            <p className="mt-2 text-[var(--accent)]">{t.baux.importLimitWarning}</p>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={confirmImport}
          disabled={!result || result.valid.length === 0 || importing}
          className="btn-primary transition-base disabled:opacity-50"
        >
          {t.baux.importConfirm}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary transition-base">
          {t.baux.importCancel}
        </button>
      </div>
    </div>
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
      style={{ color: colors[statut], backgroundColor: `color-mix(in srgb, ${colors[statut]} 14%, transparent)` }}
    >
      {label}
    </span>
  );
}

function BailForm({
  form,
  setForm,
  errors,
  saving,
  canShareTeam,
  onSubmit,
  onCancel,
}: {
  form: FormState;
  setForm: (form: FormState) => void;
  errors: Partial<Record<keyof FormState, boolean>>;
  saving: boolean;
  canShareTeam: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const { t } = useApp();

  return (
    <form onSubmit={onSubmit} className="card tunnel-enter mb-8 grid gap-4 sm:grid-cols-2">
      <Field label={t.baux.preneur} error={errors.preneur}>
        <input
          className="input transition-base"
          aria-invalid={!!errors.preneur}
          value={form.preneur}
          onChange={(e) => setForm({ ...form, preneur: e.target.value })}
        />
      </Field>
      <Field label={t.baux.adresse}>
        <input
          className="input transition-base"
          value={form.adresse}
          onChange={(e) => setForm({ ...form, adresse: e.target.value })}
        />
      </Field>
      <Field label={t.baux.loyer} error={errors.loyer_annuel}>
        <input
          type="number"
          min="0"
          step="0.01"
          className="input transition-base"
          aria-invalid={!!errors.loyer_annuel}
          value={form.loyer_annuel}
          onChange={(e) => setForm({ ...form, loyer_annuel: e.target.value })}
        />
      </Field>
      <Field label={t.baux.indice}>
        <select
          className="input transition-base"
          value={form.indice}
          onChange={(e) => setForm({ ...form, indice: e.target.value as IndexType })}
        >
          <option value="ILC">ILC</option>
          <option value="ILAT">ILAT</option>
          <option value="ICC">ICC</option>
        </select>
      </Field>
      <Field label={t.baux.prochaineRevision}>
        <input
          type="date"
          className="input transition-base"
          value={form.date_prochaine_revision}
          onChange={(e) => setForm({ ...form, date_prochaine_revision: e.target.value })}
        />
      </Field>
      <Field label={t.baux.indiceReference}>
        <input
          type="number"
          step="0.01"
          className="input transition-base"
          value={form.indice_reference}
          onChange={(e) => setForm({ ...form, indice_reference: e.target.value })}
        />
      </Field>
      <Field label={t.baux.periodicite}>
        <select
          className="input transition-base"
          value={form.periodicite}
          onChange={(e) => setForm({ ...form, periodicite: e.target.value as Periodicite })}
        >
          <option value="annuelle">{t.clause.annuelle}</option>
          <option value="trimestrielle">{t.clause.trimestrielle}</option>
        </select>
      </Field>
      <Field label={t.baux.preneurEmail}>
        <input
          type="email"
          className="input transition-base"
          value={form.preneur_email}
          onChange={(e) => setForm({ ...form, preneur_email: e.target.value })}
        />
      </Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <input
          type="checkbox"
          checked={form.clause_tunnel}
          onChange={(e) => setForm({ ...form, clause_tunnel: e.target.checked })}
        />
        {t.baux.clauseTunnel}
      </label>
      {canShareTeam && (
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={form.visible_equipe}
            onChange={(e) => setForm({ ...form, visible_equipe: e.target.checked })}
          />
          {t.baux.visibleEquipe}
        </label>
      )}
      {form.clause_tunnel && (
        <>
          <Field label={t.calculateur.plancher}>
            <input
              type="number"
              step="0.01"
              className="input transition-base"
              value={form.plancher_pct}
              onChange={(e) => setForm({ ...form, plancher_pct: e.target.value })}
            />
          </Field>
          <Field label={t.calculateur.plafond}>
            <input
              type="number"
              step="0.01"
              className="input transition-base"
              value={form.plafond_pct}
              onChange={(e) => setForm({ ...form, plafond_pct: e.target.value })}
            />
          </Field>
        </>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={saving} className="btn-primary transition-base disabled:opacity-60">
          {t.baux.save}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary transition-base">
          {t.baux.cancel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-[var(--danger)]">—</span>}
    </label>
  );
}
