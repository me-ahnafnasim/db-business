import Feather from "@expo/vector-icons/Feather";
import { ScrollView, StyleSheet, View } from "react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import ScreenShell from "../components/ScreenShell";
import CartLineItem from "../features/cart/components/CartLineItem";
import CartSummaryPanel from "../features/cart/components/CartSummaryPanel";
import { getCartSubtotal, getDiscountAmount } from "../features/checkout/utils/checkoutPricing";
import { TAB_KEYS } from "../data/tabs";
import { spacing, useStyles, useTheme } from "../theme";
import { AppText, EmptyState } from "../ui";

export default function CartScreen({
  activeTab,
  onTabPress,
  onProfilePress,
  onSearchPress,
  onCartPress,
  cartItems,
  cartCount,
  onEditCartItem,
  onRemoveCartItem,
  onClearCart,
  onCheckout,
  error,
  auth,
  festivalCampaign,
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const subtotal = useMemo(() => getCartSubtotal(cartItems), [cartItems]);
  const discount = useMemo(() => getDiscountAmount(subtotal, festivalCampaign), [festivalCampaign, subtotal]);

  return (
    <ScreenShell
      activeTab={activeTab}
      onTabPress={onTabPress}
      onProfilePress={onProfilePress}
      onSearchPress={onSearchPress}
      onCartPress={onCartPress}
      cartCount={cartCount}
      auth={auth}
      title={t("cart.title")}
      headerActionLabel={cartItems.length ? t("cart.clearAll") : ""}
      onHeaderAction={onClearCart}
      scrollable={false}
    >
      <View style={styles.content}>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator>
          {cartItems.length ? (
            <>
              {/* The handlers are passed through unbound so each row receives stable
                  props and its memo can actually hold; the row binds its own line id. */}
              {cartItems.map((item) => (
                <CartLineItem
                  key={item.lineId ?? item.id}
                  item={item}
                  onEdit={onEditCartItem}
                  onRemove={onRemoveCartItem}
                />
              ))}
              {error ? (
                <AppText variant="bodySm" tone="error" style={styles.errorText}>
                  {error}
                </AppText>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon={<Feather name="shopping-bag" size={64} color={colors.textSecondary} />}
              title={t("cart.emptyTitle")}
              description={t("cart.emptySubtitle")}
              actionLabel={t("cart.browseProducts")}
              onAction={() => onTabPress?.(TAB_KEYS.HOME)}
              style={styles.emptyState}
            />
          )}
        </ScrollView>

        <CartSummaryPanel subtotal={subtotal} discount={discount} onCheckout={() => onCheckout?.("")} />
      </View>
    </ScreenShell>
  );
}

const getStyles = () =>
  StyleSheet.create({
    content: {
      flex: 1,
      justifyContent: "space-between",
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      paddingHorizontal: spacing.gutter,
      paddingBottom: spacing.lg,
    },
    emptyState: {
      paddingTop: spacing.x6 + spacing.x4,
    },
    errorText: {
      textAlign: "center",
      marginBottom: spacing.lg,
    },
  });
