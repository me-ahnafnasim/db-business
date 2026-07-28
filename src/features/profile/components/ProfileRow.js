import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, View } from "react-native";

import { spacing, useStyles, useTheme } from "../../../theme";
import { AppText } from "../../../ui";

// One "icon · label · value · chevron" row. The list card and the single-row card each
// had their own copy.
//
// A row without an onPress renders as static text with no chevron — previously every row
// got a chevron whether or not anything happened when you tapped it.

export default function ProfileRow({ icon, label, value, onPress, showDivider = false }) {
  const { colors } = useTheme();
  const styles = useStyles(getStyles);

  const body = (
    <>
      <View style={styles.left}>
        <Feather name={icon} size={26} color={colors.brand} />
        <AppText variant="h4" style={styles.label} numberOfLines={2}>
          {label}
        </AppText>
      </View>
      <View style={styles.right}>
        {value ? (
          <AppText variant="body" tone="secondary" style={styles.value} numberOfLines={1}>
            {value}
          </AppText>
        ) : null}
        {onPress ? <Feather name="chevron-right" size={26} color={colors.textSecondary} /> : null}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, showDivider && styles.divider]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [styles.row, showDivider && styles.divider, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    row: {
      paddingHorizontal: spacing.lg + 2,
      paddingVertical: spacing.xxl - 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pressed: {
      backgroundColor: colors.surfaceSoft,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      flexShrink: 1,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: spacing.md,
      flexShrink: 0,
    },
    label: {
      marginLeft: spacing.lg - 2,
      flexShrink: 1,
    },
    value: {
      marginRight: spacing.md,
      flexShrink: 1,
      textAlign: "right",
    },
  });
