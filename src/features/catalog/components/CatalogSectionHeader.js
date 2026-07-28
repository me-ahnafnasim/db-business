import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { hitSlop, spacing, useStyles, useTheme } from "../../../theme";
import { AppText } from "../../../ui";

export default function CatalogSectionHeader({ title, onPress, actionLabel }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const resolvedActionLabel = actionLabel === undefined ? t("home.viewAll") : actionLabel;
  const showAction = Boolean(resolvedActionLabel);

  return (
    <View style={styles.container}>
      <AppText variant="h2" style={styles.title}>
        {title}
      </AppText>
      {showAction ? (
        <Pressable
          style={styles.action}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={resolvedActionLabel}
          hitSlop={hitSlop.md}
        >
          <AppText variant="bodyStrong" tone="brand" style={styles.actionText}>
            {resolvedActionLabel}
          </AppText>
          <Feather name="chevron-right" size={20} color={colors.brand} />
        </Pressable>
      ) : null}
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.lg - 2,
    },
    title: {
      flex: 1,
      marginRight: spacing.md,
    },
    action: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    actionText: {
      flexShrink: 1,
    },
  });
