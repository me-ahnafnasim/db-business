import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import ShippingAddressForm from "../features/checkout/components/ShippingAddressForm";
import ShippingOptionCard from "../features/checkout/components/ShippingOptionCard";
import CheckoutSummaryCard from "../features/checkout/components/CheckoutSummaryCard";
import { SHIPPING_OPTIONS } from "../features/checkout/data/shippingOptions";
import { getCheckoutTotals } from "../features/checkout/utils/checkoutPricing";
import { useTheme } from "../theme/ThemeProvider";
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
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors);
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
        <Pressable style={[styles.button, !canContinue && styles.buttonDisabled]} disabled={!canContinue} onPress={onContinue}>
          <Text style={styles.buttonText}>{t("checkout.continuePayment")}</Text>
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
        hasSaved ? (
          <>
            <Pressable style={[styles.addressCard, !showNewAddress && styles.addressCardActive]} onPress={selectSaved}>
              <View style={styles.radioRow}>
                <View style={[styles.radio, !showNewAddress && styles.radioSelected]}>
                  {!showNewAddress ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={styles.addressCardTitle}>{t("checkout.savedAddress")}</Text>
              </View>
              <View style={styles.addressDetails}>
                <Text style={styles.addressName}>{savedAddress.customerName}</Text>
                <Text style={styles.addressLine}>{savedAddress.phone}</Text>
                <Text style={styles.addressLine}>{[savedAddress.thana, savedAddress.district, savedAddress.division].filter(Boolean).join(", ")}</Text>
                {savedAddress.shopName ? <Text style={styles.addressLine}>{savedAddress.shopName}</Text> : null}
              </View>
            </Pressable>
            <Pressable style={[styles.addressCard, showNewAddress && styles.addressCardActive]} onPress={selectNewAddress}>
              <View style={styles.radioRow}>
                <View style={[styles.radio, showNewAddress && styles.radioSelected]}>
                  {showNewAddress ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={styles.addressCardTitle}>{t("checkout.newAddress")}</Text>
              </View>
              {showNewAddress ? <ShippingAddressForm value={shippingAddress} onChange={onAddressChange} phoneInvalid={!phoneValid} /> : null}
            </Pressable>
          </>
        ) : (
          <ShippingAddressForm value={shippingAddress} onChange={onAddressChange} phoneInvalid={!phoneValid} />
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
    addressCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginTop: 8,
    },
    addressCardActive: {
      borderColor: "#d4af37",
    },
    radioRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    radioSelected: {
      borderColor: "#d4af37",
    },
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#d4af37",
    },
    addressCardTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      flex: 1,
    },
    addressDetails: {
      marginTop: 10,
      marginLeft: 32,
    },
    addressName: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 2,
    },
    addressLine: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 1,
    },
  });
