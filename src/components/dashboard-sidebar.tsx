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

export function DashboardSidebar({ conformityRatio }: { conformityRatio?: number }) {
  const { t } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const { plan, isAdmin } = useCurrentPlan();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/dashboard/baux", label: t.dashboard.nav.baux },
    { href: "/dashboard/calculateur", label: t.dashboard.nav.calculateur },
    { href: "/dashboard/clause", label: t.dashboard.nav.clause },
    { href: "/dashboard/echeancier", label: t.dashboard.nav.echeancier },
    { href: "/dashboard/equipe", label: t.dashboard.nav.equipe },
    { href: "/dashboard/tutoriel", label: t.dashboard.nav.tutoriel },
    { href: "/dashboard/parametres", label: t.dashboard.nav.parametres },
    ...(isAdmin ? [{ href: "/dashboard/admin/indices", label: t.dashboard.nav.indices }] : []),
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="border-b border-[var(--border-color)] md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-6 py-4 md:block">
        <Link href="/dashboard/baux" className="transition-base float-idle inline-block">
          <LogoMark />
        </Link>
        <button
          type="button"
          aria-label={t.nav.menu}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="transition-base flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--foreground)]/[0.06] md:hidden"
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

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:px-3 md:pb-0">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-base whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                active
                  ? "bg-[var(--foreground)]/[0.06] font-medium text-[var(--accent)]"
                  : "hover:bg-[var(--foreground)]/[0.04]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div
        className={`border-t border-[var(--border-color)] px-6 py-4 md:mt-auto md:border-t-0 md:py-6 ${
          open ? "block" : "hidden"
        } md:block`}
      >
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
    </aside>
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
