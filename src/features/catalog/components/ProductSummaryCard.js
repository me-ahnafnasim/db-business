import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { getLocalizedProduct } from "../../../i18n/product";
import { useTheme } from "../../../theme/ThemeProvider";
import { formatBdt } from "../../../utils/money";
import ProductGallery from "./ProductGallery";

export default function ProductSummaryCard({ product }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const displayProduct = getLocalizedProduct(product, language);

  const galleryImages = useMemo(() => {
    if (product.images?.length) return product.images;
    return product.image ? [{ id: "fallback", imageUrl: product.image, altText: product.name }] : [];
  }, [product.images, product.image, product.name]);

  return (
    <View style={styles.card}>
      <ProductGallery
        productName={displayProduct.name}
        images={galleryImages}
      />
      <View style={styles.body}>
        <Text style={styles.name}>{displayProduct.name}</Text>
        <Text style={styles.meta}>{product.sku}</Text>
        {displayProduct.description ? <Text style={styles.description}>{displayProduct.description}</Text> : null}
        {product.discountPercent ? <View style={styles.saleRow}><Text style={styles.saleBadge}>{product.discountPercent}% OFF</Text><Text style={styles.originalPrice}>{formatBdt(product.originalPrice, language)}</Text></View> : null}
        <Text style={styles.price}>{t("catalog.from")} {formatBdt(product.price, language)} {t("catalog.perDozen")}</Text>
        <Text style={styles.moq}>{t("catalog.moq", { count: product.moq })}</Text>
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    padding: 8,
  },
  body: {
    padding: 12,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 23,
    lineHeight: 31,
    fontWeight: "800",
    marginBottom: 4,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  price: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 14,
  },
  saleRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 14 },
  saleBadge: { color: "#0a0e27", backgroundColor: "#f4ca55", borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, fontWeight: "900" },
  originalPrice: { color: colors.textSecondary, fontSize: 14, textDecorationLine: "line-through" },
  moq: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 5,
  },
});
