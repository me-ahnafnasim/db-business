import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { spacing, useStyles } from "../../../theme";
import { AppText, Button, Card } from "../../../ui";
import { formatBdt, formatDate, paisaToBdt } from "../../../utils/money";
import AllocationLine from "./AllocationLine";

// One order in the history list.
//
// Extracted out of OrdersScreen so the list can virtualise. The screen previously
// rendered every order through a ScrollView + three nested .map() calls, so an account
// with fifty orders mounted a four-figure number of text nodes at once.

function OrderHistoryCard({ order, busy, onCancel, onContactSupport }) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const workflowStatus = order.workflowStatus || order.status;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <AppText variant="bodyStrong" style={styles.orderNumber}>
          {order.orderNumber}
        </AppText>
        <AppText variant="caption" tone="brand" style={styles.status}>
          {t(`status.${String(workflowStatus).toLowerCase()}`)}
        </AppText>
      </View>
      <AppText variant="label" tone="secondary" style={styles.meta}>
        {formatDate(order.createdAt, language)} · {t("orders.lines", { count: order.items?.length || 0 })}
      </AppText>
      {(order.items || []).map((item) => (
        <View key={String(item.id)} style={styles.pack}>
          <AppText variant="caption" style={styles.packTitle}>
            {item.productName} · {item.quantityDozen} {t("catalog.perDozen")}
          </AppText>
          {(item.allocations || []).map((allocation) => (
            <AllocationLine
              key={String(allocation.productVariantId)}
              allocation={allocation}
              colorNames={item.colorNames}
              variant="label"
            />
          ))}
        </View>
      ))}
      <AppText variant="h3" style={styles.total}>
        {formatBdt(paisaToBdt(order.grandTotalPaisa), language)}
      </AppText>
      <View style={styles.actions}>
        {workflowStatus === "PENDING" ? (
          <Button
            title={busy ? t("orders.cancelling") : t("orders.cancel")}
            onPress={() => onCancel?.(order.id)}
            variant="dangerOutline"
            size="sm"
            fullWidth={false}
            loading={busy}
          />
        ) : null}
        {/* Opens WhatsApp with the order number already in the message. There is no
            complaint feature — WhatsApp is the whole channel — and the generic message
            carried no context, so staff had to ask which order every time. */}
        {onContactSupport ? (
          <Button
            title={t("orders.reportProblem")}
            onPress={() => onContactSupport({ orderNumber: order.orderNumber })}
            variant="secondary"
            size="sm"
            fullWidth={false}
          />
        ) : null}
      </View>
    </Card>
  );
}

export default memo(OrderHistoryCard);

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      marginBottom: spacing.lg - 2,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.md,
    },
    orderNumber: {
      flex: 1,
    },
    status: {
      fontWeight: "800",
    },
    meta: {
      marginTop: spacing.sm,
      fontWeight: "400",
    },
    pack: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
      marginTop: spacing.sm,
    },
    packTitle: {
      fontWeight: "700",
    },
    total: {
      marginTop: spacing.sm + 2,
    },
    // Wraps rather than squeezing: the Bangla labels are long, and at 320dp both buttons on
    // one row would clip.
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.lg - 2,
    },
  });
