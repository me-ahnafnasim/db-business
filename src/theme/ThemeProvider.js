import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";

import { darkColors, lightColors } from "./colors";

const THEME_KEY = "@nobosole_theme";

const ThemeContext = createContext({
  colors: darkColors,
  isDarkMode: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored !== null) {
        setIsDarkMode(stored === "dark");
      } else {
        setIsDarkMode((Appearance.getColorScheme() || "dark") === "dark");
      }
      setReady(true);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((current) => {
      const next = !current;
      AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light");
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
