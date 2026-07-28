import { StyleSheet, View } from "react-native";

import { spacing, useStyles } from "../theme";
import AppText from "./AppText";
import Button from "./Button";

// Replaces six different empty states that ranged from a polished icon-plus-CTA panel in
// the cart down to a single line of grey text in search results.

export default function EmptyState({
  icon = null,
  title,
  description,
  actionLabel,
  onAction,
  style,
  ...rest
}) {
  const styles = useStyles(getStyles);

  return (
    <View style={[styles.container, style]} {...rest}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      {title ? (
        <AppText variant="h4" tone="primary" style={styles.centered}>
          {title}
        </AppText>
      ) : null}
      {description ? (
        <AppText variant="bodySm" tone="secondary" style={[styles.centered, styles.description]}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          size="sm"
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.x5,
      paddingHorizontal: spacing.xl,
    },
    icon: {
      marginBottom: spacing.lg,
    },
    centered: {
      textAlign: "center",
    },
    description: {
      marginTop: spacing.sm,
    },
    action: {
      marginTop: spacing.xxl,
    },
  });
