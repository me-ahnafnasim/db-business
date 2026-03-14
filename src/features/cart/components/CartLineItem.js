import { Feather, Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function CartLineItem({ item, onIncrease, onDecrease, onRemove }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.cartCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text numberOfLines={2} style={styles.productName}>
          {item.name}
        </Text>
        <Text style={styles.productMeta}>
          {item.selectedColor ? `Color: ${item.selectedColor}` : ""}
          {item.selectedColor && item.selectedSize ? "  •  " : ""}
          {item.selectedSize ? `Size: ${item.selectedSize}` : ""}
        </Text>
        {item.hasCustomLogo ? (
          <Text style={styles.productMeta}>Logo: {item.logoFileName || "Attached"}</Text>
        ) : null}
        <Text style={styles.productPrice}>${((item.unitPrice ?? item.price) * item.quantity).toFixed(2)}</Text>
        <View style={styles.controlsRow}>
          <Pressable
            style={[styles.qtyButton, item.quantity <= item.moq && styles.qtyButtonDisabled]}
            onPress={onDecrease}
          >
            <Feather name="minus" size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <Pressable style={styles.qtyButtonActive} onPress={onIncrease}>
            <Feather name="plus" size={22} color={colors.black} />
          </Pressable>
        </View>
      </View>
      <Pressable style={styles.deleteButton} onPress={onRemove}>
        <Ionicons name="trash-outline" size={28} color={colors.accent} />
      </Pressable>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
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
    productMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    productPrice: {
      color: colors.textPrimary,
      fontSize: 19,
      fontWeight: "800",
      marginBottom: 12,
      marginTop: 4,
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
  });
