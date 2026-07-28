import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { getLocalizedProduct } from "../../../i18n/product";
import { spacing, useStyles } from "../../../theme";
import { AppText, Card } from "../../../ui";
import { formatBdt } from "../../../utils/money";
import ProductGallery from "./ProductGallery";
import SaleBadge from "./SaleBadge";

export default function ProductSummaryCard({ product }) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const displayProduct = getLocalizedProduct(product, language);

  const galleryImages = useMemo(() => {
    if (product.images?.length) return product.images;
    return product.image ? [{ id: "fallback", imageUrl: product.image, altText: product.name }] : [];
  }, [product.images, product.image, product.name]);

  return (
    <Card style={styles.card} padded={false}>
      <View style={styles.galleryFrame}>
        <ProductGallery productName={displayProduct.name} images={galleryImages} />
      </View>
      <View style={styles.body}>
        <AppText variant="h2">{displayProduct.name}</AppText>
        {displayProduct.description ? (
          <AppText variant="bodySm" tone="secondary" style={styles.description}>
            {displayProduct.description}
          </AppText>
        ) : null}
        {product.discountPercent ? (
          <View style={styles.saleRow}>
            <SaleBadge percent={product.discountPercent} />
            <AppText variant="bodySm" tone="secondary" style={styles.originalPrice}>
              {formatBdt(product.originalPrice, language)}
            </AppText>
          </View>
        ) : null}
        <AppText variant="h3" style={styles.price}>
          {t("catalog.from")} {formatBdt(product.price, language)} {t("catalog.perDozen")}
        </AppText>
        <AppText variant="label" tone="secondary" style={styles.moq}>
          {t("catalog.moq", { count: product.moq })}
        </AppText>
      </View>
    </Card>
  );
}

const getStyles = () =>
  StyleSheet.create({
    card: {
      overflow: "hidden",
      marginBottom: spacing.lg + 2,
    },
    galleryFrame: {
      padding: spacing.sm,
    },
    body: {
      padding: spacing.md,
    },
    description: {
      marginTop: spacing.md,
    },
    saleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm + 1,
      marginTop: spacing.lg - 2,
    },
    originalPrice: {
      textDecorationLine: "line-through",
    },
    price: {
      marginTop: spacing.lg - 2,
    },
    moq: {
      marginTop: spacing.xs + 1,
      fontWeight: "400",
    },
  });
