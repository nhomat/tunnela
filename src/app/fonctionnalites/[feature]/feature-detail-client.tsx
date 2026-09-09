"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { PageIcon3D } from "@/components/page-icon-3d";

const FEATURE_KEYS = ["portfolio", "calculator", "generator", "alerts"] as const;
type FeatureKey = (typeof FEATURE_KEYS)[number];

function isFeatureKey(value: string): value is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(value);
}

function FeatureIcon({ feature }: { feature: FeatureKey }) {
  switch (feature) {
    case "portfolio":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="4" y="3" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "calculator":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="4" y="2" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="6.5" y="4.5" width="7" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="7" cy="11" r="0.9" fill="currentColor" />
          <circle cx="10" cy="11" r="0.9" fill="currentColor" />
          <circle cx="13" cy="11" r="0.9" fill="currentColor" />
          <circle cx="7" cy="14" r="0.9" fill="currentColor" />
          <circle cx="10" cy="14" r="0.9" fill="currentColor" />
        </svg>
      );
    case "generator":
      return (
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
      );
    case "alerts":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 3a4 4 0 0 0-4 4v2.5c0 .7-.25 1.38-.7 1.92L4 13h12l-1.3-1.58A2.98 2.98 0 0 1 14 9.5V7a4 4 0 0 0-4-4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8.2 15.5a1.9 1.9 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

export function FeatureDetailClient() {
  const { t } = useApp();
  const params = useParams<{ feature: string }>();
  const featureKey = params.feature;

  if (!isFeatureKey(featureKey)) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl flex-1 px-6 py-24 text-center">
          <p className="text-[var(--foreground)]/70">Fonctionnalité introuvable.</p>
          <Link href="/#fonctionnalites" className="btn-secondary transition-base mt-6 inline-flex">
            {t.featureDetail.back}
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const info = t.features[featureKey];
  const detail = t.featureDetail[featureKey];
  const otherFeatures = FEATURE_KEYS.filter((key) => key !== featureKey);

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
              href="/#fonctionnalites"
              className="transition-base mb-6 inline-block text-sm text-[var(--foreground)]/60 hover:text-[var(--accent)]"
            >
              {t.featureDetail.back}
            </Link>
            <div className="mb-4 flex justify-center">
              <PageIcon3D>
                <FeatureIcon feature={featureKey} />
              </PageIcon3D>
            </div>
            <h1 className="font-serif text-3xl font-medium leading-tight sm:text-4xl">
              {info.title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-[var(--accent)]">
              {detail.tagline}
            </p>
            <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--foreground)]/75">
              {detail.intro}
            </p>
            <div className="mt-8">
              <Link href="/signup" className="btn-primary transition-base">
                {t.planDetail.tryCta}
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-20">
          <h2 className="mb-8 text-center font-serif text-2xl">{t.featureDetail.howItWorksTitle}</h2>
          <div className="flex flex-col gap-4">
            {detail.steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 80}>
                <div className="card card-hover flex gap-4">
                  <span className="font-serif text-2xl text-[var(--accent)]">{i + 1}</span>
                  <div>
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="mt-1 text-sm text-[var(--foreground)]/75">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24">
          <h2 className="mb-6 text-center font-serif text-lg text-[var(--foreground)]/70">
            {t.features.title}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {otherFeatures.map((key) => (
              <Link
                key={key}
                href={`/fonctionnalites/${key}`}
                className="btn-secondary transition-base text-sm"
              >
                {t.features[key].title}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
