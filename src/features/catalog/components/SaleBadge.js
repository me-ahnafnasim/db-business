import { memo } from "react";

import { StyleSheet, View } from "react-native";

import { radius, spacing, useStyles } from "../../../theme";
import { AppText } from "../../../ui";

// The discount pill. It was drawn twice on the same amber background with different text
// colours — dark brown on the grid card, navy on the details card.

function SaleBadge({ percent, style }) {
  const styles = useStyles(getStyles);
  if (!percent) return null;

  return (
    <View style={[styles.badge, style]}>
      <AppText variant="micro" style={styles.text}>
        -{percent}%
      </AppText>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    badge: {
      backgroundColor: colors.sale,
      borderRadius: radius.xs,
      paddingHorizontal: spacing.sm - 1,
      paddingVertical: spacing.xs - 1,
      alignSelf: "flex-start",
    },
    text: {
      color: colors.onSale,
    },
  });

export default memo(SaleBadge);
