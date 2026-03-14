import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProductConfigQuantityControl({ quantity, moq, onChange }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Quantity</Text>
      <View style={styles.row}>
        <Pressable style={styles.stepButton} onPress={() => onChange?.(String(Math.max(1, quantity - 1)))}>
          <Feather name="minus" size={18} color={colors.textPrimary} />
        </Pressable>
        <TextInput
          value={String(quantity)}
          onChangeText={(value) => onChange?.(value.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          style={styles.input}
        />
        <Pressable style={styles.stepButton} onPress={() => onChange?.(String(quantity + 1))}>
          <Feather name="plus" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>
      <Text style={styles.helper}>Minimum order quantity: {moq}</Text>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    section: {
      marginBottom: 14,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    stepButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSoft,
    },
    input: {
      flex: 1,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      color: colors.textPrimary,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "700",
    },
    helper: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 8,
    },
  });
