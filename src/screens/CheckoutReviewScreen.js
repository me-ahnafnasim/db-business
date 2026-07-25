import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import CheckoutSummaryCard from "../features/checkout/components/CheckoutSummaryCard";
import { useTheme } from "../theme/ThemeProvider";
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
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  return (
    <StackScreenShell
      title={t("checkout.reviewTitle")}
      subtitle={t("checkout.reviewSubtitle")}
      onBack={onBack}
      footer={
        <View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable style={[styles.button, busy && styles.buttonDisabled]} disabled={busy} onPress={onPlaceOrder}>
          <Text style={styles.buttonText}>{busy ? t("checkout.placingOrder") : t("checkout.placeOrder")}</Text>
        </Pressable>
        </View>
      }
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("checkout.items")}</Text>
        {cartItems.map((item) => (
          <View key={item.lineId} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>{t("catalog.quantity")} {item.quantity} {t("catalog.perDozen")}</Text>
              {(item.allocations || []).map((allocation) => <Text key={allocation.productVariantId} style={styles.itemMeta}>{allocation.colorCode} · {t("catalog.size")} {allocation.sizeCode} · {t("cart.pairs", { count: allocation.pairsPerDozen })}</Text>)}
            </View>
            <Text style={styles.itemPrice}>{formatBdt((item.unitPrice ?? item.price) * item.quantity, language)}</Text>
          </View>
        ))}
      </View>
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
      backgroundColor: "#d4af37",
    },
    buttonText: {
      color: "#0a0e27",
      fontSize: 16,
      fontWeight: "700",
    },
    buttonDisabled: { opacity: 0.5 },
    errorText: {
      color: "#ff4444",
      fontSize: 13,
      textAlign: "center",
      marginBottom: 8,
    },
  });
