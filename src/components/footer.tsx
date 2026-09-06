"use client";

import Link from "next/link";
import { useApp } from "./providers";
import { HomeLogoLink } from "./home-logo-link";

export function Footer() {
  const { t } = useApp();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border-color)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm sm:flex-row">
        <HomeLogoLink />
        <div className="flex items-center gap-6 text-[var(--foreground)]/70">
          <Link href="/article-clause-tunnel" className="transition-base hover:text-[var(--accent)]">
            {t.footer.legal}
          </Link>
          <span>
            © {year} Tunnela. {t.footer.rights}
          </span>
        </div>
      </div>
    </footer>
  );
}
