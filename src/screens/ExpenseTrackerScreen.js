import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import { getClientOrders } from "../services/api";
import { useLanguage } from "../i18n/LanguageProvider";
import { getLocalizedError } from "../i18n/errors";
import { formatBdt, formatDate, paisaToBdt } from "../utils/money";
import { radius, spacing, useStyles, useTheme } from "../theme";
import { AppText, AsyncStateView, Button, Card, SummaryRows } from "../ui";

function computeSummary(orders) {
  return orders.reduce(
    (acc, o) => ({
      totalOrders: acc.totalOrders + 1,
      totalPaidPaisa: acc.totalPaidPaisa + (o.paidPaisa || 0),
      totalDuePaisa: acc.totalDuePaisa + (o.outstandingPaisa || 0),
    }),
    { totalOrders: 0, totalPaidPaisa: 0, totalDuePaisa: 0 }
  );
}

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

export default function ExpenseTrackerScreen({ onBack }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await getClientOrders();
      setOrders(response.data || []);
      setStatus("ready");
    } catch (loadError) {
      setError(getLocalizedError(loadError, t, "orders.loadError"));
      setStatus("error");
    }
  }, [t]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const summary = computeSummary(orders);

  return (
    <StackScreenShell title={t("expenseTracker.title")} subtitle={t("expenseTracker.subtitle")} onBack={onBack}>
      <Button
        title={t("common.refresh")}
        onPress={loadOrders}
        variant="secondary"
        size="sm"
        fullWidth={false}
        style={styles.refreshButton}
      />

      <AsyncStateView
        status={status}
        error={error}
        onRetry={loadOrders}
        isEmpty={!orders.length}
        emptyTitle={t("orders.empty")}
      />

      {status === "ready" && orders.length > 0 ? (
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryNeutral]}>
              <AppText variant="h2" style={styles.summaryValue}>
                {summary.totalOrders}
              </AppText>
              <AppText variant="micro" tone="secondary" style={styles.summaryLabel}>
                {t("expenseTracker.totalOrders")}
              </AppText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.success + "22" }]}>
              <AppText variant="h2" tone="success" style={styles.summaryValue}>
                {formatBdt(paisaToBdt(summary.totalPaidPaisa), language)}
              </AppText>
              <AppText variant="micro" tone="success" style={styles.summaryLabel}>
                {t("expenseTracker.totalPaid")}
              </AppText>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.error + "22" }]}>
              <AppText variant="h2" tone="error" style={styles.summaryValue}>
                {formatBdt(paisaToBdt(summary.totalDuePaisa), language)}
              </AppText>
              <AppText variant="micro" tone="error" style={styles.summaryLabel}>
                {t("expenseTracker.totalDue")}
              </AppText>
            </View>
          </View>

          {orders.map((order) => {
            const paid = Number(order.paidPaisa || 0);
            const due = Number(order.outstandingPaisa || 0);
            const grand = Number(order.grandTotalPaisa);
            const statusTone = paymentStatusTone(order.paymentStatus, paid, grand);
            const statusLabel = paymentStatusLabel(order.paymentStatus, paid, grand, t);

            return (
              <Card key={String(order.id)} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <AppText variant="bodyStrong">{order.orderNumber}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {formatDate(order.createdAt, language)}
                  </AppText>
                </View>
                <SummaryRows
                  rows={[
                    { label: t("expenseTracker.total"), value: formatBdt(paisaToBdt(grand), language) },
                  ]}
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
                    <AppText
                      variant="bodySm"
                      tone={due > 0 ? "error" : "success"}
                      style={styles.balanceValue}
                    >
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
          })}

          <Card style={styles.footerSummary}>
            <SummaryRows
              rows={[
                {
                  label: t("expenseTracker.totalPaid"),
                  value: (
                    <AppText variant="h4" tone="success">
                      {formatBdt(paisaToBdt(summary.totalPaidPaisa), language)}
                    </AppText>
                  ),
                },
                {
                  label: t("expenseTracker.totalDue"),
                  value: (
                    <AppText variant="h4" tone="error">
                      {formatBdt(paisaToBdt(summary.totalDuePaisa), language)}
                    </AppText>
                  ),
                },
              ]}
            />
          </Card>
        </>
      ) : null}
    </StackScreenShell>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    refreshButton: {
      alignSelf: "flex-end",
      marginBottom: spacing.md,
    },
    summaryRow: {
      flexDirection: "row",
      gap: spacing.sm + 2,
      marginBottom: spacing.xl,
    },
    summaryCard: {
      flex: 1,
      borderRadius: radius.card,
      padding: spacing.lg - 2,
      alignItems: "center",
    },
    summaryNeutral: {
      backgroundColor: colors.surfaceSoft,
    },
    summaryValue: {
      textAlign: "center",
    },
    summaryLabel: {
      marginTop: spacing.xs,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      textAlign: "center",
    },
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
    footerSummary: {
      marginTop: spacing.xs,
    },
  });
