import { StyleSheet, Text } from "react-native";

import { TEXT_SCALING, useStyles } from "../theme";

// Themed text. `variant` selects a role from the locale-aware type scale, so Bangla gets
// its wider line height automatically; `tone` selects a colour role. Every Text in the
// app should route through here — it is the only place font scaling is capped.

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

export default function AppText({ variant = "body", tone = "primary", style, children, ...rest }) {
  const styles = useStyles(getStyles);

  return (
    <Text {...TEXT_SCALING} {...rest} style={[styles[variant], styles[`tone_${tone}`], style]}>
      {children}
    </Text>
  );
}

const getStyles = (colors, type) =>
  StyleSheet.create({
    ...type,
    ...Object.fromEntries(
      Object.entries(TONES).map(([tone, token]) => [`tone_${tone}`, { color: colors[token] }])
    ),
  });
