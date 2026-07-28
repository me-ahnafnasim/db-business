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

function OrderHistoryCard({ order, busy, onCancel }) {
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
      {workflowStatus === "PENDING" ? (
        <Button
          title={busy ? t("orders.cancelling") : t("orders.cancel")}
          onPress={() => onCancel?.(order.id)}
          variant="dangerOutline"
          size="sm"
          loading={busy}
          style={styles.cancelButton}
        />
      ) : null}
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
    cancelButton: {
      marginTop: spacing.lg - 2,
    },
  });
