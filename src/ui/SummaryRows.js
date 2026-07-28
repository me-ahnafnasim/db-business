import { memo } from "react";

import { StyleSheet, View } from "react-native";

import { spacing, useStyles } from "../theme";
import AppText from "./AppText";

// Label/value rows with an optional emphasised total below a rule. The checkout summary
// card and the cart's sticky panel each had their own copy of this.

function SummaryRows({ rows = [], total, emphasis = "md", style, ...rest }) {
  const styles = useStyles(getStyles);

  return (
    <View style={style} {...rest}>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <AppText variant="bodySm" tone="secondary" style={styles.label}>
            {row.label}
          </AppText>
          {/* A row value may be a node when it needs more than plain text, such as a
              struck-through original price sitting beside the current one. */}
          {typeof row.value === "string" || typeof row.value === "number" ? (
            <AppText variant="bodySm">{row.value}</AppText>
          ) : (
            row.value
          )}
        </View>
      ))}
      {total ? (
        <>
          <View style={styles.divider} />
          <View style={styles.row}>
            <AppText variant="bodyStrong">{total.label}</AppText>
            <AppText variant={emphasis === "lg" ? "h3" : "h4"}>{total.value}</AppText>
          </View>
        </>
      ) : null}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
      gap: spacing.md,
    },
    label: {
      flex: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },
  });

export default memo(SummaryRows);
