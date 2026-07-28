import Feather from "@expo/vector-icons/Feather";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { getLocalizedProduct } from "../../../i18n/product";
import { radius, spacing, useStyles, useTheme } from "../../../theme";
import { AppText } from "../../../ui";
import { formatBdt } from "../../../utils/money";
import ProductImage from "./ProductImage";
import SaleBadge from "./SaleBadge";

function CatalogProductCard({ product, onOpenProduct, cardWidth = 236 }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
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
          borderRadius={radius.md}
        />
      </View>
      <View style={styles.body}>
        <AppText numberOfLines={2} variant="bodySm" style={styles.name}>
          {displayProduct.name}
        </AppText>
        {product.discountPercent ? (
          <View style={styles.saleRow}>
            <SaleBadge percent={product.discountPercent} />
            <AppText variant="caption" tone="secondary" style={styles.originalPrice}>
              {formatBdt(product.originalPrice, language)}
            </AppText>
          </View>
        ) : null}
        <AppText variant="bodyStrong" style={styles.price}>
          {t("catalog.from")} {formatBdt(product.price, language)}
        </AppText>
        <View style={styles.moqRow}>
          <AppText numberOfLines={1} variant="micro" tone="secondary" style={styles.moq}>
            {t("catalog.moq", { count: product.moq })}
          </AppText>
          <Feather name="chevron-right" size={14} color={colors.textSecondary} />
        </View>
      </View>
    </Pressable>
  );
}

export default memo(CatalogProductCard);

const getStyles = (colors, type) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg - 2,
    },
    cardPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.985 }],
    },
    imageFrame: {
      padding: spacing.sm,
    },
    body: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    name: {
      fontWeight: "800",
      // Two lines of the locale's own leading, so Bangla is given the room it needs
      // instead of being squeezed into an English-sized box.
      minHeight: type.bodySm.lineHeight * 2,
    },
    price: {
      marginTop: spacing.sm,
    },
    saleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm - 1,
      marginTop: spacing.sm - 1,
    },
    originalPrice: {
      textDecorationLine: "line-through",
    },
    moqRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.xs - 1,
    },
    moq: {
      fontWeight: "400",
      flex: 1,
    },
  });
