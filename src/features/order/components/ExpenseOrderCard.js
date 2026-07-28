import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { spacing, useStyles } from "../../../theme";
import { AppText, Card, SummaryRows } from "../../../ui";
import { formatBdt, formatDate, paisaToBdt } from "../../../utils/money";

function paymentStatusLabel(paymentStatus, paidPaisa, grandTotalPaisa, t) {
  if (paymentStatus === "PAID") return t("status.paid");
  if (paidPaisa > 0 && paidPaisa < grandTotalPaisa) return t("status.partially_paid");
  return t("status.unpaid");
}

function paymentStatusTone(paymentStatus, paidPaisa, grandTotalPaisa) {
  if (paymentStatus === "PAID") return "success";
  if (paidPaisa > 0 && paidPaisa < grandTotalPaisa) return "warning";
  return "error";
}

// One order row in the expense tracker. Extracted so the screen can virtualise instead of
// holding the whole unpaginated history in a ScrollView.

function ExpenseOrderCard({ order }) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  const paid = Number(order.paidPaisa || 0);
  const due = Number(order.outstandingPaisa || 0);
  const grand = Number(order.grandTotalPaisa);
  const statusTone = paymentStatusTone(order.paymentStatus, paid, grand);
  const statusLabel = paymentStatusLabel(order.paymentStatus, paid, grand, t);

  return (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <AppText variant="bodyStrong">{order.orderNumber}</AppText>
        <AppText variant="caption" tone="secondary">
          {formatDate(order.createdAt, language)}
        </AppText>
      </View>
      <SummaryRows
        rows={[{ label: t("expenseTracker.total"), value: formatBdt(paisaToBdt(grand), language) }]}
      />
      <View style={styles.balanceRow}>
        <View style={styles.balanceItem}>
          <AppText variant="micro" tone="secondary">
            {t("expenseTracker.paid")}
          </AppText>
          <AppText variant="bodySm" tone="success" style={styles.balanceValue}>
            {formatBdt(paisaToBdt(paid), language)}
          </AppText>
        </View>
        <View style={styles.balanceDivider} />
        <View style={styles.balanceItem}>
          <AppText variant="micro" tone="secondary">
            {t("expenseTracker.due")}
          </AppText>
          <AppText variant="bodySm" tone={due > 0 ? "error" : "success"} style={styles.balanceValue}>
            {formatBdt(paisaToBdt(due), language)}
          </AppText>
        </View>
        <View style={styles.balanceDivider} />
        <View style={styles.balanceItem}>
          <AppText variant="label" tone={statusTone}>
            {statusLabel}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

export default memo(ExpenseOrderCard);

const getStyles = (colors) =>
  StyleSheet.create({
    orderCard: {
      marginBottom: spacing.lg - 2,
    },
    orderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm + 2,
    },
    balanceRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: spacing.sm + 2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    balanceItem: {
      flex: 1,
      alignItems: "center",
    },
    balanceDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.border,
    },
    balanceValue: {
      fontWeight: "800",
      marginTop: 3,
    },
  });
