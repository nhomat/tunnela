"use client";

import { useApp } from "./providers";

export function ThemeLangToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, locale, setLocale } = useApp();
  // Par défaut, les boutons sont petits sur mobile (en-tête serré) et
  // reprennent leur taille normale à partir du breakpoint sm. `compact`
  // garde une taille fixe, un peu plus généreuse que le minimum mobile
  // (utilisé dans la sidebar du dashboard, toujours étroite).
  const sizeClasses = compact
    ? "h-8 w-8 text-xs"
    : "h-7 w-7 text-[10px] sm:h-9 sm:w-9 sm:text-xs";

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "sm:gap-2"}`}>
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
