import { createContext, useContext, useMemo, useState } from "react";

import { darkColors, lightColors } from "./colors";

const ThemeContext = createContext({
  colors: darkColors,
  isDarkMode: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const value = useMemo(
    () => ({
      colors: isDarkMode ? darkColors : lightColors,
      isDarkMode,
      toggleTheme: () => setIsDarkMode((current) => !current),
    }),
    [isDarkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
