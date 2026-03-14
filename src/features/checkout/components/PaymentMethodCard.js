import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function PaymentMethodCard({ method, selected, onPress }) {
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
      <Text style={[styles.label, selected && styles.labelSelected]}>{method.label}</Text>
      <Text style={styles.description}>{method.description}</Text>
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
    description: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },
  });
