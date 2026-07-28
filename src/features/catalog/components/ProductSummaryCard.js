import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { getLocalizedProduct } from "../../../i18n/product";
import { hitSlop, spacing, useStyles } from "../../../theme";
import { AppText, Card } from "../../../ui";
import { formatBdt } from "../../../utils/money";
import ProductGallery from "./ProductGallery";
import SaleBadge from "./SaleBadge";

export default function ProductSummaryCard({ product, onContactSupport }) {
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
        {/* Sits directly under the name because this is the screen a buyer is on when they
            decide to ask a question. Not on the grid card — equal card heights across the
            grid are load-bearing there. */}
        {product.productCode ? (
          <View style={styles.codeRow}>
            <AppText variant="micro" tone="muted" style={styles.productCode}>
              {t("catalog.productCode", { code: product.productCode })}
            </AppText>
            {/* Opens WhatsApp with the code and name already in the message, so the buyer
                never has to read or retype an identifier. WhatsApp is the only support
                channel there is — no complaint feature exists. */}
            {onContactSupport ? (
              <Pressable
                onPress={onContactSupport}
                hitSlop={hitSlop.md}
                accessibilityRole="button"
                accessibilityLabel={t("catalog.askAboutProduct")}
              >
                <AppText variant="micro" tone="brand" style={styles.askLink}>
                  {t("catalog.askAboutProduct")}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
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
    codeRow: {
      flexDirection: "row",
      alignItems: "center",
      // Wraps rather than squeezing the link off-screen when the Bangla label is long.
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    productCode: {
      fontWeight: "400",
      letterSpacing: 0.4,
    },
    askLink: {
      fontWeight: "700",
      textDecorationLine: "underline",
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
