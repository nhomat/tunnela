"use client";

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

  const links = [
    { href: "/dashboard/baux", label: t.dashboard.nav.baux },
    { href: "/dashboard/calculateur", label: t.dashboard.nav.calculateur },
    { href: "/dashboard/clause", label: t.dashboard.nav.clause },
    { href: "/dashboard/echeancier", label: t.dashboard.nav.echeancier },
    { href: "/dashboard/equipe", label: t.dashboard.nav.equipe },
    ...(isAdmin ? [{ href: "/dashboard/admin/indices", label: t.dashboard.nav.indices }] : []),
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="border-b border-[var(--border-color)] md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/">
          <LogoMark />
        </Link>
        <ThemeLangToggle />
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:px-3 md:pb-0">
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

      <div className="hidden px-6 py-6 md:block">
        {isAdmin && plan && <AdminPlanSwitcher currentPlan={plan} />}
        {typeof conformityRatio === "number" && (
          <div className="mb-6">
            <p className="mb-2 text-xs uppercase tracking-wide text-[var(--foreground)]/60">
              {t.dashboard.conformity}
            </p>
            <ConformityRing ratio={conformityRatio} />
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="btn-secondary transition-base w-full text-sm"
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
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="flex items-center gap-3">
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
          className="transition-base"
        />
      </svg>
      <span className="font-serif text-lg">{pct}%</span>
    </div>
  );
}
