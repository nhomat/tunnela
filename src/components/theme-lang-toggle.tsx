"use client";

import { useApp } from "./providers";

export function ThemeLangToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, locale, setLocale } = useApp();
  const sizeClasses = compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
        className={`btn-secondary transition-base uppercase tracking-wide ${sizeClasses}`}
        aria-label="Changer de langue"
      >
        {locale === "fr" ? "EN" : "FR"}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className={`btn-secondary transition-base ${sizeClasses}`}
        aria-label={theme === "light" ? "Activer le mode sombre" : "Activer le mode clair"}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}
