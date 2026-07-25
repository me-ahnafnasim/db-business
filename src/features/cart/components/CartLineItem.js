import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { getLocalizedProduct } from "../../../i18n/product";
import { useTheme } from "../../../theme/ThemeProvider";
import { formatBdt } from "../../../utils/money";
import ProductImage from "../../catalog/components/ProductImage";

export default function CartLineItem({ item, onIncrease, onDecrease, onRemove }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const localizedItem = getLocalizedProduct(item, language);

  return (
    <View style={styles.cartCard}>
      <ProductImage uri={item.image} accessibilityLabel={localizedItem.name} style={styles.productImage} borderRadius={16} />
      <View style={styles.productInfo}>
        <Text numberOfLines={2} style={styles.productName}>
          {localizedItem.name}
        </Text>
        <Text style={styles.productMeta}>{t("cart.packRecipe")}</Text>
        {(item.allocations || []).map((allocation) => (
          <Text key={allocation.productVariantId} style={styles.allocationText}>
            {allocation.colorCode} · {t("catalog.size")} {allocation.sizeCode} · {t("cart.pairs", { count: allocation.pairsPerDozen })}
          </Text>
        ))}
        {!item.moqSatisfied ? <Text style={styles.moqWarning}>{t("cart.moqRemaining", { count: item.moqRemaining })}</Text> : null}
        {!item.configurationValid ? <Text style={styles.moqWarning}>{t("cart.packInvalid")}</Text> : null}
        {item.discountPercent ? <Text style={styles.originalPrice}>{formatBdt((item.unitPrice ?? item.price) * item.quantity, language)}</Text> : null}
        <Text style={styles.productPrice}>{formatBdt((item.discountedUnitPrice ?? item.unitPrice ?? item.price) * item.quantity, language)}</Text>
        <Text style={styles.productMeta}>{t("cart.quantityUnit")}</Text>
        <View style={styles.controlsRow}>
          <Pressable
            style={[styles.qtyButton, item.quantity <= 1 && styles.qtyButtonDisabled]}
            onPress={onDecrease}
            accessibilityRole="button"
            accessibilityLabel={t("cart.decrease", { name: localizedItem.name })}
          >
            <Feather name="minus" size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <Pressable style={styles.qtyButtonActive} onPress={onIncrease} accessibilityRole="button" accessibilityLabel={t("cart.increase", { name: localizedItem.name })}>
            <Feather name="plus" size={22} color={colors.black} />
          </Pressable>
        </View>
      </View>
      <Pressable style={styles.deleteButton} onPress={onRemove} accessibilityRole="button" accessibilityLabel={t("cart.removeItem", { name: localizedItem.name })}>
        <Ionicons name="trash-outline" size={28} color={colors.accent} />
      </Pressable>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    cartCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 28,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 18,
      position: "relative",
      shadowColor: colors.black,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    productImage: {
      width: 82,
      height: 82,
    },
    productInfo: {
      flex: 1,
      paddingRight: 34,
    },
    productName: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 24,
      marginBottom: 6,
    },
    productMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    allocationText: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
    moqWarning: { color: colors.accent, fontSize: 11, fontWeight: "700", marginTop: 4 },
    productPrice: {
      color: colors.textPrimary,
      fontSize: 19,
      fontWeight: "800",
      marginBottom: 12,
      marginTop: 4,
    },
    originalPrice: { color: colors.textSecondary, fontSize: 12, textDecorationLine: "line-through", marginTop: 4 },
    controlsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    qtyButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSoft,
    },
    qtyButtonDisabled: {
      opacity: 0.45,
    },
    qtyButtonActive: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.white,
    },
    quantityText: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
      minWidth: 22,
      textAlign: "center",
    },
    deleteButton: {
      position: "absolute",
      right: 16,
      top: "50%",
      marginTop: -18,
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
  });
