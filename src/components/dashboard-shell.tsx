"use client";

import { useRef, type ReactNode, type TouchEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "./providers";
import { useCurrentPlan } from "./feature-gate";
import { DashboardSidebar, type DashboardLink } from "./dashboard-sidebar";

const SWIPE_MIN_DISTANCE = 50;
// Doit rester aligné avec le breakpoint `md` de Tailwind : au-delà, la
// sidebar desktop (toujours visible) prend le relais et le swipe est
// désactivé, même sur un écran tactile (laptop/tablette en mode bureau).
const MOBILE_BREAKPOINT = 768;

export function DashboardShell({
  conformityRatio,
  children,
}: {
  conformityRatio?: number;
  children: ReactNode;
}) {
  const { t } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useCurrentPlan();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const links: DashboardLink[] = [
    { href: "/dashboard/baux", label: t.dashboard.nav.baux },
    { href: "/dashboard/calculateur", label: t.dashboard.nav.calculateur },
    { href: "/dashboard/clause", label: t.dashboard.nav.clause },
    { href: "/dashboard/echeancier", label: t.dashboard.nav.echeancier },
    { href: "/dashboard/equipe", label: t.dashboard.nav.equipe },
    { href: "/dashboard/tutoriel", label: t.dashboard.nav.tutoriel },
    { href: "/dashboard/parametres", label: t.dashboard.nav.parametres },
    ...(isAdmin ? [{ href: "/dashboard/admin/indices", label: t.dashboard.nav.indices }] : []),
  ];

  function handleTouchStart(e: TouchEvent<HTMLElement>) {
    if (typeof window !== "undefined" && window.innerWidth >= MOBILE_BREAKPOINT) {
      touchStart.current = null;
      return;
    }
    // Un tableau qui défile horizontalement (baux, équipe, indices) gère son
    // propre glissement : on n'intercepte pas les swipes qui démarrent dedans.
    const scrollable = (e.target as HTMLElement).closest<HTMLElement>("[data-hscroll]");
    if (scrollable && scrollable.scrollWidth > scrollable.clientWidth) {
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: TouchEvent<HTMLElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;

    const deltaX = e.changedTouches[0].clientX - start.x;
    const deltaY = e.changedTouches[0].clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    const currentIndex = links.findIndex((link) => link.href === pathname);
    if (currentIndex === -1) return;

    const targetIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < links.length) {
      router.push(links[targetIndex].href);
    }
  }

  return (
    <>
      <DashboardSidebar links={links} conformityRatio={conformityRatio} />
      <main
        className="relative flex-1 px-6 py-8 md:px-10 md:py-10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </main>
    </>
  );
}
