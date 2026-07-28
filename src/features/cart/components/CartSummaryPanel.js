import Feather from "@expo/vector-icons/Feather";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { spacing, useStyles, useTheme } from "../../../theme";
import { Button, SummaryRows } from "../../../ui";
import { formatBdt } from "../../../utils/money";

export default function CartSummaryPanel({ subtotal, discount, onCheckout }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const total = subtotal - discount;
  const disabled = subtotal <= 0;

  const rows = [{ label: t("cart.subtotal"), value: formatBdt(subtotal, language) }];
  if (discount > 0) {
    rows.push({ label: t("cart.discount"), value: `-${formatBdt(discount, language)}` });
  }

  return (
    <View style={styles.summaryPanel}>
      <SummaryRows
        rows={rows}
        total={{ label: t("cart.total"), value: formatBdt(total, language) }}
        emphasis="lg"
      />
      <Button
        title={t("cart.checkout")}
        onPress={onCheckout}
        disabled={disabled}
        style={styles.checkoutButton}
        rightIcon={<Feather name="arrow-right" size={20} color={colors.onBrand} />}
      />
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    summaryPanel: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    checkoutButton: {
      marginTop: spacing.sm,
    },
  });
