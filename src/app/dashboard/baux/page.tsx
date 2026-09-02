"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { calculerStatutConformite, PLAN_LIMITS } from "@/lib/types";
import type { Bail, IndexType, Plan } from "@/lib/types";

type FormState = {
  preneur: string;
  adresse: string;
  loyer_annuel: string;
  indice: IndexType;
  clause_tunnel: boolean;
  plancher_pct: string;
  plafond_pct: string;
  date_prochaine_revision: string;
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
};

export default function BauxPage() {
  const { t } = useApp();
  const supabase = useMemo(() => createClient(), []);

  const [baux, setBaux] = useState<Bail[]>([]);
  const [plan, setPlan] = useState<Plan>("decouverte");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [bauxRes, abonnementRes] = await Promise.all([
      supabase.from("baux").select("*").order("created_at", { ascending: false }),
      supabase.from("abonnements").select("plan").eq("user_id", user.id).maybeSingle(),
    ]);

    if (bauxRes.data) setBaux(bauxRes.data as Bail[]);
    if (abonnementRes.data) setPlan(abonnementRes.data.plan as Plan);
    setLoading(false);
  }

  const limit = PLAN_LIMITS[plan];
  const limitReached = limit !== null && baux.length >= limit;

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
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
      statut,
    };

    if (editingId) {
      await supabase.from("baux").update(payload).eq("id", editingId);
    } else {
      await supabase.from("baux").insert({ ...payload, user_id: user.id });
    }

    setSaving(false);
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
        <h1 className="font-serif text-2xl">{t.baux.title}</h1>
        <button
          type="button"
          onClick={openCreateForm}
          disabled={limitReached}
          className="btn-primary transition-base disabled:opacity-50"
        >
          {t.baux.add}
        </button>
      </div>

      {limitReached && (
        <div className="card mb-6 border-[var(--danger)]/40">
          <p className="text-sm">{t.baux.limitReached}</p>
          <Link href="/dashboard/abonnement" className="btn-secondary transition-base mt-3 inline-flex text-sm">
            {t.baux.upgrade}
          </Link>
        </div>
      )}

      {showForm && (
        <BailForm
          form={form}
          setForm={setForm}
          errors={errors}
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <p className="text-sm text-[var(--foreground)]/60">…</p>
      ) : baux.length === 0 ? (
        <p className="text-sm text-[var(--foreground)]/60">{t.baux.empty}</p>
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
              {baux.map((bail) => (
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
  onSubmit,
  onCancel,
}: {
  form: FormState;
  setForm: (form: FormState) => void;
  errors: Partial<Record<keyof FormState, boolean>>;
  saving: boolean;
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
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <input
          type="checkbox"
          checked={form.clause_tunnel}
          onChange={(e) => setForm({ ...form, clause_tunnel: e.target.checked })}
        />
        {t.baux.clauseTunnel}
      </label>
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
