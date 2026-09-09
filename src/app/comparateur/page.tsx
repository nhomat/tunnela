"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { PageIcon3D } from "@/components/page-icon-3d";
import { PLANS, formatPrixMensuel } from "@/lib/stripe";
import { hasFeature } from "@/lib/types";
import type { Feature, Plan } from "@/lib/types";

const FEATURE_ROWS: Feature[] = [
  "generator",
  "pdfExport",
  "alerts",
  "revisionWorkflow",
  "search",
  "csvImport",
  "echeancier",
  "notifyEmail",
  "prioritySupport",
  "autoIndex",
  "dedicatedContact",
];

function isPlan(value: string | null): value is Plan {
  return !!value && PLANS.some((p) => p.id === value);
}

function Check({ value }: { value: boolean }) {
  return value ? (
    <span aria-hidden="true" className="text-[var(--success)]">
      ✓
    </span>
  ) : (
    <span aria-hidden="true" className="text-[var(--foreground)]/25">
      —
    </span>
  );
}

export default function ComparateurPage() {
  return (
    <Suspense>
      <ComparateurContent />
    </Suspense>
  );
}

function ComparateurContent() {
  const { t, locale } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawA = searchParams.get("a");
  const rawB = searchParams.get("b");
  const planA: Plan = isPlan(rawA) ? rawA : "cabinet";
  const planB: Plan = isPlan(rawB) ? rawB : "portefeuille";

  const defA = PLANS.find((p) => p.id === planA)!;
  const defB = PLANS.find((p) => p.id === planB)!;
  const samePlan = planA === planB;

  function setPlan(side: "a" | "b", value: Plan) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(side, value);
    params.set(side === "a" ? "b" : "a", side === "a" ? planB : planA);
    router.replace(`/comparateur?${params.toString()}`);
  }

  function priceLabel(prix: number | null) {
    return prix === 0 ? t.pricing.free : `${formatPrixMensuel(prix ?? 0, locale)} €`;
  }

  const priceA = defA.prixMensuel ?? 0;
  const priceB = defB.prixMensuel ?? 0;
  const priceDelta = Math.abs(priceB - priceA);
  const pricierDef = priceB > priceA ? defB : defA;

  const leasesA = defA.limiteBaux ?? 0;
  const leasesB = defB.limiteBaux ?? 0;
  const leasesDelta = Math.abs(leasesB - leasesA);
  const roomierDef = leasesB > leasesA ? defB : defA;

  const differences = FEATURE_ROWS.filter((f) => hasFeature(planA, f) !== hasFeature(planB, f));

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="page-blobs">
            <span className="blob blob-laiton" />
            <span className="blob blob-cobalt dashboard-blob-b" />
            <span className="dot-grid-2d page-dot-grid" aria-hidden="true" />
            <span className="tunnel-ring-3d page-ring-3d" aria-hidden="true" />
          </div>
          <div className="mx-auto max-w-3xl px-6 py-16 text-center tunnel-enter">
            <Link
              href="/#tarifs"
              className="transition-base mb-6 inline-block text-sm text-[var(--foreground)]/60 hover:text-[var(--accent)]"
            >
              {t.comparateur.back}
            </Link>
            <div className="mb-4 flex justify-center">
              <PageIcon3D>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 3v14M4 7h12M6 7l-2 5a2.2 2.2 0 0 0 4 0L6 7ZM14 7l-2 5a2.2 2.2 0 0 0 4 0L14 7Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </PageIcon3D>
            </div>
            <h1 className="font-serif text-3xl font-medium leading-tight sm:text-4xl">
              {t.comparateur.title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--foreground)]/75">
              {t.comparateur.subtitle}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="card flex flex-col gap-2 text-sm">
              <span className="font-medium">{t.comparateur.planALabel}</span>
              <select
                className="input transition-base"
                value={planA}
                onChange={(e) => setPlan("a", e.target.value as Plan)}
              >
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="card flex flex-col gap-2 text-sm">
              <span className="font-medium">{t.comparateur.planBLabel}</span>
              <select
                className="input transition-base"
                value={planB}
                onChange={(e) => setPlan("b", e.target.value as Plan)}
              >
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {samePlan && (
            <p className="mt-4 text-center text-sm text-[var(--accent)]">
              {t.comparateur.samePlanWarning}
            </p>
          )}
        </section>

        {!samePlan && (
          <>
            <section className="mx-auto max-w-3xl px-6 pb-12">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="card card-hover text-center">
                  <p className="font-serif text-lg text-[var(--accent)]">+{formatPrixMensuel(priceDelta, locale)} €</p>
                  <p className="mt-1 text-sm text-[var(--foreground)]/70">
                    {pricierDef.nom} {t.comparateur.priceDifference}
                  </p>
                </div>
                <div className="card card-hover text-center">
                  <p className="font-serif text-lg text-[var(--accent)]">+{leasesDelta}</p>
                  <p className="mt-1 text-sm text-[var(--foreground)]/70">
                    {roomierDef.nom} {t.comparateur.leasesDifference}
                  </p>
                </div>
              </div>
            </section>

            <section className="mx-auto max-w-3xl px-6 pb-16">
              <div className="card overflow-x-auto p-0">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="px-4 py-3 text-xs uppercase tracking-wide text-[var(--foreground)]/60">
                        {t.pricing.compareFeatureCol}
                      </th>
                      <th className="px-4 py-3 text-center font-serif text-base font-normal">{defA.nom}</th>
                      <th className="px-4 py-3 text-center font-serif text-base font-normal">{defB.nom}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--foreground)]/[0.02]">
                      <td className="px-4 py-3 font-medium">{t.comparateur.priceRow}</td>
                      <td className="px-4 py-3 text-center">{priceLabel(defA.prixMensuel)}</td>
                      <td className="px-4 py-3 text-center">{priceLabel(defB.prixMensuel)}</td>
                    </tr>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--foreground)]/[0.02]">
                      <td className="px-4 py-3 font-medium">{t.comparateur.leasesRow}</td>
                      <td className="px-4 py-3 text-center">
                        {defA.limiteBaux === null ? "∞" : defA.limiteBaux}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {defB.limiteBaux === null ? "∞" : defB.limiteBaux}
                      </td>
                    </tr>
                    <tr className="border-b border-[var(--border-color)]">
                      <td className="px-4 py-3 text-[var(--foreground)]/70">
                        {t.pricing.compareFeatures.calculator}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Check value={true} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Check value={true} />
                      </td>
                    </tr>
                    {FEATURE_ROWS.map((feature) => {
                      const diff = hasFeature(planA, feature) !== hasFeature(planB, feature);
                      return (
                        <tr
                          key={feature}
                          className={`border-b border-[var(--border-color)] last:border-0 ${
                            diff ? "bg-[var(--accent)]/[0.07]" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-[var(--foreground)]/70">
                            {t.pricing.compareFeatures[feature]}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Check value={hasFeature(planA, feature)} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Check value={hasFeature(planB, feature)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mx-auto max-w-3xl px-6 pb-24">
              <h2 className="mb-6 text-center font-serif text-2xl">{t.comparateur.differencesTitle}</h2>
              {differences.length === 0 ? (
                <p className="text-center text-sm text-[var(--foreground)]/70">{t.comparateur.noDifference}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {differences.map((feature, i) => {
                    const aHas = hasFeature(planA, feature);
                    const winnerDef = aHas ? defA : defB;
                    return (
                      <Reveal key={feature} delay={i * 70}>
                        <div className="card flex items-center justify-between gap-4">
                          <span className="text-sm">{t.pricing.compareFeatures[feature]}</span>
                          <span className="text-sm font-medium text-[var(--accent)]">
                            {t.comparateur.onlyIn.replace("{plan}", winnerDef.nom)}
                          </span>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              )}

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href={`/offres/${planA}`} className="btn-secondary transition-base text-sm">
                  {defA.nom} — {t.comparateur.viewPlan}
                </Link>
                <Link href={`/offres/${planB}`} className="btn-secondary transition-base text-sm">
                  {defB.nom} — {t.comparateur.viewPlan}
                </Link>
                <Link href="/signup" className="btn-primary transition-base text-sm">
                  {t.planDetail.tryCta}
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
