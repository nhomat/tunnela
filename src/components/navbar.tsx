"use client";

import Link from "next/link";
import { useApp } from "./providers";
import { LogoMark } from "./logo";
import { ThemeLangToggle } from "./theme-lang-toggle";

export function Navbar() {
  const { t } = useApp();

  return (
    <header className="border-b border-[var(--border-color)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="transition-base">
          <LogoMark />
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/#fonctionnalites" className="transition-base hover:text-[var(--accent)]">
            {t.nav.features}
          </Link>
          <Link href="/#tarifs" className="transition-base hover:text-[var(--accent)]">
            {t.nav.pricing}
          </Link>
          <Link
            href="/article-clause-tunnel"
            className="transition-base hover:text-[var(--accent)]"
          >
            {t.nav.article}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeLangToggle />
          <Link href="/login" className="hidden text-sm sm:inline transition-base hover:text-[var(--accent)]">
            {t.nav.login}
          </Link>
          <Link href="/signup" className="btn-primary transition-base text-sm">
            {t.nav.signup}
          </Link>
        </div>
      </div>
    </header>
  );
}
