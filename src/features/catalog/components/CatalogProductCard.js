import Feather from "@expo/vector-icons/Feather";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { getLocalizedProduct } from "../../../i18n/product";
import { useTheme } from "../../../theme/ThemeProvider";
import { formatBdt } from "../../../utils/money";
import ProductImage from "./ProductImage";

function CatalogProductCard({ product, onOpenProduct, cardWidth = 236 }) {
  const { colors, isDarkMode } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors, isDarkMode);
  const displayProduct = getLocalizedProduct(product, language);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t("catalog.viewProduct")}: ${displayProduct.name}`}
      onPress={() => onOpenProduct?.(product)}
      style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.cardPressed]}
    >
      <View style={styles.imageFrame}>
        <ProductImage
          uri={product.image}
          accessibilityLabel={t("catalog.imageOf", { current: 1, total: product.images?.length || 1, name: displayProduct.name })}
          borderRadius={16}
        />
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>{displayProduct.name}</Text>
        {product.discountPercent ? <View style={styles.saleRow}><Text style={styles.saleBadge}>-{product.discountPercent}%</Text><Text style={styles.originalPrice}>{formatBdt(product.originalPrice, language)}</Text></View> : null}
        <Text style={styles.price}>{t("catalog.from")} {formatBdt(product.price, language)}</Text>
        <Text numberOfLines={1} style={styles.moq}>{t("catalog.moq", { count: product.moq })}</Text>
        <View style={styles.button}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={styles.buttonText}>
            {t("catalog.viewProduct")}
          </Text>
          <Feather name="arrow-right" size={16} color={isDarkMode ? colors.black : "#0a0e27"} />
        </View>
      </View>
    </Pressable>
  );
}

export default memo(CatalogProductCard);

const getStyles = (colors, isDarkMode) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  imageFrame: {
    padding: 8,
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    minHeight: 40,
  },
  price: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
  },
  saleRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 7 },
  saleBadge: { color: "#7a220b", backgroundColor: "#f4ca55", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: "900" },
  originalPrice: { color: colors.textSecondary, fontSize: 12, textDecorationLine: "line-through" },
  moq: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  button: {
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: isDarkMode ? "#d4af37" : "#e5bd42",
    marginTop: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  buttonText: {
    color: isDarkMode ? colors.black : "#0a0e27",
    fontSize: 12,
    fontWeight: "800",
    flexShrink: 1,
  },
});
