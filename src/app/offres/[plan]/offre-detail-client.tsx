"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { PageIcon3D } from "@/components/page-icon-3d";
import { PLANS } from "@/lib/stripe";
import type { Plan } from "@/lib/types";

function isPlan(value: string): value is Plan {
  return PLANS.some((p) => p.id === value);
}

export function OffreDetailClient() {
  const { t } = useApp();
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
  const limiteValue = plan.limiteBaux === null ? "∞" : String(plan.limiteBaux);

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
          <div className="mx-auto max-w-3xl px-6 py-20 text-center tunnel-enter">
            <Link
              href="/#tarifs"
              className="transition-base mb-6 inline-block text-sm text-[var(--foreground)]/60 hover:text-[var(--accent)]"
            >
              {t.planDetail.backToComparator}
            </Link>
            <div className="mb-4 flex justify-center">
              <PageIcon3D>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 2.5l1.8 4.4 4.7 0.4-3.6 3 1.1 4.6L10 12.6l-4 2.3 1.1-4.6-3.6-3 4.7-.4L10 2.5Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              </PageIcon3D>
            </div>
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

            <div className="card card-hover mx-auto mt-10 flex max-w-md flex-col items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-5xl text-[var(--accent)]">{limiteValue}</span>
                <span className="text-sm text-[var(--foreground)]/70">{t.pricing.leases}</span>
              </div>
              <p className="text-sm text-[var(--foreground)]/60">{t.pricing.subtitle}</p>
              <Link href="/signup" className="btn-primary transition-base w-full">
                {t.planDetail.tryCta}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-20">
          <h2 className="mb-6 text-center font-serif text-2xl">{t.planDetail.featuresTitle}</h2>
          <ul className="card flex flex-col gap-3 text-sm">
            {features.map((feature, i) => (
              <Reveal key={feature} delay={i * 60}>
                <li className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-[var(--success)]">
                    ✓
                  </span>
                  <span className="text-[var(--foreground)]/85">{feature}</span>
                </li>
              </Reveal>
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
