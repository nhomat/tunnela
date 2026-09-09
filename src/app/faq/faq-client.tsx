"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { TiltCard } from "@/components/tilt-card";
import { PageIcon3D } from "@/components/page-icon-3d";

export function FaqClient() {
  const { t } = useApp();
  const [openKey, setOpenKey] = useState<string | null>(t.faq.items[0]?.q ?? null);

  type FaqItem = (typeof t.faq.items)[number];
  const categories: { name: string; items: FaqItem[] }[] = [];
  for (const item of t.faq.items) {
    let group = categories.find((c) => c.name === item.category);
    if (!group) {
      group = { name: item.category, items: [] };
      categories.push(group);
    }
    group.items.push(item);
  }

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
          <div className="mx-auto max-w-2xl px-6 py-20 text-center tunnel-enter">
            <div className="mb-4 flex justify-center">
              <PageIcon3D>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M7.2 7.5a2.8 2.8 0 1 1 3.9 2.6c-.9.4-1.4 1-1.4 1.9v.3"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="15.2" r="0.9" fill="currentColor" />
                </svg>
              </PageIcon3D>
            </div>
            <h1 className="font-serif text-3xl font-medium leading-tight sm:text-4xl">
              {t.faq.title}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--foreground)]/75">
              {t.faq.subtitle}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-16">
          <div className="flex flex-col gap-12">
            {categories.map((group, gi) => (
              <div key={group.name}>
                <Reveal delay={gi * 60}>
                  <h2 className="mb-5 font-serif text-xl text-[var(--accent)]">{group.name}</h2>
                </Reveal>
                <div className="flex flex-col gap-3">
                  {group.items.map((item, i) => {
                    const open = openKey === item.q;
                    return (
                      <Reveal key={item.q} delay={gi * 60 + i * 50}>
                        <TiltCard>
                          <div className="card card-hover tilt-target">
                            <button
                              type="button"
                              onClick={() => setOpenKey(open ? null : item.q)}
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
                                <p className="mt-3 text-sm text-[var(--foreground)]/75">
                                  {item.a}
                                </p>
                              </div>
                            </div>
                          </div>
                        </TiltCard>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-24">
          <Reveal>
            <div className="card card-hover flex flex-col items-center gap-3 text-center">
              <h2 className="font-serif text-xl">{t.faq.contactTitle}</h2>
              <p className="text-sm text-[var(--foreground)]/70">{t.faq.contactBody}</p>
              <a
                href="mailto:tunnela.team@gmail.com"
                className="btn-primary transition-base mt-2"
              >
                {t.faq.contactCta}
              </a>
              <Link
                href="/reserver-un-call"
                className="transition-base text-sm text-[var(--foreground)]/60 hover:text-[var(--accent)]"
              >
                {t.footer.linkBookCall}
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
