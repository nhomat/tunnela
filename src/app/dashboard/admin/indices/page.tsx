"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/providers";
import { createClient } from "@/lib/supabase/client";
import { useCurrentPlan } from "@/components/feature-gate";
import { listIndices } from "@/lib/indices";
import { PageLoading, TableSkeleton } from "@/components/table-skeleton";
import type { IndicePublie } from "@/lib/indices";
import type { IndexType } from "@/lib/types";

export default function AdminIndicesPage() {
  const { t } = useApp();
  const { isAdmin, loading: planLoading } = useCurrentPlan();
  const supabase = useMemo(() => createClient(), []);

  const [indices, setIndices] = useState<IndicePublie[]>([]);
  const [loading, setLoading] = useState(true);
  const [indice, setIndice] = useState<IndexType>("ILC");
  const [periode, setPeriode] = useState("");
  const [valeur, setValeur] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setIndices(await listIndices(supabase));
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periode || !valeur) return;
    setSaving(true);
    await supabase
      .from("indices_publies")
      .upsert({ indice, periode, valeur: Number(valeur), source: "INSEE" }, { onConflict: "indice,periode" });
    setValeur("");
    setSaving(false);
    await load();
  }

  async function handleDelete(id: string) {
    await supabase.from("indices_publies").delete().eq("id", id);
    await load();
  }

  if (planLoading) return <PageLoading />;

  if (!isAdmin) {
    return <p className="text-sm text-[var(--foreground)]/60">{t.admin.indicesNotAllowed}</p>;
  }

  return (
    <div className="tunnel-enter">
      <h1 className="mb-2 font-serif text-2xl">{t.admin.indicesTitle}</h1>
      <p className="mb-8 text-[var(--foreground)]/70">{t.admin.indicesSubtitle}</p>

      <form onSubmit={handleSubmit} className="card mb-8 grid gap-4 sm:grid-cols-4 sm:items-end">
        <label className="text-sm">
          <span className="mb-1 block font-medium">{t.admin.indexType}</span>
          <select
            className="input transition-base"
            value={indice}
            onChange={(e) => setIndice(e.target.value as IndexType)}
          >
            <option value="ILC">ILC</option>
            <option value="ILAT">ILAT</option>
            <option value="ICC">ICC</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{t.admin.periode}</span>
          <input
            type="date"
            required
            className="input transition-base"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">{t.admin.valeur}</span>
          <input
            type="number"
            step="0.01"
            required
            className="input transition-base"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
          />
        </label>
        <button type="submit" disabled={saving} className="btn-primary transition-base disabled:opacity-60">
          {t.admin.publier}
        </button>
      </form>

      {loading ? (
        <TableSkeleton rows={3} />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--foreground)]/60">
                <th className="px-4 py-3">{t.admin.indexType}</th>
                <th className="px-4 py-3">{t.admin.periode}</th>
                <th className="px-4 py-3">{t.admin.valeur}</th>
                <th className="px-4 py-3">{t.baux.actions}</th>
              </tr>
            </thead>
            <tbody>
              {indices.map((i) => (
                <tr key={i.id} className="border-b border-[var(--border-color)] last:border-0">
                  <td className="px-4 py-3">{i.indice}</td>
                  <td className="px-4 py-3">{i.periode}</td>
                  <td className="px-4 py-3">{i.valeur}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(i.id)}
                      className="transition-base text-[var(--danger)] hover:underline"
                    >
                      {t.baux.delete}
                    </button>
                  </td>
                </tr>
              ))}
              {indices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-[var(--foreground)]/60">
                    {t.admin.noIndices}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
