"use client";

import { useApp } from "./providers";

export function ThemeLangToggle() {
  const { theme, toggleTheme, locale, setLocale } = useApp();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
        className="btn-secondary transition-base px-3 py-1.5 text-xs uppercase tracking-wide"
        aria-label="Changer de langue"
      >
        {locale === "fr" ? "FR" : "EN"}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className="btn-secondary transition-base px-3 py-1.5 text-xs"
        aria-label={theme === "light" ? "Activer le mode sombre" : "Activer le mode clair"}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}
