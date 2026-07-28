import { StyleSheet, View } from "react-native";

import { spacing, useStyles } from "../theme";
import AppText from "./AppText";
import Button from "./Button";

// Replaces four separate error-and-retry blocks. Marked as an assertive live region so
// screen readers announce a failure instead of silently leaving the user on a blank list.

export default function ErrorState({ title, message, retryLabel, onRetry, style, ...rest }) {
  const styles = useStyles(getStyles);

  return (
    <View
      style={[styles.container, style]}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      {...rest}
    >
      {title ? (
        <AppText variant="h4" tone="primary" style={styles.centered}>
          {title}
        </AppText>
      ) : null}
      {message ? (
        <AppText variant="bodySm" tone="error" style={[styles.centered, styles.message]}>
          {message}
        </AppText>
      ) : null}
      {retryLabel && onRetry ? (
        <Button
          title={retryLabel}
          onPress={onRetry}
          variant="secondary"
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
      paddingVertical: spacing.x4,
      paddingHorizontal: spacing.xl,
    },
    centered: {
      textAlign: "center",
    },
    message: {
      marginTop: spacing.sm,
    },
    action: {
      marginTop: spacing.xl,
    },
  });
