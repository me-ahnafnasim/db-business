import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import CheckoutSummaryCard from "../features/checkout/components/CheckoutSummaryCard";
import AllocationLine from "../features/order/components/AllocationLine";
import { spacing, useStyles } from "../theme";
import { AppText, Button, Card } from "../ui";
import { useLanguage } from "../i18n/LanguageProvider";
import { formatBdt } from "../utils/money";

export default function CheckoutReviewScreen({
  cartItems,
  shippingMethod,
  paymentMethod,
  totals,
  onBack,
  onPlaceOrder,
  busy,
  error,
}) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  return (
    <StackScreenShell
      title={t("checkout.reviewTitle")}
      subtitle={t("checkout.reviewSubtitle")}
      onBack={onBack}
      footer={
        <View>
          {error ? (
            <AppText variant="label" tone="error" style={styles.errorText}>
              {error}
            </AppText>
          ) : null}
          <Button
            title={t("checkout.placeOrder")}
            onPress={onPlaceOrder}
            loading={busy}
            size="lg"
          />
        </View>
      }
    >
      <Card>
        <AppText variant="h4" style={styles.cardTitle}>
          {t("checkout.items")}
        </AppText>
        {cartItems.map((item) => (
          <View key={item.lineId} style={styles.row}>
            <View style={styles.rowText}>
              <AppText variant="bodyStrong">{item.name}</AppText>
              <AppText variant="label" tone="secondary">
                {t("catalog.quantity")} {item.quantity} {t("catalog.perDozen")}
              </AppText>
              {(item.allocations || []).map((allocation) => (
                <AllocationLine
                  key={allocation.productVariantId}
                  allocation={allocation}
                  colorNames={item.colorNames}
                  variant="label"
                />
              ))}
            </View>
            <AppText variant="bodySm" tone="primary" style={styles.itemPrice}>
              {formatBdt((item.unitPrice ?? item.price) * item.quantity, language)}
            </AppText>
          </View>
        ))}
      </Card>
      <CheckoutSummaryCard
        rows={[
          { label: t("checkout.shipping"), value: shippingMethod ? t(shippingMethod.labelKey) : "" },
          { label: t("checkout.payment"), value: paymentMethod ? t(paymentMethod.labelKey) : "" },
          { label: t("cart.subtotal"), value: formatBdt(totals.subtotal, language) },
          { label: t("checkout.shippingCost"), value: formatBdt(totals.shippingCost, language) },
          { label: t("cart.discount"), value: `-${formatBdt(totals.discount, language)}` },
        ]}
        total={{ label: t("cart.total"), value: formatBdt(totals.total, language) }}
      />
    </StackScreenShell>
  );
}

const getStyles = () =>
  StyleSheet.create({
    cardTitle: {
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md,
      marginBottom: spacing.sm + 2,
    },
    rowText: {
      flex: 1,
    },
    itemPrice: {
      fontWeight: "700",
    },
    errorText: {
      textAlign: "center",
      marginBottom: spacing.sm,
    },
  });
