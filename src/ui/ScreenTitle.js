import { Pressable, StyleSheet, View } from "react-native";

import { hitSlop, spacing, useStyles } from "../theme";
import AppText from "./AppText";

// The large title block at the top of a tab screen, with an optional right-hand text
// action. The action used to be a bare Text with onPress — no button role, and a tap
// target only as tall as the glyphs.

export default function ScreenTitle({ title, subtitle, actionLabel, onAction, style, ...rest }) {
  const styles = useStyles(getStyles);

  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={styles.row}>
        <AppText variant="h1" style={styles.title}>
          {title}
        </AppText>
        {actionLabel ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            hitSlop={hitSlop.md}
          >
            {({ pressed }) => (
              <AppText variant="h4" tone={pressed ? "brand" : "secondary"}>
                {actionLabel}
              </AppText>
            )}
          </Pressable>
        ) : null}
      </View>
      {subtitle ? (
        <AppText variant="body" tone="secondary" style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    title: {
      flex: 1,
    },
    subtitle: {
      marginTop: spacing.xs + 2,
    },
  });
