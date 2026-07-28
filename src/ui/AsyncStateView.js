import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing, useStyles, useTheme } from "../theme";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

// Loading / error / empty for a screen backed by a single fetch.
//
// The orders and expense screens each carried their own character-for-character copy of
// this block, down to the style names. Returns null once there is content to show.

export default function AsyncStateView({
  status,
  error,
  onRetry,
  isEmpty = false,
  emptyIcon = null,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  if (status === "loading") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (status === "error") {
    return <ErrorState message={error} retryLabel={t("common.retry")} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return null;
}

const getStyles = () =>
  StyleSheet.create({
    centered: {
      paddingVertical: spacing.x4,
      alignItems: "center",
    },
  });
