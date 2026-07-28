import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { getLocalizedProduct } from "../../../i18n/product";
import { spacing, useStyles, useTheme } from "../../../theme";
import { AppText, Card, IconButton } from "../../../ui";
import { formatBdt } from "../../../utils/money";
import AllocationLine from "../../order/components/AllocationLine";
import ProductImage from "../../catalog/components/ProductImage";

export default function CartLineItem({ item, onIncrease, onDecrease, onRemove }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const localizedItem = getLocalizedProduct(item, language);

  return (
    <Card style={styles.cartCard}>
      <ProductImage uri={item.image} accessibilityLabel={localizedItem.name} style={styles.productImage} borderRadius={16} />
      <View style={styles.productInfo}>
        <AppText numberOfLines={2} variant="bodyStrong">
          {localizedItem.name}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {t("cart.packRecipe")}
        </AppText>
        {(item.allocations || []).map((allocation) => (
          <AllocationLine
            key={allocation.productVariantId}
            allocation={allocation}
            colorNames={item.product?.colorNames}
            variant="micro"
          />
        ))}
        {!item.moqSatisfied ? (
          <AppText variant="micro" tone="error" style={styles.warning}>
            {t("cart.moqRemaining", { count: item.moqRemaining })}
          </AppText>
        ) : null}
        {!item.configurationValid ? (
          <AppText variant="micro" tone="error" style={styles.warning}>
            {t("cart.packInvalid")}
          </AppText>
        ) : null}
        {item.discountPercent ? (
          <AppText variant="caption" tone="secondary" style={styles.originalPrice}>
            {formatBdt((item.unitPrice ?? item.price) * item.quantity, language)}
          </AppText>
        ) : null}
        <AppText variant="h3" style={styles.productPrice}>
          {formatBdt((item.discountedUnitPrice ?? item.unitPrice ?? item.price) * item.quantity, language)}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {t("cart.quantityUnit")}
        </AppText>
        <View style={styles.controlsRow}>
          <IconButton
            label={t("cart.decrease", { name: localizedItem.name })}
            onPress={onDecrease}
            disabled={item.quantity <= 1}
            size="lg"
            tone="bordered"
          >
            <Feather name="minus" size={22} color={colors.textSecondary} />
          </IconButton>
          <AppText variant="h3" style={styles.quantityText}>
            {item.quantity}
          </AppText>
          <IconButton
            label={t("cart.increase", { name: localizedItem.name })}
            onPress={onIncrease}
            size="lg"
            tone="brand"
          >
            <Feather name="plus" size={22} color={colors.onBrand} />
          </IconButton>
        </View>
      </View>
      <IconButton
        label={t("cart.removeItem", { name: localizedItem.name })}
        onPress={onRemove}
        tone="plain"
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={26} color={colors.error} />
      </IconButton>
    </Card>
  );
}

const getStyles = () =>
  StyleSheet.create({
    cartCard: {
      padding: spacing.lg - 2,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg - 2,
      marginBottom: spacing.lg + 2,
      position: "relative",
    },
    productImage: {
      width: 82,
      height: 82,
    },
    productInfo: {
      flex: 1,
      paddingRight: spacing.x4 + 2,
    },
    warning: {
      marginTop: spacing.xs,
    },
    originalPrice: {
      textDecorationLine: "line-through",
      marginTop: spacing.xs,
    },
    productPrice: {
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    controlsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg - 2,
      marginTop: spacing.sm,
    },
    quantityText: {
      minWidth: 22,
      textAlign: "center",
    },
    deleteButton: {
      position: "absolute",
      right: spacing.lg,
      top: "50%",
      marginTop: -18,
    },
  });
