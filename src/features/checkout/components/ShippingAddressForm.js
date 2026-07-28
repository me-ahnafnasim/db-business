import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing, useStyles } from "../../../theme";
import { AppText, Card, FormField, Input } from "../../../ui";

export default function ShippingAddressForm({ value, onChange, phoneInvalid }) {
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  // Focus chain: the return key advances to the next field instead of dismissing the
  // keyboard, so a six-field address can be filled without reaching back to the screen.
  const phoneRef = useRef(null);
  const divisionRef = useRef(null);
  const districtRef = useRef(null);
  const thanaRef = useRef(null);
  const shopRef = useRef(null);

  const updateField = (field, fieldValue) => {
    onChange?.({
      ...value,
      [field]: fieldValue,
    });
  };

  return (
    <Card style={styles.card}>
      <AppText variant="h4" style={styles.title}>
        {t("checkout.addressTitle")}
      </AppText>
      <FormField>
        <Input
          value={value.customerName}
          onChangeText={(text) => updateField("customerName", text)}
          placeholder={t("checkout.customerName")}
          autoComplete="name"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => phoneRef.current?.focus()}
        />
      </FormField>
      <FormField error={phoneInvalid ? t("checkout.phoneInvalid") : null}>
        <Input
          ref={phoneRef}
          value={value.phone}
          onChangeText={(text) => updateField("phone", text)}
          placeholder={t("checkout.phone")}
          keyboardType="phone-pad"
          autoComplete="tel"
          returnKeyType="next"
          blurOnSubmit={false}
          error={phoneInvalid}
          onSubmitEditing={() => divisionRef.current?.focus()}
        />
      </FormField>
      <FormField>
        <Input
          ref={divisionRef}
          value={value.division}
          onChangeText={(text) => updateField("division", text)}
          placeholder={t("checkout.division")}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => districtRef.current?.focus()}
        />
      </FormField>
      <View style={styles.row}>
        <FormField style={styles.half}>
          <Input
            ref={districtRef}
            value={value.district}
            onChangeText={(text) => updateField("district", text)}
            placeholder={t("checkout.district")}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => thanaRef.current?.focus()}
          />
        </FormField>
        <FormField style={styles.half}>
          <Input
            ref={thanaRef}
            value={value.thana}
            onChangeText={(text) => updateField("thana", text)}
            placeholder={t("checkout.thana")}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => shopRef.current?.focus()}
          />
        </FormField>
      </View>
      <FormField style={styles.last}>
        <Input
          ref={shopRef}
          value={value.shopName}
          onChangeText={(text) => updateField("shopName", text)}
          placeholder={t("checkout.shopName")}
          returnKeyType="done"
        />
      </FormField>
    </Card>
  );
}

const getStyles = () =>
  StyleSheet.create({
    card: {
      marginTop: spacing.sm,
    },
    title: {
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    half: {
      flex: 1,
    },
    last: {
      marginBottom: 0,
    },
  });
