"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "./providers";
import { LogoMark } from "./logo";
import { ThemeLangToggle } from "./theme-lang-toggle";
import { AdminPlanSwitcher } from "./admin-plan-switcher";
import { useCurrentPlan } from "./feature-gate";
import { createClient } from "@/lib/supabase/client";

export type DashboardLink = { href: string; label: string };

export function DashboardSidebar({
  links,
  conformityRatio,
}: {
  links: DashboardLink[];
  conformityRatio?: number;
}) {
  const { t } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const { plan, isAdmin } = useCurrentPlan();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function linkClassName(href: string) {
    const active = pathname === href;
    return `transition-base whitespace-nowrap rounded-md px-3 py-2 text-sm ${
      active
        ? "bg-[var(--foreground)]/[0.06] font-medium text-[var(--accent)]"
        : "hover:bg-[var(--foreground)]/[0.04]"
    }`;
  }

  const navLinks = links.map((link) => (
    <Link key={link.href} href={link.href} className={linkClassName(link.href)}>
      {link.label}
    </Link>
  ));

  return (
    <aside className="border-b border-[var(--border-color)] md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-3 md:block md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/baux" className="transition-base float-idle shrink-0">
            <LogoMark />
          </Link>
          {typeof conformityRatio === "number" && (
            <ConformityBadge ratio={conformityRatio} label={t.dashboard.conformity} className="shrink-0 md:hidden" />
          )}
        </div>
        <button
          type="button"
          aria-label={t.nav.menu}
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="transition-base flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-[var(--foreground)]/[0.06] md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">{navLinks}</nav>

      <nav className="hidden gap-1 px-3 pb-3 md:flex md:flex-1 md:flex-col md:overflow-visible md:px-3 md:pb-0">
        {navLinks}
      </nav>

      {/* Desktop : bloc fixe en bas de la sidebar, toujours visible. */}
      <div className="hidden px-6 py-6 md:mt-auto md:block">
        {isAdmin && plan && <AdminPlanSwitcher currentPlan={plan} />}
        {typeof conformityRatio === "number" && (
          <div className="mb-6">
            <p className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground)]/60">
              {t.dashboard.conformity}
            </p>
            <ConformityRing ratio={conformityRatio} />
          </div>
        )}
        <div className="mb-4 flex justify-center">
          <ThemeLangToggle compact />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="btn-secondary transition-base w-full px-3.5 py-1.5 text-xs"
        >
          {t.dashboard.logout}
        </button>
      </div>

      {/* Mobile : tiroir qui glisse depuis la droite. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-out md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-l border-[var(--border-color)] bg-[var(--background)] px-6 py-6 shadow-xl transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="font-serif text-lg">{t.nav.menu}</span>
          <button
            type="button"
            aria-label={t.revision.close}
            onClick={() => setOpen(false)}
            className="transition-base flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--foreground)]/[0.06]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        {isAdmin && plan && <AdminPlanSwitcher currentPlan={plan} />}
        <div className="mb-4 flex justify-center">
          <ThemeLangToggle compact />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="btn-secondary transition-base w-full px-3.5 py-1.5 text-xs"
        >
          {t.dashboard.logout}
        </button>
      </div>
    </aside>
  );
}

function ConformityBadge({
  ratio,
  label,
  className = "",
}: {
  ratio: number;
  label: string;
  className?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  const color = pct >= 80 ? "var(--success)" : pct >= 40 ? "var(--accent)" : "var(--danger)";

  return (
    <span
      title={label}
      aria-label={`${label} : ${pct} %`}
      className={`flex items-center gap-1.5 rounded-full border border-[var(--border-color)] px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${className}`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {pct}% conformes
    </span>
  );
}

function ConformityRing({ ratio }: { ratio: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  const circumference = 2 * Math.PI * 26;
  const targetOffset = circumference * (1 - pct / 100);
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOffset(targetOffset));
    return () => cancelAnimationFrame(frame);
  }, [targetOffset]);

  return (
    <div className="conformity-ring-3d flex items-center gap-3">
      <svg width="60" height="60" viewBox="0 0 60 60" className="shrink-0">
        <circle
          cx="30"
          cy="30"
          r="26"
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="6"
        />
        <circle
          cx="30"
          cy="30"
          r="26"
          fill="none"
          stroke="var(--success)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 30 30)"
          className="conformity-ring-fill"
        />
      </svg>
      <span className="font-serif text-lg">{pct}%</span>
    </div>
  );
}
