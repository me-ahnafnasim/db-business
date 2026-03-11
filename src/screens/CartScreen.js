import { Feather, Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";

import ScreenShell from "../components/ScreenShell";
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
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const subtotal = useMemo(
    () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartItems]
  );
  const discount = appliedCoupon === "SAVE10" ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

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
      title="My Cart"
      headerActionLabel={cartItems.length ? "Clear All" : ""}
      onHeaderAction={onClearCart}
      scrollable={false}
    >
      <View style={styles.content}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator
        >
          {cartItems.length ? (
            <>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.cartCard}>
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                  <View style={styles.productInfo}>
                    <Text numberOfLines={2} style={styles.productName}>
                      {item.name}
                    </Text>
                    <Text style={styles.productPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                    <View style={styles.controlsRow}>
                      <Pressable
                        style={[styles.qtyButton, item.quantity <= item.moq && styles.qtyButtonDisabled]}
                        onPress={() => onDecreaseCartItem?.(item.id)}
                      >
                        <Feather name="minus" size={22} color={colors.textSecondary} />
                      </Pressable>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <Pressable style={styles.qtyButtonActive} onPress={() => onIncreaseCartItem?.(item.id)}>
                        <Feather name="plus" size={22} color={colors.black} />
                      </Pressable>
                    </View>
                  </View>
                  <Pressable style={styles.deleteButton} onPress={() => onRemoveCartItem?.(item.id)}>
                    <Ionicons name="trash-outline" size={28} color={colors.accent} />
                  </Pressable>
                </View>
              ))}

              <View style={styles.couponCard}>
                <View style={styles.couponHeader}>
                  <Feather name="tag" size={24} color={colors.textPrimary} />
                  <Text style={styles.couponTitle}>Coupon Code</Text>
                </View>
                <View style={styles.couponRow}>
                  <TextInput
                    placeholder="Enter coupon code"
                    placeholderTextColor={colors.textSecondary}
                    value={couponCode}
                    onChangeText={setCouponCode}
                    style={styles.couponInput}
                  />
                  <Pressable style={styles.applyButton} onPress={handleApplyCoupon}>
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>Your cart is empty.</Text>
          )}
        </ScrollView>

        <View style={styles.summaryPanel}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          {discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>-${discount.toFixed(2)}</Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
          <Pressable style={styles.checkoutButton}>
            <Text style={styles.checkoutText}>Checkout</Text>
            <Feather name="arrow-right" size={28} color={colors.black} />
          </Pressable>
        </View>
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
    cartCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 28,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 18,
      position: "relative",
      shadowColor: colors.black,
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    productImage: {
      width: 96,
      height: 96,
      borderRadius: 22,
      backgroundColor: colors.surfaceSoft,
    },
    productInfo: {
      flex: 1,
      paddingRight: 44,
    },
    productName: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 24,
      marginBottom: 6,
    },
    productPrice: {
      color: colors.textPrimary,
      fontSize: 19,
      fontWeight: "800",
      marginBottom: 12,
    },
    controlsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    qtyButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSoft,
    },
    qtyButtonDisabled: {
      opacity: 0.45,
    },
    qtyButtonActive: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.white,
    },
    quantityText: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
      minWidth: 22,
      textAlign: "center",
    },
    deleteButton: {
      position: "absolute",
      right: 16,
      top: "50%",
      marginTop: -18,
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    couponCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 28,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.black,
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
    couponHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
    },
    couponTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    couponRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    couponInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      borderRadius: 24,
      paddingHorizontal: 18,
      paddingVertical: 14,
      color: colors.textPrimary,
      fontSize: 17,
    },
    applyButton: {
      minWidth: 104,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: colors.white,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    applyButtonText: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    summaryPanel: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 14,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    totalLabel: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },
    totalValue: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "800",
    },
    checkoutButton: {
      marginTop: 10,
      backgroundColor: colors.white,
      borderRadius: 26,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    checkoutText: {
      color: colors.black,
      fontSize: 14,
      fontWeight: "700",
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 40,
      fontSize: 16,
    },
  });
