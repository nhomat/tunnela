"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PLANS, formatPrixMensuel } from "@/lib/stripe";
import type { Plan } from "@/lib/types";

function isPlan(value: string): value is Plan {
  return PLANS.some((p) => p.id === value);
}

export function OffreDetailClient() {
  const { t, locale } = useApp();
  const router = useRouter();
  const params = useParams<{ plan: string }>();
  const planId = params.plan;

  if (!isPlan(planId)) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl flex-1 px-6 py-24 text-center">
          <p className="text-[var(--foreground)]/70">Offre introuvable.</p>
          <Link href="/#tarifs" className="btn-secondary transition-base mt-6 inline-flex">
            {t.planDetail.backToComparator}
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const plan = PLANS.find((p) => p.id === planId)!;
  const detail = t.planDetail[planId];
  const features = t.pricing.planFeatures[planId];
  const otherPlans = PLANS.filter((p) => p.id !== planId);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-20 text-center tunnel-enter">
          <Link
            href="/#tarifs"
            className="transition-base mb-6 inline-block text-sm text-[var(--foreground)]/60 hover:text-[var(--accent)]"
          >
            {t.planDetail.backToComparator}
          </Link>
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
            {plan.nom}
          </p>
          <h1 className="font-serif text-3xl font-medium leading-tight sm:text-4xl">
            {detail.tagline}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--foreground)]/75">
            <span className="font-medium text-[var(--foreground)]">{t.planDetail.idealForLabel} : </span>
            {detail.idealFor}
          </p>

          <div className="card mx-auto mt-10 max-w-md">
            <p className="font-serif text-4xl">
              {!plan.prixMensuel ? t.pricing.free : `${formatPrixMensuel(plan.prixMensuel, locale)} €`}
              {plan.prixMensuel !== 0 && (
                <span className="text-base text-[var(--foreground)]/60"> {t.pricing.perMonth}</span>
              )}
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]/70">
              {plan.limiteBaux === null
                ? `${t.pricing.beyond} 100 ${t.pricing.leases}`
                : `${t.pricing.upTo} ${plan.limiteBaux} ${t.pricing.leases}`}
            </p>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="btn-primary transition-base mt-6 w-full"
            >
              {t.pricing.cta}
            </button>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-20">
          <h2 className="mb-6 text-center font-serif text-2xl">{t.planDetail.featuresTitle}</h2>
          <ul className="card flex flex-col gap-3 text-sm">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span aria-hidden="true" className="text-[var(--success)]">
                  ✓
                </span>
                <span className="text-[var(--foreground)]/85">{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24">
          <h2 className="mb-6 text-center font-serif text-lg text-[var(--foreground)]/70">
            {t.planDetail.otherPlans}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {otherPlans.map((p) => (
              <Link
                key={p.id}
                href={`/offres/${p.id}`}
                className="btn-secondary transition-base text-sm"
              >
                {p.nom}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
