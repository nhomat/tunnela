"use client";

import { useEffect, useRef } from "react";
import { useApp } from "./providers";
import { useOwnBaux } from "@/lib/use-own-baux";
import type { Bail } from "@/lib/types";

export function BailSelector({ onSelect }: { onSelect: (bail: Bail | null) => void }) {
  const { t, activeBailId, setActiveBailId } = useApp();
  const { baux, loading } = useOwnBaux();
  const appliedRef = useRef<string | null>(null);

  // Pré-remplit automatiquement le formulaire avec le bail déjà actif
  // (choisi ici ou dans un autre outil, ou depuis le portefeuille) dès que
  // la liste des baux est chargée, sans que l'utilisateur ait à resélectionner.
  useEffect(() => {
    if (loading || !activeBailId || activeBailId === appliedRef.current) return;
    const bail = baux.find((b) => b.id === activeBailId);
    if (bail) {
      appliedRef.current = activeBailId;
      onSelect(bail);
    } else {
      setActiveBailId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, activeBailId, baux]);

  function handleChange(id: string) {
    appliedRef.current = id || null;
    setActiveBailId(id || null);
    onSelect(id ? (baux.find((b) => b.id === id) ?? null) : null);
  }

  if (loading || baux.length === 0) return null;

  return (
    <label className="card mb-6 block text-sm">
      <span className="mb-1 block font-medium">{t.bailSelector.label}</span>
      <select
        className="input transition-base max-w-sm"
        value={activeBailId ?? ""}
        onChange={(e) => handleChange(e.target.value)}
      >
        <option value="">{t.bailSelector.none}</option>
        {baux.map((b) => (
          <option key={b.id} value={b.id}>
            {b.preneur}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-xs text-[var(--foreground)]/60">{t.bailSelector.hint}</span>
    </label>
  );
}
