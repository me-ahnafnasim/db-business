import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ShippingAddressForm({ value, onChange, phoneInvalid }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  const updateField = (field, fieldValue) => {
    onChange?.({
      ...value,
      [field]: fieldValue,
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("checkout.addressTitle")}</Text>
      <TextInput
        value={value.customerName}
        onChangeText={(text) => updateField("customerName", text)}
        placeholder={t("checkout.customerName")}
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />
      <TextInput
        value={value.phone}
        onChangeText={(text) => updateField("phone", text)}
        placeholder={t("checkout.phone")}
        placeholderTextColor={colors.textSecondary}
        keyboardType="phone-pad"
        style={[styles.input, phoneInvalid && styles.inputError]}
      />
      {phoneInvalid ? <Text style={styles.errorText}>{t("checkout.phoneInvalid")}</Text> : null}
      <TextInput
        value={value.division}
        onChangeText={(text) => updateField("division", text)}
        placeholder={t("checkout.division")}
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />
      <View style={styles.row}>
        <TextInput
          value={value.district}
          onChangeText={(text) => updateField("district", text)}
          placeholder={t("checkout.district")}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.halfInput]}
        />
        <TextInput
          value={value.thana}
          onChangeText={(text) => updateField("thana", text)}
          placeholder={t("checkout.thana")}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.halfInput]}
        />
      </View>
      <TextInput
        value={value.shopName}
        onChangeText={(text) => updateField("shopName", text)}
        placeholder={t("checkout.shopName")}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, styles.lastInput]}
      />
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
    lastInput: { marginTop: 12, marginBottom: 0 },
    inputError: {
      borderColor: "#ef4444",
    },
    errorText: {
      color: "#ef4444",
      fontSize: 12,
      fontWeight: "600",
      marginTop: -6,
      marginBottom: 10,
    },
  });
