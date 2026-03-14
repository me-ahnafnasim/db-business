import { Pressable, StyleSheet, Text } from "react-native";
import { useMemo } from "react";

import StackScreenShell from "../components/StackScreenShell";
import ShippingAddressForm from "../features/checkout/components/ShippingAddressForm";
import ShippingOptionCard from "../features/checkout/components/ShippingOptionCard";
import CheckoutSummaryCard from "../features/checkout/components/CheckoutSummaryCard";
import { SHIPPING_OPTIONS } from "../features/checkout/data/shippingOptions";
import { getCheckoutTotals } from "../features/checkout/utils/checkoutPricing";
import { useTheme } from "../theme/ThemeProvider";

export default function ShippingScreen({
  cartItems,
  appliedCoupon,
  shippingMethod,
  shippingAddress,
  onBack,
  onSelectShipping,
  onAddressChange,
  onContinue,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const currentMethod = SHIPPING_OPTIONS.find((option) => option.id === shippingMethod) ?? null;
  const totals = useMemo(
    () => getCheckoutTotals({ cartItems, shippingCost: currentMethod?.price ?? 0, appliedCoupon }),
    [appliedCoupon, cartItems, currentMethod]
  );

  const addressValid = !currentMethod?.requiresAddress || Object.values(shippingAddress).every(Boolean);
  const canContinue = Boolean(currentMethod && addressValid);

  return (
    <StackScreenShell
      title="Shipping"
      subtitle="Choose a delivery method"
      onBack={onBack}
      footer={
        <Pressable style={[styles.button, !canContinue && styles.buttonDisabled]} disabled={!canContinue} onPress={onContinue}>
          <Text style={styles.buttonText}>Continue to Payment</Text>
        </Pressable>
      }
    >
      {SHIPPING_OPTIONS.map((option) => (
        <ShippingOptionCard
          key={option.id}
          option={option}
          selected={option.id === shippingMethod}
          onPress={() => onSelectShipping?.(option.id)}
        />
      ))}
      {currentMethod?.requiresAddress ? (
        <ShippingAddressForm value={shippingAddress} onChange={onAddressChange} />
      ) : null}
      <CheckoutSummaryCard
        rows={[
          { label: "Subtotal", value: `$${totals.subtotal.toFixed(2)}` },
          { label: "Shipping", value: `$${totals.shippingCost.toFixed(2)}` },
          { label: "Discount", value: `-$${totals.discount.toFixed(2)}` },
        ]}
        total={{ label: "Estimated Total", value: `$${totals.total.toFixed(2)}` }}
      />
    </StackScreenShell>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    button: {
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.white,
    },
    buttonDisabled: {
      opacity: 0.45,
    },
    buttonText: {
      color: colors.black,
      fontSize: 16,
      fontWeight: "700",
    },
  });
