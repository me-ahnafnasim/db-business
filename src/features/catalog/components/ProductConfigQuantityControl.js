import Feather from "@expo/vector-icons/Feather";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing, useStyles, useTheme } from "../../../theme";
import { AppText, IconButton, Input } from "../../../ui";

export default function ProductConfigQuantityControl({ quantity, moq, onChange }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  return (
    <View style={styles.section}>
      <AppText variant="bodyStrong" style={styles.title}>
        {t("catalog.quantity")}
      </AppText>
      <View style={styles.row}>
        <IconButton
          label={t("cart.decrease", { name: t("catalog.quantity") })}
          onPress={() => onChange?.(String(Math.max(1, quantity - 1)))}
          size="lg"
          tone="bordered"
        >
          <Feather name="minus" size={18} color={colors.textPrimary} />
        </IconButton>
        <Input
          value={String(quantity)}
          onChangeText={(value) => onChange?.(value.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          accessibilityLabel={t("catalog.quantity")}
          style={styles.input}
        />
        <IconButton
          label={t("cart.increase", { name: t("catalog.quantity") })}
          onPress={() => onChange?.(String(quantity + 1))}
          size="lg"
          tone="bordered"
        >
          <Feather name="plus" size={18} color={colors.textPrimary} />
        </IconButton>
      </View>
      <AppText variant="caption" tone="secondary" style={styles.helper}>
        {t("catalog.repeatPackHelp", { count: moq })}
      </AppText>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    section: {
      marginBottom: spacing.lg - 2,
    },
    title: {
      marginBottom: spacing.sm + 2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm + 2,
    },
    input: {
      flex: 1,
      textAlign: "center",
      fontWeight: "700",
    },
    helper: {
      marginTop: spacing.sm,
    },
  });
