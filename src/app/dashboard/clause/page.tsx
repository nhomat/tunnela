"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { genererClauseTunnel, genererAvenantICC } from "@/lib/clause-generator";
import { exportTextAsPdf } from "@/lib/pdf-export";
import { FeatureGate, useCurrentPlan } from "@/components/feature-gate";
import { createClient } from "@/lib/supabase/client";
import { PageIcon3D } from "@/components/page-icon-3d";

type Mode = "tunnel" | "avenant";

export default function ClausePage() {
  const { plan } = useCurrentPlan();

  return (
    <FeatureGate feature="generator" plan={plan}>
      <ClauseGenerator />
    </FeatureGate>
  );
}

function ClauseGenerator() {
  const { t } = useApp();
  const [mode, setMode] = useState<Mode>("tunnel");

  const [bailleur, setBailleur] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("abonnements")
        .select("nom_bailleur_defaut")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.nom_bailleur_defaut) setBailleur(data.nom_bailleur_defaut);
    })();
  }, []);
  const [preneur, setPreneur] = useState("");
  const [adresse, setAdresse] = useState("");
  const [indice, setIndice] = useState<"ILC" | "ILAT">("ILC");
  const [symetrique, setSymetrique] = useState(true);
  const [plancher, setPlancher] = useState("-1");
  const [plafond, setPlafond] = useState("3");
  const [periodicite, setPeriodicite] = useState<"annuelle" | "trimestrielle">("annuelle");
  const [dateEffet, setDateEffet] = useState("");

  const [texte, setTexte] = useState("");
  const [copied, setCopied] = useState(false);

  function handleGenerer(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "tunnel") {
      setTexte(
        genererClauseTunnel({
          bailleur,
          preneur,
          adresse,
          indice,
          symetrique,
          plancherPct: Number(plancher),
          plafondPct: Number(plafond),
          periodicite,
        })
      );
    } else {
      setTexte(
        genererAvenantICC({
          bailleur,
          preneur,
          adresse,
          nouvelIndice: indice,
          dateEffet,
        })
      );
    }
    setCopied(false);
  }

  async function handleCopier() {
    await navigator.clipboard.writeText(texte);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExportPdf() {
    const title = mode === "tunnel" ? t.clause.modeTunnel : t.clause.modeAvenant;
    const filename = `${mode === "tunnel" ? "clause-tunnel" : "avenant-icc-ilc"}-${preneur || "document"}.pdf`;
    exportTextAsPdf(title, texte, filename.toLowerCase().replace(/\s+/g, "-"));
  }

  return (
    <div className="tunnel-enter">
      <div className="mb-6 flex items-center gap-3">
        <PageIcon3D>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M5 2.5h7l3 3V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M12 2.5V6h3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path
              d="M7 10.5l4-4 1.5 1.5-4 4H7v-1.5Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </PageIcon3D>
        <h1 className="font-serif text-2xl">{t.clause.title}</h1>
      </div>

      <div className="mb-8 inline-flex rounded-lg border border-[var(--border-color)] p-1">
        <ModeButton active={mode === "tunnel"} onClick={() => setMode("tunnel")}>
          {t.clause.modeTunnel}
        </ModeButton>
        <ModeButton active={mode === "avenant"} onClick={() => setMode("avenant")}>
          {t.clause.modeAvenant}
        </ModeButton>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleGenerer} className="card flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t.clause.bailleur}</span>
              <input
                required
                className="input transition-base"
                value={bailleur}
                onChange={(e) => setBailleur(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t.clause.preneur}</span>
              <input
                required
                className="input transition-base"
                value={preneur}
                onChange={(e) => setPreneur(e.target.value)}
              />
            </label>
          </div>

          <label className="text-sm">
            <span className="mb-1 block font-medium">{t.clause.adresse}</span>
            <input
              required
              className="input transition-base"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium">{t.clause.indice}</span>
            <select
              className="input transition-base"
              value={indice}
              onChange={(e) => setIndice(e.target.value as "ILC" | "ILAT")}
            >
              <option value="ILC">ILC</option>
              <option value="ILAT">ILAT</option>
            </select>
          </label>

          {mode === "tunnel" ? (
            <>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={symetrique}
                    onChange={() => setSymetrique(true)}
                  />
                  {t.clause.symetrique}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!symetrique}
                    onChange={() => setSymetrique(false)}
                  />
                  {t.clause.asymetrique}
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm">
                  <span className="mb-1 block font-medium">{t.clause.plancher}</span>
                  <input
                    type="number"
                    step="0.01"
                    className="input transition-base"
                    value={plancher}
                    onChange={(e) => setPlancher(e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium">{t.clause.plafond}</span>
                  <input
                    type="number"
                    step="0.01"
                    className="input transition-base"
                    value={plafond}
                    onChange={(e) => setPlafond(e.target.value)}
                  />
                </label>
              </div>

              <label className="text-sm">
                <span className="mb-1 block font-medium">{t.clause.periodicite}</span>
                <select
                  className="input transition-base"
                  value={periodicite}
                  onChange={(e) =>
                    setPeriodicite(e.target.value as "annuelle" | "trimestrielle")
                  }
                >
                  <option value="annuelle">{t.clause.annuelle}</option>
                  <option value="trimestrielle">{t.clause.trimestrielle}</option>
                </select>
              </label>
            </>
          ) : (
            <label className="text-sm">
              <span className="mb-1 block font-medium">{t.clause.dateEffet}</span>
              <input
                required
                placeholder="1er janvier 2027"
                className="input transition-base"
                value={dateEffet}
                onChange={(e) => setDateEffet(e.target.value)}
              />
            </label>
          )}

          <button type="submit" className="btn-primary transition-base">
            {t.clause.generer}
          </button>
        </form>

        <div className="card card-hover tunnel-enter">
          {texte ? (
            <>
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap font-sans text-sm">
                {texte}
              </pre>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCopier}
                  className="btn-secondary transition-base"
                >
                  {copied ? t.clause.copied : t.clause.copier}
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="btn-primary transition-base"
                >
                  {t.clause.exportPdf}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--foreground)]/60">—</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`transition-base rounded-md px-4 py-1.5 text-sm ${
        active ? "bg-[var(--foreground)]/[0.08] font-medium" : ""
      }`}
    >
      {children}
    </button>
  );
}
