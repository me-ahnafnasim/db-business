import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import CheckoutSummaryCard from "../features/checkout/components/CheckoutSummaryCard";
import PaymentMethodCard from "../features/checkout/components/PaymentMethodCard";
import { PAYMENT_OPTIONS } from "../features/checkout/data/paymentOptions";
import { Button } from "../ui";

export default function PaymentScreen({ paymentMethod, onBack, onSelectPayment, onContinue }) {
  const { t } = useTranslation();
  const selectedMethod = PAYMENT_OPTIONS.find((option) => option.id === paymentMethod) ?? null;

  return (
    <StackScreenShell
      title={t("checkout.paymentTitle")}
      subtitle={t("checkout.paymentSubtitle")}
      onBack={onBack}
      footer={
        <Button
          title={t("checkout.reviewOrder")}
          onPress={onContinue}
          disabled={!selectedMethod}
          size="lg"
        />
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
