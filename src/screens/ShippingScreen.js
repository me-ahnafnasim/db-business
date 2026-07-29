import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import ShippingAddressForm from "../features/checkout/components/ShippingAddressForm";
import ShippingOptionCard from "../features/checkout/components/ShippingOptionCard";
import CheckoutSummaryCard from "../features/checkout/components/CheckoutSummaryCard";
import { findMethod, localizedName, selectableCouriers } from "../features/checkout/utils/deliveryOptions";
import { typeRequiresAddress } from "../features/checkout/utils/deliveryTypes";
import { getCheckoutTotals } from "../features/checkout/utils/checkoutPricing";
import { spacing, useStyles } from "../theme";
import { AppText, Button, SelectionCard } from "../ui";
import { useLanguage } from "../i18n/LanguageProvider";
import { formatBdt } from "../utils/money";
import { methodPriceBdt } from "../features/checkout/utils/deliveryOptions";

const BD_PHONE_RE = /^01[3-9]\d{8}$/;

export default function ShippingScreen({
  cartItems,
  appliedCoupon,
  couriers,
  courierId,
  shippingMethod,
  shippingAddress,
  savedAddress,
  onBack,
  onSelectCourier,
  onSelectShipping,
  onAddressChange,
  onContinue,
}) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  // Couriers and their methods are admin-managed and arrive with the storefront payload, so
  // this screen renders whatever the dashboard currently offers rather than a fixed list.
  const options = useMemo(() => selectableCouriers(couriers), [couriers]);
  const currentCourier = useMemo(
    () => options.find((courier) => String(courier.id) === String(courierId)) ?? null,
    [options, courierId]
  );
  const currentMethod = useMemo(() => findMethod(couriers, shippingMethod), [couriers, shippingMethod]);
  const totals = useMemo(
    () => getCheckoutTotals({
      cartItems,
      // Shown to the buyer before they order; the server re-reads the same row and charges
      // from it, so this is a preview of an authoritative number rather than the number itself.
      shippingCost: methodPriceBdt(currentMethod),
      appliedCoupon,
    }),
    [appliedCoupon, cartItems, currentMethod]
  );

  const hasSaved = savedAddress && Object.values(savedAddress).some(Boolean);
  const [showNewAddress, setShowNewAddress] = useState(false);

  const addressFields = Object.values(shippingAddress);
  const addressFilled = addressFields.every(Boolean);
  const phoneValid = !shippingAddress.phone || BD_PHONE_RE.test(shippingAddress.phone);
  // Whether an address is needed is a property of the type, not of the row — pickup never
  // needs one, delivery always does. Defaults to requiring an address for an unknown type.
  const needsAddress = Boolean(currentMethod) && typeRequiresAddress(currentMethod.code);
  const addressValid = !needsAddress || (addressFilled && phoneValid);
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
      {!options.length ? (
        <AppText variant="bodySm" tone="secondary" style={styles.sectionNote}>
          {t("checkout.noCouriers")}
        </AppText>
      ) : (
        <>
          {/* Courier first, then that courier's methods: the price belongs to the pair, so a
              method cannot be chosen until its carrier is. */}
          <AppText variant="label" style={styles.sectionTitle}>{t("checkout.chooseCourier")}</AppText>
          {options.map((courier) => (
            <SelectionCard
              key={courier.id}
              selected={String(courier.id) === String(courierId)}
              onPress={() => onSelectCourier?.(courier.id)}
              title={localizedName(courier, language)}
              description={t("checkout.chooseCourierSubtitle")}
            />
          ))}

          {currentCourier ? (
            <>
              <AppText variant="label" style={styles.sectionTitle}>{t("checkout.chooseMethod")}</AppText>
              {currentCourier.methods.map((method) => (
                <ShippingOptionCard
                  key={method.id}
                  method={method}
                  selected={String(method.id) === String(shippingMethod)}
                  onPress={() => onSelectShipping?.(method.id)}
                />
              ))}
            </>
          ) : null}
        </>
      )}
      {needsAddress ? (
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
    sectionTitle: {
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    sectionNote: {
      marginBottom: spacing.lg,
    },
    addressDetails: {
      marginTop: spacing.sm,
      gap: spacing.xs / 2,
    },
  });
