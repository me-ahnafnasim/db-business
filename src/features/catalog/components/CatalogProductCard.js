import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { getLocalizedProduct } from "../../../i18n/product";
import { radius, spacing, useStyles } from "../../../theme";
import { AppText } from "../../../ui";
import { formatBdt } from "../../../utils/money";
import { breakAnywhere } from "../../../utils/text";
import ProductImage from "./ProductImage";
import SaleBadge from "./SaleBadge";

// The product tile. The whole card is one button — there is no separate CTA inside it, which
// is why the chevron that used to sit in the bottom-right is gone: it advertised a second
// affordance that never existed.
//
// Three things changed shape here:
//
//   1. The image is full-bleed. It used to sit inside 8dp of padding, which read as a square
//      floating inside a card and cost 16dp of the only thing anyone actually looks at.
//      The card's own `overflow: hidden` clips it to the top corners, so it needs no radius.
//   2. The discount badge moved onto the image. It used to occupy its own row, so a
//      discounted card was 28dp taller than its neighbour and grid rows came out ragged.
//      Card height is now identical either way.
//   3. Image and text share one 12dp inset. The image was inset 8 and the text 12, so their
//      left edges did not line up.
// Narrower than this and the current price plus the struck-through original will not fit on
// one line: at 320dp the card is 134 wide, leaving 110dp of text for a pair that measures
// ~114dp. Wrapping would make discounted cards a line taller than their neighbours — the
// ragged-row problem this redesign exists to remove. The badge on the image already says
// "-20%", so the original price is the part that gives way.
const ORIGINAL_PRICE_MIN_CARD_WIDTH = 150;

function CatalogProductCard({ product, onOpenProduct, cardWidth = 236 }) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const displayProduct = getLocalizedProduct(product, language);
  const showOriginalPrice =
    Boolean(product.discountPercent) && cardWidth >= ORIGINAL_PRICE_MIN_CARD_WIDTH;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t("catalog.viewProduct")}: ${displayProduct.name}`}
      onPress={() => onOpenProduct?.(product)}
      style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.cardPressed]}
    >
      <View style={styles.imageZone}>
        <ProductImage
          uri={product.image}
          accessibilityLabel={t("catalog.imageOf", { current: 1, total: product.images?.length || 1, name: displayProduct.name })}
          // No radius of its own: the card clips it, so the image meets the card's corners
          // exactly instead of tracing a second, smaller curve inside them.
          borderRadius={0}
        />
        {product.discountPercent ? <SaleBadge percent={product.discountPercent} style={styles.badge} /> : null}
      </View>

      <View style={styles.body}>
        {/* The 2-line cap and the reserved height stay — they are what keep every card in a
            row the same height. What changes is that a line now FILLS its width, breaking a
            word mid-way if that is what it takes, instead of pushing the whole word down and
            leaving a ragged hole after e.g. "fashionable". The label keeps the clean name so
            a screen reader is unaffected by the invisible break characters. */}
        <AppText
          numberOfLines={2}
          variant="bodySm"
          style={styles.name}
          accessibilityLabel={displayProduct.name}
        >
          {breakAnywhere(displayProduct.name)}
        </AppText>

        {/* `flexWrap` stays as a safety net for an unusually long figure, but the width gate
            above means it should not fire in normal use — every card in a row keeps the same
            height whether or not the product is discounted. */}
        <View style={styles.priceRow}>
          <AppText numberOfLines={1} variant="bodyStrong">
            {formatBdt(product.price, language)}
          </AppText>
          {showOriginalPrice ? (
            <AppText numberOfLines={1} variant="caption" tone="secondary" style={styles.originalPrice}>
              {formatBdt(product.originalPrice, language)}
            </AppText>
          ) : null}
        </View>

        <AppText numberOfLines={1} variant="micro" tone="secondary" style={styles.moq}>
          {t("catalog.moq", { count: product.moq })}
        </AppText>
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
      // Load-bearing: this is what rounds the full-bleed image's top corners.
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg - 2,
    },
    cardPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.985 }],
    },
    imageZone: {
      // Anchors the absolutely positioned badge.
      position: "relative",
    },
    // Raw offsets on purpose — tokens.js reserves spacing for rhythm and leaves absolute
    // positioning to optical judgement.
    badge: {
      position: "absolute",
      top: 8,
      left: 8,
    },
    body: {
      padding: spacing.md,
    },
    name: {
      // No weight override — the product name reads as plain text, and the price below is
      // what carries the emphasis. It used to be 800, which made every name compete with
      // its own price.
      //
      // Two lines of the locale's own leading, so a one-line and a two-line name produce the
      // same card height and Bangla gets the room it needs rather than an English-sized box.
      minHeight: type.bodySm.lineHeight * 2,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      flexWrap: "wrap",
      gap: spacing.sm - 2,
      marginTop: spacing.sm,
    },
    originalPrice: {
      textDecorationLine: "line-through",
    },
    moq: {
      fontWeight: "400",
      marginTop: spacing.xs,
    },
  });
