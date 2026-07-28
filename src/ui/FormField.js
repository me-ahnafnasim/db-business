import { StyleSheet, View } from "react-native";

import { spacing, useStyles } from "../theme";
import AppText from "./AppText";

// Label + control + hint/error. Replaces the label/input block that was copy-pasted eight
// times in the profile form and six more in the shipping form.

export default function FormField({ label, required = false, error, hint, style, children, ...rest }) {
  const styles = useStyles(getStyles);

  return (
    <View style={[styles.group, style]} {...rest}>
      {label ? (
        <AppText variant="label" tone="secondary" style={styles.label}>
          {label}
          {required ? <AppText variant="label" tone="error">{" *"}</AppText> : null}
        </AppText>
      ) : null}
      {children}
      {error ? (
        <AppText variant="caption" tone="error" style={styles.message}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted" style={styles.message}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    group: {
      marginBottom: spacing.md,
    },
    label: {
      marginBottom: spacing.sm,
    },
    message: {
      marginTop: spacing.xs + 2,
    },
  });
