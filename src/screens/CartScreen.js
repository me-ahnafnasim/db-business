import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";

import ScreenShell from "../components/ScreenShell";
import CartCouponCard from "../features/cart/components/CartCouponCard";
import CartLineItem from "../features/cart/components/CartLineItem";
import CartSummaryPanel from "../features/cart/components/CartSummaryPanel";
import { getCartSubtotal } from "../features/checkout/utils/checkoutPricing";
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
  auth,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const subtotal = useMemo(() => getCartSubtotal(cartItems), [cartItems]);
  const discount = appliedCoupon === "SAVE10" ? subtotal * 0.1 : 0;

  const handleApplyCoupon = () => {
    setAppliedCoupon(couponCode.trim().toUpperCase());
  };

  return (
    <ScreenShell
      activeTab={activeTab}
      onTabPress={onTabPress}
      onProfilePress={onProfilePress}
      onSearchPress={onSearchPress}
      onCartPress={onCartPress}
      cartCount={cartCount}
      auth={auth}
      title="My Cart"
      headerActionLabel={cartItems.length ? "Clear All" : ""}
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
              <CartCouponCard
                couponCode={couponCode}
                onCouponChange={setCouponCode}
                onApplyCoupon={handleApplyCoupon}
              />
            </>
          ) : (
            <Text style={styles.emptyText}>Your cart is empty.</Text>
          )}
        </ScrollView>

        <CartSummaryPanel subtotal={subtotal} discount={discount} onCheckout={() => onCheckout?.(appliedCoupon)} />
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
  });
