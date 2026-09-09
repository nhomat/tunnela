"use client";

import { useApp } from "./providers";

export function ThemeLangToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, locale, setLocale } = useApp();
  // Par défaut, les boutons sont petits sur mobile (en-tête serré) et
  // reprennent leur taille normale à partir du breakpoint sm. `compact`
  // force la petite taille partout (utilisé dans la sidebar du dashboard,
  // toujours étroite).
  const sizeClasses = compact
    ? "h-7 w-7 text-[10px]"
    : "h-7 w-7 text-[10px] sm:h-9 sm:w-9 sm:text-xs";

  return (
    <div className={`flex items-center gap-1.5 ${compact ? "" : "sm:gap-2"}`}>
      <button
        type="button"
        onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
        className={`btn-secondary transition-base flex items-center justify-center !rounded-full !p-0 font-medium uppercase tracking-wide ${sizeClasses}`}
        aria-label="Changer de langue"
      >
        {locale === "fr" ? "EN" : "FR"}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className={`btn-secondary transition-base flex items-center justify-center !rounded-full !p-0 ${sizeClasses}`}
        aria-label={theme === "light" ? "Activer le mode sombre" : "Activer le mode clair"}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}
