import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ShippingOptionCard({ option, selected, onPress }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View>
        <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
        <Text style={styles.meta}>{option.eta}</Text>
      </View>
      <Text style={[styles.price, selected && styles.labelSelected]}>${option.price.toFixed(2)}</Text>
    </Pressable>
  );
}

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    cardSelected: {
      borderColor: isDarkMode ? colors.white : colors.tabActive,
      backgroundColor: isDarkMode ? colors.surfaceSoft : colors.tabActiveBackground,
    },
    cardPressed: {
      opacity: 0.9,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 4,
    },
    labelSelected: {
      color: isDarkMode ? colors.white : colors.tabActive,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    price: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
