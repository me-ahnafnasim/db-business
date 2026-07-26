import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { useTheme } from "../../../theme/ThemeProvider";
import { formatBdt } from "../../../utils/money";

export default function OrderConfirmationCard({ order, onTrackOrder, onContinueShopping }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  if (!order) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("confirmation.success")}</Text>
      <Text style={styles.subtitle}>{t("confirmation.subtitle")}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>{t("confirmation.status")}</Text>
        <Text style={styles.value}>{t(`status.${String(order.status || "pending").toLowerCase()}`)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t("confirmation.orderNumber")}</Text>
        <Text style={styles.value}>{order.id}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t("confirmation.items")}</Text>
        <Text style={styles.value}>{order.itemCount}</Text>
      </View>
      {(order.packs || []).map((pack) => (
        <View key={pack.lineId || pack.id} style={styles.pack}>
          <Text style={styles.packTitle}>{pack.name} · {pack.quantity} {t("catalog.perDozen")}</Text>
          {(pack.allocations || []).map((allocation) => <Text key={allocation.productVariantId} style={styles.packMeta}>{language === 'bn' && pack.colorNames?.[allocation.colorCode]?.bn || allocation.colorCode} · {t("catalog.size")} {allocation.sizeCode} · {t("cart.pairs", { count: allocation.pairsPerDozen })}</Text>)}
        </View>
      ))}
      <View style={styles.row}>
        <Text style={styles.label}>{t("confirmation.shipping")}</Text>
        <Text style={styles.value}>{t(order.shippingMethodKey || "checkout.pickup")}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t("confirmation.payment")}</Text>
        <Text style={styles.value}>{t(order.paymentMethodKey || "status.unpaid")}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t("confirmation.delivery")}</Text>
        <Text style={styles.value}>{t(order.etaKey || "checkout.pickupDescription")}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t("confirmation.total")}</Text>
        <Text style={styles.total}>{formatBdt(order.total, language)}</Text>
      </View>
      <Pressable style={styles.primaryButton} onPress={onTrackOrder}>
        <Text style={styles.primaryText}>{t("confirmation.track")}</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={onContinueShopping}>
        <Text style={styles.secondaryText}>{t("confirmation.continueShopping")}</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "800",
      marginBottom: 8,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 18,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      gap: 12,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 14,
      flex: 1,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    pack: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 8 },
    packTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: "700" },
    packMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
    total: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },
    primaryButton: {
      marginTop: 10,
      height: 50,
      borderRadius: 16,
      backgroundColor: "#d4af37",
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: {
      color: "#0a0e27",
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryButton: {
      marginTop: 10,
      height: 50,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSoft,
    },
    secondaryText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
  });
