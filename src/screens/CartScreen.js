import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import ScreenShell from "../components/ScreenShell";
import CartLineItem from "../features/cart/components/CartLineItem";
import CartSummaryPanel from "../features/cart/components/CartSummaryPanel";
import { getCartSubtotal, getDiscountAmount } from "../features/checkout/utils/checkoutPricing";
import { useTheme } from "../theme/ThemeProvider";

export default function CartScreen({
  activeTab,
  onTabPress,
  onProfilePress,
  onSearchPress,
  onCartPress,
  cartItems,
  cartCount,
  onIncreaseCartItem,
  onDecreaseCartItem,
  onRemoveCartItem,
  onClearCart,
  onCheckout,
  error,
  auth,
  festivalCampaign,
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);
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
              {cartItems.map((item) => (
                <CartLineItem
                  key={item.lineId ?? item.id}
                  item={item}
                  onIncrease={() => onIncreaseCartItem?.(item.lineId ?? item.id)}
                  onDecrease={() => onDecreaseCartItem?.(item.lineId ?? item.id)}
                  onRemove={() => onRemoveCartItem?.(item.lineId ?? item.id)}
                />
              ))}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </>
          ) : (
            <Text style={styles.emptyText}>{t("cart.empty")}</Text>
          )}
        </ScrollView>

        <CartSummaryPanel subtotal={subtotal} discount={discount} onCheckout={() => onCheckout?.("")} />
      </View>
    </ScreenShell>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    content: {
      flex: 1,
      justifyContent: "space-between",
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 40,
      fontSize: 16,
    },
    errorText: {
      color: colors.accent,
      textAlign: "center",
      fontSize: 14,
      marginBottom: 16,
    },
  });
