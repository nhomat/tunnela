"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./logo";

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
