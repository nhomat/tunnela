"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PricingTeaser } from "@/components/pricing";
import { PlanComparator } from "@/components/plan-comparator";
import { Reveal } from "@/components/reveal";
import { TiltCard } from "@/components/tilt-card";
import { TunnelVisual } from "@/components/tunnel-visual";

export default function Home() {
  const { t } = useApp();

  const features = [
    { key: "portfolio", ...t.features.portfolio },
    { key: "calculator", ...t.features.calculator },
    { key: "generator", ...t.features.generator },
    { key: "alerts", ...t.features.alerts },
  ];

  return (
    <>
      <Navbar />
      <PageSummary />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="page-blobs">
            <span className="blob blob-laiton" />
            <span className="dot-grid-2d page-dot-grid" aria-hidden="true" />
            <span className="tunnel-ring-3d page-ring-3d" aria-hidden="true" />
          </div>
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="tunnel-enter text-center lg:text-left">
              <p className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
                {t.hero.eyebrow}
              </p>
              <h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">
                {t.hero.title}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--foreground)]/75 lg:mx-0">
                {t.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href="/signup" className="btn-primary transition-base">
                  {t.hero.cta}
                </Link>
                <Link href="/article-clause-tunnel" className="btn-secondary transition-base">
                  {t.hero.ctaSecondary}
                </Link>
              </div>
            </div>
            <div className="tunnel-enter pointer-events-none select-none">
              <TunnelVisual />
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="mx-auto max-w-6xl px-6 py-16">
          <Reveal>
            <h2 className="mb-10 text-center font-serif text-3xl font-medium">
              {t.features.title}
            </h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <Link href={`/fonctionnalites/${f.key}`} className="block">
                  <TiltCard>
                    <div className="card card-hover tilt-target">
                      <h3 className="font-serif text-lg">{f.title}</h3>
                      <p className="mt-2 text-sm text-[var(--foreground)]/70">{f.body}</p>
                    </div>
                  </TiltCard>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <HowItWorks />

        <Reveal>
          <PricingTeaser />
        </Reveal>

        <Reveal>
          <PlanComparator />
        </Reveal>

        <Reveal>
          <Faq />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}

function HowItWorks() {
  const { t } = useApp();
  const [openStep, setOpenStep] = useState<number | null>(null);

  return (
    <section id="comment-ca-marche" className="border-y border-[var(--border-color)] bg-[var(--foreground)]/[0.02] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-medium">{t.howItWorks.title}</h2>
            <p className="mt-2 text-[var(--foreground)]/70">{t.howItWorks.subtitle}</p>
          </div>
        </Reveal>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.howItWorks.steps.map((step, i) => {
            const open = openStep === i;
            return (
              <Reveal key={step.title} delay={i * 110}>
                <button
                  type="button"
                  onClick={() => setOpenStep(open ? null : i)}
                  aria-expanded={open}
                  className="transition-base w-full text-left"
                >
                  <div
                    className="btn-primary float-idle mb-3 flex h-9 w-9 items-center justify-center !rounded-full p-0 font-serif text-sm"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="flex items-center gap-2 font-serif text-lg">
                    {step.title}
                    <span
                      aria-hidden="true"
                      className={`transition-base flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xs text-[var(--accent)] ${
                        open ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </h3>
                  <p className="mt-2 text-sm text-[var(--foreground)]/70">{step.body}</p>
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="mt-2 text-sm text-[var(--foreground)]/60">{step.detail}</p>
                    </div>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PageSummary() {
  const { t } = useApp();
  const items = [
    { href: "#fonctionnalites", label: t.nav.features },
    { href: "#comment-ca-marche", label: t.nav.howItWorks },
    { href: "#tarifs", label: t.nav.pricing },
    { href: "#comparateur", label: t.nav.comparator },
    { href: "/faq", label: t.nav.faq },
  ];

  return (
    <nav
      aria-label={t.nav.summary}
      className="sticky top-0 z-10 flex gap-2.5 overflow-x-auto border-b border-[var(--border-color)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur md:hidden"
    >
      {items.map((item) =>
        item.href.startsWith("#") ? (
          <a
            key={item.href}
            href={item.href}
            className="transition-base shrink-0 rounded-full border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium hover:border-[var(--accent)]"
          >
            {item.label}
          </a>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className="transition-base shrink-0 rounded-full border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium hover:border-[var(--accent)]"
          >
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}

function Faq() {
  const { t } = useApp();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const preview = t.faq.items.slice(0, 4);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="mb-10 text-center font-serif text-3xl font-medium">{t.faq.title}</h2>
      <div className="flex flex-col gap-3">
        {preview.map((item, i) => {
          const open = openIndex === i;
          return (
            <TiltCard key={item.q}>
              <div className="card card-hover tilt-target">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="transition-base flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={open}
                >
                  <span className="font-medium">{item.q}</span>
                  <span
                    aria-hidden="true"
                    className={`transition-base flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] ${
                      open ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="mt-3 text-sm text-[var(--foreground)]/75">{item.a}</p>
                  </div>
                </div>
              </div>
            </TiltCard>
          );
        })}
      </div>
      <div className="mt-8 text-center">
        <Link href="/faq" className="btn-secondary transition-base">
          {t.faq.seeAll} →
        </Link>
      </div>
    </section>
  );
}
