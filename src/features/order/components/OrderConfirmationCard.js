import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function OrderConfirmationCard({ order, onTrackOrder, onContinueShopping }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (!order) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Order Confirmed</Text>
      <Text style={styles.subtitle}>Your mock order has been placed successfully.</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Order ID</Text>
        <Text style={styles.value}>{order.id}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Items</Text>
        <Text style={styles.value}>{order.itemCount}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Shipping</Text>
        <Text style={styles.value}>{order.shippingMethod}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Payment</Text>
        <Text style={styles.value}>{order.paymentMethod}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Estimated Delivery</Text>
        <Text style={styles.value}>{order.eta}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Total</Text>
        <Text style={styles.total}>${order.total.toFixed(2)}</Text>
      </View>
      <Pressable style={styles.primaryButton} onPress={onTrackOrder}>
        <Text style={styles.primaryText}>Track Order</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={onContinueShopping}>
        <Text style={styles.secondaryText}>Continue Shopping</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "800",
      marginBottom: 8,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 18,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
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
    total: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },
    primaryButton: {
      marginTop: 10,
      height: 50,
      borderRadius: 16,
      backgroundColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: {
      color: colors.black,
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryButton: {
      marginTop: 10,
      height: 50,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSoft,
    },
    secondaryText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
  });
