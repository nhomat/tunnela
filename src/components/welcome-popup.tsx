"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "./providers";
import { Logo } from "./logo";

const WELCOME_KEY = "tunnela-welcome-seen";

export function WelcomePopup() {
  const { t } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  // Ne s'affiche qu'une seule fois, à la toute première visite du dashboard :
  // ce composant vit dans DashboardShell (partagé par toutes les pages du
  // dashboard, jamais remonté lors des navigations), donc cet effet ne
  // tourne qu'au tout premier chargement après connexion.
  useEffect(() => {
    if (pathname === "/dashboard/tutoriel") return;
    const seen = window.localStorage.getItem(WELCOME_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!seen) setShow(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markSeen() {
    window.localStorage.setItem(WELCOME_KEY, "true");
    setShow(false);
  }

  function goToTutorial() {
    markSeen();
    router.push("/dashboard/tutoriel");
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-6"
    >
      <div className="card tunnel-enter relative max-w-sm text-center">
        <button
          type="button"
          onClick={markSeen}
          aria-label={t.revision.close}
          className="transition-base absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md hover:bg-[var(--foreground)]/[0.06]"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <div className="mb-3 flex justify-center">
          <Logo className="float-idle h-10 w-10" />
        </div>
        <h2 className="font-serif text-xl">{t.welcome.title}</h2>
        <p className="mt-2 text-sm text-[var(--foreground)]/70">{t.welcome.body}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" onClick={goToTutorial} className="btn-primary transition-base">
            {t.welcome.cta}
          </button>
          <button
            type="button"
            onClick={markSeen}
            className="transition-base text-sm text-[var(--foreground)]/60 hover:underline"
          >
            {t.welcome.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
