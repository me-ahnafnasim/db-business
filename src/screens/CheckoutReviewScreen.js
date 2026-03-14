import { Pressable, StyleSheet, Text, View } from "react-native";

import StackScreenShell from "../components/StackScreenShell";
import CheckoutSummaryCard from "../features/checkout/components/CheckoutSummaryCard";
import { useTheme } from "../theme/ThemeProvider";

export default function CheckoutReviewScreen({
  cartItems,
  shippingMethod,
  paymentMethod,
  totals,
  onBack,
  onPlaceOrder,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <StackScreenShell
      title="Checkout Review"
      subtitle="Confirm items, shipping, and payment"
      onBack={onBack}
      footer={
        <Pressable style={styles.button} onPress={onPlaceOrder}>
          <Text style={styles.buttonText}>Place Order</Text>
        </Pressable>
      }
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items</Text>
        {cartItems.map((item) => (
          <View key={item.lineId} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>{item.selectedColor} • {item.selectedSize} • Qty {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>${((item.unitPrice ?? item.price) * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>
      <CheckoutSummaryCard
        rows={[
          { label: "Shipping", value: shippingMethod?.label ?? "" },
          { label: "Payment", value: paymentMethod?.label ?? "" },
          { label: "Subtotal", value: `$${totals.subtotal.toFixed(2)}` },
          { label: "Shipping Cost", value: `$${totals.shippingCost.toFixed(2)}` },
          { label: "Discount", value: `-$${totals.discount.toFixed(2)}` },
        ]}
        total={{ label: "Total", value: `$${totals.total.toFixed(2)}` }}
      />
    </StackScreenShell>
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
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 10,
    },
    rowText: {
      flex: 1,
    },
    itemName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 2,
    },
    itemMeta: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    itemPrice: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    button: {
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.white,
    },
    buttonText: {
      color: colors.black,
      fontSize: 16,
      fontWeight: "700",
    },
  });
