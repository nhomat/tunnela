"use client";

import Link from "next/link";
import { useApp } from "./providers";
import { HomeLogoLink } from "./home-logo-link";

export function Footer() {
  const { t } = useApp();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border-color)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <HomeLogoLink />
          <p className="mt-3 max-w-[22ch] text-sm text-[var(--foreground)]/60">
            {t.footer.tagline}
          </p>
        </div>

        <FooterColumn title={t.footer.productHeading}>
          <FooterLink href="/#fonctionnalites">{t.footer.linkFeatures}</FooterLink>
          <FooterLink href="/#tarifs">{t.footer.linkPricing}</FooterLink>
          <FooterLink href="/#comparateur">{t.footer.linkComparator}</FooterLink>
        </FooterColumn>

        <FooterColumn title={t.footer.resourcesHeading}>
          <FooterLink href="/article-clause-tunnel">{t.footer.linkArticle}</FooterLink>
          <FooterLink href="/#faq">{t.footer.linkFaq}</FooterLink>
        </FooterColumn>

        <FooterColumn title={t.footer.accountHeading}>
          <FooterLink href="/login">{t.footer.linkLogin}</FooterLink>
          <FooterLink href="/signup" accent>
            {t.footer.linkSignup}
          </FooterLink>
        </FooterColumn>
      </div>

      <div className="border-t border-[var(--border-color)]">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-[var(--foreground)]/60">
          © {year} Tunnela. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--foreground)]/50">
        {title}
      </p>
      <ul className="flex flex-col gap-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  accent,
  children,
}: {
  href: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`transition-base hover:text-[var(--accent)] ${
          accent ? "font-medium text-[var(--accent)]" : "text-[var(--foreground)]/80"
        }`}
      >
        {children}
      </Link>
    </li>
  );
}
