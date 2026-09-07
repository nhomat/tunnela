"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Pricing } from "@/components/pricing";
import { PlanComparator } from "@/components/plan-comparator";
import { Reveal } from "@/components/reveal";
import { TiltCard } from "@/components/tilt-card";
import { TunnelVisual } from "@/components/tunnel-visual";

export default function Home() {
  const { t } = useApp();

  const features = [
    t.features.portfolio,
    t.features.calculator,
    t.features.generator,
    t.features.alerts,
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="page-blobs">
            <span className="blob blob-laiton" />
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
                <TiltCard>
                  <div className="card card-hover tilt-target">
                    <h3 className="font-serif text-lg">{f.title}</h3>
                    <p className="mt-2 text-sm text-[var(--foreground)]/70">{f.body}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        <HowItWorks />

        <Reveal>
          <Pricing />
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

  return (
    <section className="border-y border-[var(--border-color)] bg-[var(--foreground)]/[0.02] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-medium">{t.howItWorks.title}</h2>
            <p className="mt-2 text-[var(--foreground)]/70">{t.howItWorks.subtitle}</p>
          </div>
        </Reveal>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.howItWorks.steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 110}>
              <div
                className="btn-primary float-idle mb-3 flex h-9 w-9 items-center justify-center rounded-full p-0 font-serif text-sm"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                {i + 1}
              </div>
              <h3 className="font-serif text-lg">{step.title}</h3>
              <p className="mt-2 text-sm text-[var(--foreground)]/70">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const { t } = useApp();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="mb-10 text-center font-serif text-3xl font-medium">{t.faq.title}</h2>
      <div className="flex flex-col gap-3">
        {t.faq.items.map((item, i) => {
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
    </section>
  );
}
