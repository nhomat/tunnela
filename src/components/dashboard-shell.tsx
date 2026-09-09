"use client";

import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "./providers";
import { useCurrentPlan } from "./feature-gate";
import { DashboardSidebar, type DashboardLink } from "./dashboard-sidebar";

const SWIPE_MIN_DISTANCE = 50;
// Doit rester aligné avec le breakpoint `md` de Tailwind : au-delà, la
// sidebar desktop (toujours visible) prend le relais et le swipe est
// désactivé, même sur un écran tactile (laptop/tablette en mode bureau).
const MOBILE_BREAKPOINT = 768;
const TRANSITION_SHOW_MS = 420;
const TRANSITION_FADE_MS = 200;

export function DashboardShell({
  conformityRatio,
  children,
}: {
  conformityRatio?: number;
  children: ReactNode;
}) {
  const { t, swipeTransitionEnabled } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useCurrentPlan();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [transitionLabel, setTransitionLabel] = useState<string | null>(null);
  const [transitionShown, setTransitionShown] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  function playTransition(label: string) {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setTransitionLabel(label);
    requestAnimationFrame(() => setTransitionShown(true));
    showTimer.current = setTimeout(() => {
      setTransitionShown(false);
      hideTimer.current = setTimeout(() => setTransitionLabel(null), TRANSITION_FADE_MS);
    }, TRANSITION_SHOW_MS);
  }

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
    const target = links[targetIndex];
    if (!target) return;

    router.push(target.href);
    if (swipeTransitionEnabled) {
      playTransition(target.label);
    }
  }

  return (
    <>
      <DashboardSidebar links={links} conformityRatio={conformityRatio} />
      <main
        className="relative flex-1 px-6 py-8 md:px-10 md:py-10"
        style={{ touchAction: "pan-y" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </main>
      {transitionLabel && (
        <div
          aria-hidden="true"
          className={`fixed inset-0 z-[70] flex items-center justify-center bg-[var(--background)] transition-opacity ease-out md:hidden ${
            transitionShown ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDuration: `${TRANSITION_FADE_MS}ms` }}
        >
          <span className="tunnel-enter font-serif text-2xl text-[var(--accent)]">
            {transitionLabel}
          </span>
        </div>
      )}
    </>
  );
}
