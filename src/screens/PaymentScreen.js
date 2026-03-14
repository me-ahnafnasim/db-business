import { Pressable, StyleSheet, Text } from "react-native";

import StackScreenShell from "../components/StackScreenShell";
import CheckoutSummaryCard from "../features/checkout/components/CheckoutSummaryCard";
import PaymentMethodCard from "../features/checkout/components/PaymentMethodCard";
import { PAYMENT_OPTIONS } from "../features/checkout/data/paymentOptions";
import { useTheme } from "../theme/ThemeProvider";

export default function PaymentScreen({ paymentMethod, onBack, onSelectPayment, onContinue }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const selectedMethod = PAYMENT_OPTIONS.find((option) => option.id === paymentMethod) ?? null;

  return (
    <StackScreenShell
      title="Payment"
      subtitle="Choose a payment method"
      onBack={onBack}
      footer={
        <Pressable style={[styles.button, !selectedMethod && styles.buttonDisabled]} disabled={!selectedMethod} onPress={onContinue}>
          <Text style={styles.buttonText}>Review Order</Text>
        </Pressable>
      }
    >
      {PAYMENT_OPTIONS.map((option) => (
        <PaymentMethodCard
          key={option.id}
          method={option}
          selected={option.id === paymentMethod}
          onPress={() => onSelectPayment?.(option.id)}
        />
      ))}
      <CheckoutSummaryCard
        title="Selected Method"
        rows={[
          { label: "Payment", value: selectedMethod?.label ?? "Not selected" },
        ]}
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
