"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "./logo";
import { createClient } from "@/lib/supabase/client";

export function HomeLogoLink({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAuthenticated(true);
    });
  }, []);

  // Connecté : le logo ramène toujours au dashboard, jamais vers le site
  // public (qui donnerait l'impression d'être déconnecté).
  if (authenticated) {
    return (
      <Link href="/dashboard/baux" className={`transition-base ${className}`}>
        <LogoMark />
      </Link>
    );
  }

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
