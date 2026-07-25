import { Pressable, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import CheckoutSummaryCard from "../features/checkout/components/CheckoutSummaryCard";
import PaymentMethodCard from "../features/checkout/components/PaymentMethodCard";
import { PAYMENT_OPTIONS } from "../features/checkout/data/paymentOptions";
import { useTheme } from "../theme/ThemeProvider";

export default function PaymentScreen({ paymentMethod, onBack, onSelectPayment, onContinue }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const selectedMethod = PAYMENT_OPTIONS.find((option) => option.id === paymentMethod) ?? null;

  return (
    <StackScreenShell
      title={t("checkout.paymentTitle")}
      subtitle={t("checkout.paymentSubtitle")}
      onBack={onBack}
      footer={
        <Pressable style={[styles.button, !selectedMethod && styles.buttonDisabled]} disabled={!selectedMethod} onPress={onContinue}>
          <Text style={styles.buttonText}>{t("checkout.reviewOrder")}</Text>
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
        title={t("checkout.selectedMethod")}
        rows={[
          { label: t("checkout.payment"), value: selectedMethod ? t(selectedMethod.labelKey) : t("common.notSelected") },
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
      backgroundColor: "#d4af37",
    },
    buttonDisabled: {
      opacity: 0.45,
    },
    buttonText: {
      color: "#0a0e27",
      fontSize: 16,
      fontWeight: "700",
    },
  });
