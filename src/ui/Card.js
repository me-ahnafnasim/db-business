import { Pressable, StyleSheet, View } from "react-native";

import { radius, spacing, useStyles } from "../theme";

// The app's surface primitive: rounded, 1px border, no shadow. Replaces twelve separate
// card style blocks whose radii had drifted between 12 and 28.

export default function Card({
  tone = "surface",
  padded = true,
  selected = false,
  onPress,
  style,
  children,
  ...rest
}) {
  const styles = useStyles(getStyles);
  const composed = [
    styles.base,
    styles[`tone_${tone}`],
    padded && styles.padded,
    selected && styles.selected,
    style,
  ];

  if (!onPress) {
    return (
      <View style={composed} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [...composed, pressed && styles.pressed]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tone_surface: {
      backgroundColor: colors.surface,
    },
    tone_soft: {
      backgroundColor: colors.surfaceSoft,
    },
    tone_transparent: {
      backgroundColor: "transparent",
    },
    padded: {
      padding: spacing.lg,
    },
    selected: {
      borderColor: colors.brand,
    },
    pressed: {
      backgroundColor: colors.surfaceSoft,
    },
  });
