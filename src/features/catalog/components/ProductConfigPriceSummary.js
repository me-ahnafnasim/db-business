import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeProvider";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { formatBdt } from "../../../utils/money";

export default function ProductConfigPriceSummary({
  basePrice,
  originalBasePrice,
  sizeSurcharge,
  logoSurcharge,
  quantity,
  totalPrice,
}) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>{t("catalog.basePrice")}</Text>
        <View style={styles.priceValues}>
          {originalBasePrice > basePrice ? <Text style={styles.originalValue}>{formatBdt(originalBasePrice, language)}</Text> : null}
          <Text style={styles.value}>{formatBdt(basePrice, language)}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t("catalog.quantity")}</Text>
        <Text style={styles.value}>{t("catalog.moq", { count: quantity })}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>{t("catalog.totalPrice")}</Text>
        <Text style={styles.totalValue}>{formatBdt(totalPrice, language)}</Text>
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      padding: 14,
      marginBottom: 16,
      gap: 8,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "600",
    },
    priceValues: { flexDirection: "row", alignItems: "center", gap: 7 },
    originalValue: { color: colors.textSecondary, fontSize: 12, textDecorationLine: "line-through" },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    totalLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    totalValue: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },
  });
