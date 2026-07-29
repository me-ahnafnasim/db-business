import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { darkColors, lightColors } from "./colors";

const THEME_KEY = "@nobosole_theme";

// The app ships light. It used to open dark, and to follow the OS scheme when nothing was
// stored — which meant a customer whose phone was in dark mode got a dark app no matter
// what the product intended. `userInterfaceStyle: "light"` in app.json says the same thing,
// so the two now agree. Dark is still one tap away in Profile -> Settings, and a stored
// preference always wins.
const DEFAULT_DARK_MODE = false;

// Started at import time, not on mount. The providers nest (Theme gates Language gates the
// app), so a read that only began on mount serialised the two storage round-trips in front
// of the first frame. Kicked off here, both run in parallel before React has even mounted.
const storedThemePromise = AsyncStorage.getItem(THEME_KEY).catch(() => null);

const ThemeContext = createContext({
  colors: lightColors,
  isDarkMode: DEFAULT_DARK_MODE,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(DEFAULT_DARK_MODE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // `ready` gates the entire app — the provider renders null until it flips. The read
    // below previously had no catch, so any storage failure left `ready` false forever
    // and the whole UI stayed blank with no error. The stored theme is a preference, not
    // a precondition: if it cannot be read, fall back and carry on.
    async function restoreTheme() {
      try {
        const stored = await storedThemePromise;
        if (cancelled) return;
        if (stored !== null) {
          setIsDarkMode(stored === "dark");
          return;
        }
        setIsDarkMode(DEFAULT_DARK_MODE);
      } catch {
        if (!cancelled) setIsDarkMode(DEFAULT_DARK_MODE);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    restoreTheme();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((current) => {
      const next = !current;
      // Persisting the preference must never be able to reject into an unhandled promise.
      AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light").catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      colors: isDarkMode ? darkColors : lightColors,
      isDarkMode,
      toggleTheme,
    }),
    [isDarkMode, toggleTheme]
  );

  if (!ready) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
