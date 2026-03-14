import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function CartCouponCard({
  couponCode,
  onCouponChange,
  onApplyCoupon,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
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
          onChangeText={onCouponChange}
          style={styles.couponInput}
        />
        <Pressable style={styles.applyButton} onPress={onApplyCoupon}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
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
  });
