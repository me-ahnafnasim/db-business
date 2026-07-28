import { Pressable, StyleSheet } from "react-native";

import { control, hitSlop, radius, useStyles } from "../theme";

// Icon-only control. The icon element is supplied as children so callers keep control of
// family, size and colour.
//
// Its reason for existing is the touch target: the app's icon buttons are drawn at 28-36dp,
// below the 44dp minimum. Baking hitSlop in here lifts every one of them to a compliant
// target with no layout change at all. `label` is required and becomes the accessible name.

export default function IconButton({
  label,
  onPress,
  size = "md",
  tone = "soft",
  disabled = false,
  style,
  children,
  ...rest
}) {
  const styles = useStyles(getStyles);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={size === "sm" ? hitSlop.md : hitSlop.sm}
      style={({ pressed }) => [
        styles.base,
        styles[`size_${size}`],
        styles[`tone_${tone}`],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    base: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.control,
    },
    size_sm: { width: 28, height: 28, borderRadius: radius.xs },
    size_md: { width: control.icon, height: control.icon },
    size_lg: { width: control.target, height: control.target, borderRadius: radius.pill },
    tone_soft: { backgroundColor: colors.surfaceSoft },
    tone_plain: { backgroundColor: "transparent" },
    tone_bordered: {
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tone_brand: { backgroundColor: colors.brand },
    pressed: { opacity: 0.7 },
    disabled: { opacity: 0.45 },
  });
