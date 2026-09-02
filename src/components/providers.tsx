"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionary, type Locale, type Dictionary } from "@/i18n/dictionary";

type Theme = "light" | "dark";

interface AppContextValue {
  theme: Theme;
  toggleTheme: () => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const AppContext = createContext<AppContextValue | null>(null);

const THEME_KEY = "tunnela-theme";
const LOCALE_KEY = "tunnela-locale";

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [locale, setLocaleState] = useState<Locale>("fr");

  // One-time read of the viewer's stored preferences on mount, to sync
  // React state with values that can only be read on the client.
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY) as Theme | null;
    const storedLocale = window.localStorage.getItem(LOCALE_KEY) as Locale | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
    if (storedLocale === "fr" || storedLocale === "en") setLocaleState(storedLocale);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({ theme, toggleTheme, locale, setLocale, t: dictionary[locale] }),
    [theme, toggleTheme, locale, setLocale]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <Providers>");
  return ctx;
}
