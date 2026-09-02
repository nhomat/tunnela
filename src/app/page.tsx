"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Pricing } from "@/components/pricing";

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
        <section className="mx-auto max-w-4xl px-6 py-24 text-center tunnel-enter">
          <p className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
            {t.hero.eyebrow}
          </p>
          <h1 className="font-serif text-4xl font-medium leading-tight sm:text-5xl">
            {t.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--foreground)]/75">
            {t.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-primary transition-base">
              {t.hero.cta}
            </Link>
            <Link href="/article-clause-tunnel" className="btn-secondary transition-base">
              {t.hero.ctaSecondary}
            </Link>
          </div>
        </section>

        <section id="fonctionnalites" className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-10 text-center font-serif text-3xl font-medium">
            {t.features.title}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card tunnel-enter">
                <h3 className="font-serif text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-[var(--foreground)]/70">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <Pricing />
      </main>
      <Footer />
    </>
  );
}
