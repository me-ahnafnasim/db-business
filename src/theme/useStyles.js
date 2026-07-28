import { useMemo } from "react";

import { useTheme } from "./ThemeProvider";
import { useTypography } from "./typography";

// Memoises a StyleSheet factory against the theme and the locale type scale.
//
// The app's existing idiom rebuilds `getStyles(colors)` on every render in 40 files.
// Routing a factory through this hook keeps the same shape while building the sheet only
// when the theme or language actually changes.
//
//   const styles = useStyles(getStyles);
//
// A factory that closes over extra values must declare them, or the memo will hold a
// stale sheet with no visible symptom:
//
//   const styles = useStyles((colors, type) => getStyles(colors, type, layout), [layout]);
//
export function useStyles(factory, deps = []) {
  const { colors, isDarkMode } = useTheme();
  const typography = useTypography();

  return useMemo(
    () => factory(colors, typography, isDarkMode),
    // `factory` is deliberately not a dependency. Module-level factories are stable, and
    // an inline one would change identity every render and defeat the memo entirely —
    // which is why anything it closes over belongs in `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors, typography, isDarkMode, ...deps]
  );
}
