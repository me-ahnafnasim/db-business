import { StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ShippingAddressForm({ value, onChange }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const updateField = (field, fieldValue) => {
    onChange?.({
      ...value,
      [field]: fieldValue,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Shipping Address</Text>
      <TextInput
        value={value.fullName}
        onChangeText={(text) => updateField("fullName", text)}
        placeholder="Full name"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />
      <TextInput
        value={value.phone}
        onChangeText={(text) => updateField("phone", text)}
        placeholder="Phone number"
        placeholderTextColor={colors.textSecondary}
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        value={value.addressLine}
        onChangeText={(text) => updateField("addressLine", text)}
        placeholder="Address line"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />
      <View style={styles.row}>
        <TextInput
          value={value.city}
          onChangeText={(text) => updateField("city", text)}
          placeholder="City"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.halfInput]}
        />
        <TextInput
          value={value.postalCode}
          onChangeText={(text) => updateField("postalCode", text)}
          placeholder="Postal code"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.halfInput]}
        />
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginTop: 8,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 14,
    },
    input: {
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      color: colors.textPrimary,
      paddingHorizontal: 14,
      fontSize: 15,
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    halfInput: {
      flex: 1,
      marginBottom: 0,
    },
  });
