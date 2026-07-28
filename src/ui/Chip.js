import { Pressable, StyleSheet } from "react-native";

import { radius, spacing, useStyles } from "../theme";
import AppText from "./AppText";

// Selectable pill. Replaces four separate chip designs — the language toggle, the
// category filter bar, the division picker and the configurator's option row.
//
// Selection is conveyed through accessibilityState as well as colour, so it is not
// communicated by colour alone.

export default function Chip({
  label,
  selected = false,
  onPress,
  size = "md",
  // Overridable so a chip placed on a fixed dark surface can stay legible in either theme.
  tone = "secondary",
  selectedTone = "brand",
  style,
  ...rest
}) {
  const styles = useStyles(getStyles);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.base,
        styles[`size_${size}`],
        selected && styles.selected,
        pressed && !selected && styles.pressed,
        style,
      ]}
      {...rest}
    >
      <AppText variant={size === "sm" ? "caption" : "label"} tone={selected ? selectedTone : tone}>
        {label}
      </AppText>
    </Pressable>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    size_sm: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 32,
    },
    size_md: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md - 2,
      minHeight: 40,
    },
    selected: {
      backgroundColor: colors.brandSoft,
      borderColor: colors.brand,
    },
    pressed: {
      backgroundColor: colors.tabPressedBackground,
    },
  });
