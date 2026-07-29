import Feather from "@expo/vector-icons/Feather";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { spacing, useStyles, useTheme } from "../../../theme";
import { AppText, Button, SummaryRows } from "../../../ui";
import { formatBdt } from "../../../utils/money";

// `blockedReason` is a translated sentence, or empty when the cart is good to go.
//
// The pack and MOQ rules used to be checked only at place-order, three screens later — a buyer
// picked a courier and a payment method before being told a line in the cart was wrong. The
// checks still run there as a backstop for a cart that went stale in the meantime, but the
// button is the right place to say it first.
export default function CartSummaryPanel({ subtotal, discount, onCheckout, blockedReason = "" }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const total = subtotal - discount;
  const disabled = subtotal <= 0 || Boolean(blockedReason);

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
      {blockedReason ? (
        <AppText variant="caption" tone="error" style={styles.blockedReason}>
          {blockedReason}
        </AppText>
      ) : null}
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
    blockedReason: {
      marginTop: spacing.sm,
    },
  });
