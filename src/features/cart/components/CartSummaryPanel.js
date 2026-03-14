import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function CartSummaryPanel({
  subtotal,
  discount,
  onCheckout,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const total = subtotal - discount;

  return (
    <View style={styles.summaryPanel}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
      </View>
      {discount > 0 ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount</Text>
          <Text style={styles.summaryValue}>-${discount.toFixed(2)}</Text>
        </View>
      ) : null}
      <View style={styles.divider} />
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
      </View>
      <Pressable style={styles.checkoutButton} onPress={onCheckout}>
        <Text style={styles.checkoutText}>Checkout</Text>
        <Feather name="arrow-right" size={28} color={colors.black} />
      </Pressable>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    summaryPanel: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 14,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    totalLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },
    totalValue: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "800",
    },
    checkoutButton: {
      marginTop: 10,
      backgroundColor: colors.white,
      borderRadius: 26,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    checkoutText: {
      color: colors.black,
      fontSize: 14,
      fontWeight: "700",
    },
  });
