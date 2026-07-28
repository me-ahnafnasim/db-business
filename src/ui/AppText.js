import { memo } from "react";

import { Text } from "react-native";

import { darkColors, lightColors } from "../theme/colors";
import { getTypography } from "../theme/typography";
import { TEXT_SCALING } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import { useLanguage } from "../i18n/LanguageProvider";

// Themed text. `variant` selects a role from the locale-aware type scale, so Bangla gets
// its wider line height automatically; `tone` selects a colour role. Every Text in the
// app routes through here — it is the only place font scaling is capped.
//
// The style for a given (theme, locale, variant, tone) is identical for every instance,
// so it is composed once at module scope and shared. Building it per instance — as this
// component originally did — produced ~6,400 style objects across the ~280 mounted
// AppTexts, of which 2 per instance were ever read.

const TONES = {
  primary: "textPrimary",
  secondary: "textSecondary",
  muted: "muted",
  disabled: "textDisabled",
  brand: "brand",
  onBrand: "onBrand",
  error: "error",
  onError: "onError",
  success: "success",
  warning: "warning",
  inverse: "white",
};

// "d|en" -> Map<"body|primary", frozen style>. Populated lazily, so the realistic
// footprint is the few dozen pairs the app actually uses, not the 12 × 11 × 4 ceiling.
const SCOPES = new Map();

// Verification hook for the claim above — see UI_PERFORMANCE_REPORT.md.
export let __styleBuildCount = 0;

function textStyle(isDarkMode, language, variant, tone) {
  const scopeKey = `${isDarkMode ? "d" : "l"}|${language}`;
  let scope = SCOPES.get(scopeKey);
  if (!scope) {
    scope = new Map();
    SCOPES.set(scopeKey, scope);
  }

  const key = `${variant}|${tone}`;
  let composed = scope.get(key);
  if (composed === undefined) {
    const type = getTypography(language);
    const colors = isDarkMode ? darkColors : lightColors;
    composed = Object.freeze({
      ...(type[variant] ?? type.body),
      color: colors[TONES[tone] ?? TONES.primary],
    });
    scope.set(key, composed);
    if (__DEV__) __styleBuildCount += 1;
  }
  return composed;
}

function AppText({ variant = "body", tone = "primary", style, children, ...rest }) {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const base = textStyle(isDarkMode, language, variant, tone);

  return (
    <Text
      {...TEXT_SCALING}
      {...rest}
      // Passing the cached object directly when there is no override keeps the `style`
      // prop referentially identical across renders, so Text can skip its own diff.
      style={style === undefined ? base : [base, style]}
    >
      {children}
    </Text>
  );
}

export default memo(AppText);
