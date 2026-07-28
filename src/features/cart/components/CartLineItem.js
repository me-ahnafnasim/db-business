import { memo } from "react";

import Feather from "@expo/vector-icons/Feather";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { getLocalizedProduct } from "../../../i18n/product";
import { spacing, useStyles, useTheme } from "../../../theme";
import { AppText, Button, Card, IconButton } from "../../../ui";
import { formatBdt } from "../../../utils/money";
import AllocationLine from "../../order/components/AllocationLine";
import ProductImage from "../../catalog/components/ProductImage";

// Three zones rather than one squeezed column:
//
//   identity   image + name + price, side by side
//   pack       the allocation breakdown, across the FULL card width
//   actions    quantity, Edit and Delete, below a rule
//
// The old layout stacked all of it beside the image, leaving ~122dp on a 360dp phone for
// lines like "Red · Size 39 · 6 pairs" plus a 20px price. Moving the breakdown below the
// image roughly doubles the room, and the edit control becomes a real labelled button
// instead of a 14px glyph with no touch target.
function CartLineItem({ item, onEdit, onRemove }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const localizedItem = getLocalizedProduct(item, language);
  const lineId = item.lineId ?? item.id;
  const hasWarning = !item.moqSatisfied || !item.configurationValid;

  return (
    <Card style={styles.card} padded={false}>
      <View style={styles.identity}>
        <ProductImage
          uri={item.image}
          accessibilityLabel={localizedItem.name}
          style={styles.productImage}
          borderRadius={12}
        />
        <View style={styles.summary}>
          <AppText numberOfLines={2} variant="bodyStrong">
            {localizedItem.name}
          </AppText>
          {item.discountPercent ? (
            <AppText variant="caption" tone="secondary" style={styles.originalPrice}>
              {formatBdt((item.unitPrice ?? item.price) * item.quantity, language)}
            </AppText>
          ) : null}
          <AppText variant="h3" style={styles.price}>
            {formatBdt((item.discountedUnitPrice ?? item.unitPrice ?? item.price) * item.quantity, language)}
          </AppText>
        </View>
      </View>

      <View style={styles.pack}>
        <AppText variant="caption" tone="secondary">
          {t("cart.packRecipe")}
        </AppText>
        {(item.allocations || []).map((allocation) => (
          <AllocationLine
            key={allocation.productVariantId}
            allocation={allocation}
            colorNames={item.colorNames}
            variant="caption"
          />
        ))}
      </View>

      {hasWarning ? (
        <View style={styles.warnings}>
          {!item.moqSatisfied ? (
            <AppText variant="micro" tone="error">
              {t("cart.moqRemaining", { count: item.moqRemaining })}
            </AppText>
          ) : null}
          {!item.configurationValid ? (
            <AppText variant="micro" tone="error">
              {t("cart.packInvalid")}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppText variant="bodySm" tone="secondary" style={styles.quantity} numberOfLines={1}>
          {t("cart.quantityDozen", { count: item.quantity })}
        </AppText>
        <Button
          title={t("common.edit")}
          onPress={() => onEdit?.(lineId)}
          variant="secondary"
          size="sm"
          fullWidth={false}
          accessibilityLabel={t("cart.editItem", { name: localizedItem.name })}
          leftIcon={<Feather name="edit-2" size={14} color={colors.textPrimary} />}
        />
        <IconButton
          label={t("cart.removeItem", { name: localizedItem.name })}
          onPress={() => onRemove?.(lineId)}
          tone="bordered"
        >
          <Feather name="trash-2" size={18} color={colors.error} />
        </IconButton>
      </View>
    </Card>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      marginBottom: spacing.lg,
      overflow: "hidden",
    },
    identity: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
    },
    productImage: {
      width: 72,
      height: 72,
    },
    summary: {
      flex: 1,
    },
    originalPrice: {
      textDecorationLine: "line-through",
      marginTop: spacing.xs,
    },
    price: {
      marginTop: spacing.xs,
    },
    // Full card width, so a "colour · size · pairs" line has room to sit on one line.
    pack: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: 2,
    },
    warnings: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.xs,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surfaceSoft,
    },
    quantity: {
      flex: 1,
    },
  });

export default memo(CartLineItem);
