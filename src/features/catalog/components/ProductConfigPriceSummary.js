import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProductConfigPriceSummary({
  basePrice,
  sizeSurcharge,
  logoSurcharge,
  quantity,
  totalPrice,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>Base price</Text>
        <Text style={styles.value}>${basePrice.toFixed(2)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Size add-on</Text>
        <Text style={styles.value}>${sizeSurcharge.toFixed(2)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Logo add-on</Text>
        <Text style={styles.value}>${logoSurcharge.toFixed(2)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Quantity</Text>
        <Text style={styles.value}>{quantity}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      padding: 14,
      marginBottom: 16,
      gap: 8,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "600",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
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
