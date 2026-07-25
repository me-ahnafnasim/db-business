import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { useTheme } from "../../../theme/ThemeProvider";
import { formatBdt } from "../../../utils/money";

export default function CartSummaryPanel({
  subtotal,
  discount,
  onCheckout,
}) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const total = subtotal - discount;
  const disabled = subtotal <= 0;

  return (
    <View style={styles.summaryPanel}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{t("cart.subtotal")}</Text>
        <Text style={styles.summaryValue}>{formatBdt(subtotal, language)}</Text>
      </View>
      {discount > 0 ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("cart.discount")}</Text>
          <Text style={styles.summaryValue}>-{formatBdt(discount, language)}</Text>
        </View>
      ) : null}
      <View style={styles.divider} />
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>{t("cart.total")}</Text>
        <Text style={styles.totalValue}>{formatBdt(total, language)}</Text>
      </View>
      <Pressable disabled={disabled} style={[styles.checkoutButton, disabled && styles.checkoutButtonDisabled]} onPress={onCheckout}>
        <Text style={styles.checkoutText}>{t("cart.checkout")}</Text>
        <Feather name="arrow-right" size={28} color={colors.black} />
      </Pressable>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    summaryPanel: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 14,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    totalLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },
    totalValue: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "800",
    },
    checkoutButton: {
      marginTop: 10,
      backgroundColor: "#d4af37",
      borderRadius: 26,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    checkoutText: {
      color: "#0a0e27",
      fontSize: 14,
      fontWeight: "700",
    },
    checkoutButtonDisabled: { opacity: 0.4 },
  });
