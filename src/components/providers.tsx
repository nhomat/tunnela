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
  swipeTransitionEnabled: boolean;
  setSwipeTransitionEnabled: (enabled: boolean) => void;
  activeBailId: string | null;
  setActiveBailId: (id: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const THEME_KEY = "tunnela-theme";
const LOCALE_KEY = "tunnela-locale";
const SWIPE_TRANSITION_KEY = "tunnela-swipe-transition";
const ACTIVE_BAIL_KEY = "tunnela-active-bail";

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [locale, setLocaleState] = useState<Locale>("fr");
  const [swipeTransitionEnabled, setSwipeTransitionEnabledState] = useState(true);
  const [activeBailId, setActiveBailIdState] = useState<string | null>(null);

  // One-time read of the viewer's stored preferences on mount, to sync
  // React state with values that can only be read on the client.
  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY) as Theme | null;
    const storedLocale = window.localStorage.getItem(LOCALE_KEY) as Locale | null;
    const storedSwipeTransition = window.localStorage.getItem(SWIPE_TRANSITION_KEY);
    const storedActiveBail = window.localStorage.getItem(ACTIVE_BAIL_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
    if (storedLocale === "fr" || storedLocale === "en") setLocaleState(storedLocale);
    if (storedSwipeTransition === "false") setSwipeTransitionEnabledState(false);
    if (storedActiveBail) setActiveBailIdState(storedActiveBail);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem(SWIPE_TRANSITION_KEY, String(swipeTransitionEnabled));
  }, [swipeTransitionEnabled]);

  useEffect(() => {
    if (activeBailId) {
      window.localStorage.setItem(ACTIVE_BAIL_KEY, activeBailId);
    } else {
      window.localStorage.removeItem(ACTIVE_BAIL_KEY);
    }
  }, [activeBailId]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const setSwipeTransitionEnabled = useCallback((next: boolean) => {
    setSwipeTransitionEnabledState(next);
  }, []);

  const setActiveBailId = useCallback((next: string | null) => {
    setActiveBailIdState(next);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      theme,
      toggleTheme,
      locale,
      setLocale,
      t: dictionary[locale],
      swipeTransitionEnabled,
      setSwipeTransitionEnabled,
      activeBailId,
      setActiveBailId,
    }),
    [
      theme,
      toggleTheme,
      locale,
      setLocale,
      swipeTransitionEnabled,
      setSwipeTransitionEnabled,
      activeBailId,
      setActiveBailId,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <Providers>");
  return ctx;
}
