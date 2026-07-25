import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeProvider";

export default function CheckoutSummaryCard({ title, rows, total }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title || t("checkout.orderSummary")}</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
      {total ? (
        <>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>{total.label}</Text>
            <Text style={styles.totalValue}>{total.value}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginTop: 14,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      gap: 12,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 14,
      flex: 1,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 8,
    },
    totalLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    totalValue: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },
  });
