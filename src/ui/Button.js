import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { control, opacity, radius, spacing, useStyles, useTheme } from "../theme";
import AppText from "./AppText";

// The app's single button. Replaces fourteen hand-styled implementations whose heights
// ranged 42-52 and radii 10-28.
//
// While `loading`, the label stays mounted at zero opacity behind a centred spinner, so
// the button keeps its exact width and height instead of collapsing mid-submit.

const LABEL_TONE = {
  primary: "onBrand",
  secondary: "primary",
  ghost: "brand",
  danger: "onError",
  dangerOutline: "error",
};

// ActivityIndicator takes a colour value rather than a style, so this maps to palette
// keys directly instead of going through the StyleSheet.
const SPINNER_TOKEN = {
  primary: "onBrand",
  secondary: "textPrimary",
  ghost: "brand",
  danger: "onError",
  dangerOutline: "error",
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon = null,
  rightIcon = null,
  accessibilityLabel,
  style,
  ...rest
}) {
  const styles = useStyles(getStyles);
  const { colors } = useTheme();
  const inactive = disabled || loading;
  const tone = LABEL_TONE[variant] ?? "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        fullWidth && styles.fullWidth,
        pressed && !inactive && styles[`pressed_${variant}`],
        inactive && styles.inactive,
        style,
      ]}
      {...rest}
    >
      <View style={[styles.content, loading && styles.hidden]}>
        {leftIcon}
        <AppText variant="bodyStrong" tone={tone} numberOfLines={1}>
          {title}
        </AppText>
        {rightIcon}
      </View>
      {loading ? (
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator size="small" color={colors[SPINNER_TOKEN[variant] ?? "textPrimary"]} />
        </View>
      ) : null}
    </Pressable>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.button,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
      borderWidth: 1,
      borderColor: "transparent",
    },
    fullWidth: {
      alignSelf: "stretch",
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    hidden: {
      opacity: 0,
    },
    spinner: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
    },
    inactive: {
      opacity: opacity.disabled,
    },

    size_sm: { height: control.buttonSm },
    size_md: { height: control.buttonMd },
    size_lg: { height: control.buttonLg },

    variant_primary: { backgroundColor: colors.brand },
    variant_secondary: { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
    variant_ghost: { backgroundColor: "transparent" },
    variant_danger: { backgroundColor: colors.error },
    variant_dangerOutline: { backgroundColor: "transparent", borderColor: colors.errorBorder },

    pressed_primary: { backgroundColor: colors.brandPressed },
    pressed_secondary: { backgroundColor: colors.tabPressedBackground },
    pressed_ghost: { backgroundColor: colors.surfaceSoft },
    pressed_danger: { opacity: opacity.pressed },
    pressed_dangerOutline: { backgroundColor: colors.errorSoft },
  });
