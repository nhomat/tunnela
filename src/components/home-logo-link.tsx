"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./logo";

// Logo du site public (navbar, footer) : ramène toujours à l'accueil, quel
// que soit l'état de connexion — c'est le comportement attendu d'un logo de
// site vitrine. Pour le dashboard, voir le lien dédié dans DashboardSidebar.
export function HomeLogoLink({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return (
      <a
        href="#top"
        className={`transition-base ${className}`}
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <LogoMark />
      </a>
    );
  }

  return (
    <Link href="/" className={`transition-base ${className}`}>
      <LogoMark />
    </Link>
  );
}
