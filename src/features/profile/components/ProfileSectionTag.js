import { StyleSheet, View } from "react-native";

import { radius, spacing, useStyles } from "../../../theme";
import { AppText } from "../../../ui";

export default function ProfileSectionTag({ label }) {
  const styles = useStyles(getStyles);

  return (
    <View style={styles.tag}>
      <AppText variant="bodyStrong" accessibilityRole="header">
        {label}
      </AppText>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    tag: {
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      marginBottom: spacing.lg - 2,
    },
  });
