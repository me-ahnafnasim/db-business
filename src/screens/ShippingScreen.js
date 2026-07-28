import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import ShippingAddressForm from "../features/checkout/components/ShippingAddressForm";
import ShippingOptionCard from "../features/checkout/components/ShippingOptionCard";
import CheckoutSummaryCard from "../features/checkout/components/CheckoutSummaryCard";
import { SHIPPING_OPTIONS } from "../features/checkout/data/shippingOptions";
import { getCheckoutTotals } from "../features/checkout/utils/checkoutPricing";
import { spacing, useStyles } from "../theme";
import { AppText, Button, SelectionCard } from "../ui";
import { useLanguage } from "../i18n/LanguageProvider";
import { formatBdt } from "../utils/money";

const BD_PHONE_RE = /^01[3-9]\d{8}$/;

export default function ShippingScreen({
  cartItems,
  appliedCoupon,
  shippingMethod,
  shippingAddress,
  savedAddress,
  onBack,
  onSelectShipping,
  onAddressChange,
  onContinue,
}) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const currentMethod = SHIPPING_OPTIONS.find((option) => option.id === shippingMethod) ?? null;
  const totals = useMemo(
    () => getCheckoutTotals({ cartItems, shippingCost: currentMethod?.price ?? 0, appliedCoupon }),
    [appliedCoupon, cartItems, currentMethod]
  );

  const hasSaved = savedAddress && Object.values(savedAddress).some(Boolean);
  const [showNewAddress, setShowNewAddress] = useState(false);

  const addressFields = Object.values(shippingAddress);
  const addressFilled = addressFields.every(Boolean);
  const phoneValid = !shippingAddress.phone || BD_PHONE_RE.test(shippingAddress.phone);
  const addressValid = !currentMethod?.requiresAddress || (addressFilled && phoneValid);
  const canContinue = Boolean(currentMethod && addressValid);

  const selectSaved = () => {
    setShowNewAddress(false);
    onAddressChange(savedAddress);
  };

  const selectNewAddress = () => {
    setShowNewAddress(true);
    onAddressChange({ customerName: "", phone: "", division: "", district: "", thana: "", shopName: "" });
  };

  return (
    <StackScreenShell
      title={t("checkout.shippingTitle")}
      subtitle={t("checkout.shippingSubtitle")}
      onBack={onBack}
      footer={
        <Button
          title={t("checkout.continuePayment")}
          onPress={onContinue}
          disabled={!canContinue}
          size="lg"
        />
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
        hasSaved ? (
          <>
            <SelectionCard
              selected={!showNewAddress}
              onPress={selectSaved}
              title={t("checkout.savedAddress")}
            >
              <View style={styles.addressDetails}>
                <AppText variant="bodyStrong">{savedAddress.customerName}</AppText>
                <AppText variant="bodySm" tone="secondary">
                  {savedAddress.phone}
                </AppText>
                <AppText variant="bodySm" tone="secondary">
                  {[savedAddress.thana, savedAddress.district, savedAddress.division]
                    .filter(Boolean)
                    .join(", ")}
                </AppText>
                {savedAddress.shopName ? (
                  <AppText variant="bodySm" tone="secondary">
                    {savedAddress.shopName}
                  </AppText>
                ) : null}
              </View>
            </SelectionCard>
            <SelectionCard
              selected={showNewAddress}
              onPress={selectNewAddress}
              title={t("checkout.newAddress")}
            >
              {showNewAddress ? (
                <ShippingAddressForm
                  value={shippingAddress}
                  onChange={onAddressChange}
                  phoneInvalid={!phoneValid}
                />
              ) : null}
            </SelectionCard>
          </>
        ) : (
          <ShippingAddressForm
            value={shippingAddress}
            onChange={onAddressChange}
            phoneInvalid={!phoneValid}
          />
        )
      ) : null}
      <CheckoutSummaryCard
        rows={[
          { label: t("cart.subtotal"), value: formatBdt(totals.subtotal, language) },
          { label: t("checkout.shipping"), value: formatBdt(totals.shippingCost, language) },
          { label: t("cart.discount"), value: `-${formatBdt(totals.discount, language)}` },
        ]}
        total={{ label: t("checkout.estimatedTotal"), value: formatBdt(totals.total, language) }}
      />
    </StackScreenShell>
  );
}

const getStyles = () =>
  StyleSheet.create({
    addressDetails: {
      marginTop: spacing.sm,
      gap: spacing.xs / 2,
    },
  });
