"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "./providers";
import { HomeLogoLink } from "./home-logo-link";
import { ThemeLangToggle } from "./theme-lang-toggle";

export function Navbar() {
  const { t } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <header id="top" className="border-b border-[var(--border-color)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <HomeLogoLink />
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
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeLangToggle />
          <Link href="/login" className="hidden text-sm sm:inline transition-base hover:text-[var(--accent)]">
            {t.nav.login}
          </Link>
          <Link
            href="/signup"
            className="btn-primary transition-base max-w-[6.5rem] text-center !px-3 !py-1.5 text-xs leading-tight whitespace-normal sm:max-w-none sm:!px-5 sm:!py-2.5 sm:text-sm sm:whitespace-nowrap"
          >
            {t.nav.signup}
          </Link>
          <button
            type="button"
            aria-label={t.nav.menu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="transition-base -mr-1 flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--foreground)]/[0.06] md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {open ? (
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-[var(--border-color)] px-6 py-3 text-sm md:hidden">
          <Link
            href="/#fonctionnalites"
            onClick={() => setOpen(false)}
            className="transition-base rounded-md px-2 py-2 hover:bg-[var(--foreground)]/[0.06]"
          >
            {t.nav.features}
          </Link>
          <Link
            href="/#tarifs"
            onClick={() => setOpen(false)}
            className="transition-base rounded-md px-2 py-2 hover:bg-[var(--foreground)]/[0.06]"
          >
            {t.nav.pricing}
          </Link>
          <Link
            href="/article-clause-tunnel"
            onClick={() => setOpen(false)}
            className="transition-base rounded-md px-2 py-2 hover:bg-[var(--foreground)]/[0.06]"
          >
            {t.nav.article}
          </Link>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="transition-base rounded-md px-2 py-2 hover:bg-[var(--foreground)]/[0.06]"
          >
            {t.nav.login}
          </Link>
        </nav>
      )}
    </header>
  );
}
