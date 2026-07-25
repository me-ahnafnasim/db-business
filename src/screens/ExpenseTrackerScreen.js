import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import { getClientOrders } from "../services/api";
import { useLanguage } from "../i18n/LanguageProvider";
import { getLocalizedError } from "../i18n/errors";
import { formatBdt, formatDate, paisaToBdt } from "../utils/money";
import { useTheme } from "../theme/ThemeProvider";

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

function paymentStatusColor(paymentStatus, paidPaisa, grandTotalPaisa, colors) {
  if (paymentStatus === "PAID") return colors.success;
  if (paidPaisa > 0 && paidPaisa < grandTotalPaisa) return colors.warning;
  return colors.accent;
}

export default function ExpenseTrackerScreen({ onBack }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors);
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
      <Pressable style={styles.refreshButton} onPress={loadOrders} accessibilityRole="button">
        <Text style={styles.refreshText}>{t("common.refresh")}</Text>
      </Pressable>

      {status === "loading" ? <ActivityIndicator size="large" color={colors.tabActive} /> : null}
      {status === "error" ? (
        <View style={styles.messageCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadOrders}>
            <Text style={styles.retryText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : null}

      {status === "ready" && !orders.length ? (
        <View style={styles.messageCard}>
          <Text style={styles.emptyText}>{t("orders.empty")}</Text>
        </View>
      ) : null}

      {status === "ready" && orders.length > 0 ? (
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: colors.surfaceSoft }]}>
              <Text style={styles.summaryValue}>{summary.totalOrders}</Text>
              <Text style={styles.summaryLabel}>{t("expenseTracker.totalOrders")}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: "#dcfce7" }]}>
              <Text style={[styles.summaryValue, { color: "#166534" }]}>
                {formatBdt(paisaToBdt(summary.totalPaidPaisa), language)}
              </Text>
              <Text style={[styles.summaryLabel, { color: "#166534" }]}>{t("expenseTracker.totalPaid")}</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: "#fee2e2" }]}>
              <Text style={[styles.summaryValue, { color: "#991b1b" }]}>
                {formatBdt(paisaToBdt(summary.totalDuePaisa), language)}
              </Text>
              <Text style={[styles.summaryLabel, { color: "#991b1b" }]}>{t("expenseTracker.totalDue")}</Text>
            </View>
          </View>

          {orders.map((order) => {
            const paid = Number(order.paidPaisa || 0);
            const due = Number(order.outstandingPaisa || 0);
            const grand = Number(order.grandTotalPaisa);
            const statusColor = paymentStatusColor(order.paymentStatus, paid, grand, colors);
            const statusLabel = paymentStatusLabel(order.paymentStatus, paid, grand, t);

            return (
              <View key={String(order.id)} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.createdAt, language)}</Text>
                </View>
                <View style={styles.orderRow}>
                  <Text style={styles.totalLabel}>{t("expenseTracker.total")}</Text>
                  <Text style={styles.totalValue}>{formatBdt(paisaToBdt(grand), language)}</Text>
                </View>
                <View style={styles.balanceRow}>
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>{t("expenseTracker.paid")}</Text>
                    <Text style={[styles.balanceValue, { color: "#166534" }]}>
                      {formatBdt(paisaToBdt(paid), language)}
                    </Text>
                  </View>
                  <View style={styles.balanceDivider} />
                  <View style={styles.balanceItem}>
                    <Text style={styles.balanceLabel}>{t("expenseTracker.due")}</Text>
                    <Text style={[styles.balanceValue, { color: due > 0 ? "#991b1b" : "#166534" }]}>
                      {formatBdt(paisaToBdt(due), language)}
                    </Text>
                  </View>
                  <View style={styles.balanceDivider} />
                  <View style={styles.balanceItem}>
                    <Text style={[styles.balanceStatus, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={styles.footerSummary}>
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>{t("expenseTracker.totalPaid")}</Text>
              <Text style={[styles.footerValue, { color: "#166534" }]}>
                {formatBdt(paisaToBdt(summary.totalPaidPaisa), language)}
              </Text>
            </View>
            <View style={styles.footerDivider} />
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>{t("expenseTracker.totalDue")}</Text>
              <Text style={[styles.footerValue, { color: "#991b1b" }]}>
                {formatBdt(paisaToBdt(summary.totalDuePaisa), language)}
              </Text>
            </View>
          </View>
        </>
      ) : null}
    </StackScreenShell>
  );
}

const getStyles = (colors) => StyleSheet.create({
  refreshButton: { alignSelf: "flex-end", minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surfaceSoft, marginBottom: 12 },
  refreshText: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 20, padding: 14, alignItems: "center" },
  summaryValue: { color: colors.textPrimary, fontSize: 22, fontWeight: "900" },
  summaryLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  orderCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  orderNumber: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
  orderDate: { color: colors.textSecondary, fontSize: 12 },
  orderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  totalLabel: { color: colors.textSecondary, fontSize: 14 },
  totalValue: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  balanceRow: { flexDirection: "row", alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  balanceItem: { flex: 1, alignItems: "center" },
  balanceDivider: { width: 1, height: 28, backgroundColor: colors.border },
  balanceLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "600" },
  balanceValue: { fontSize: 14, fontWeight: "800", marginTop: 3 },
  balanceStatus: { fontSize: 13, fontWeight: "700" },
  footerSummary: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 4 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  footerDivider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  footerLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: "600" },
  footerValue: { fontSize: 18, fontWeight: "900" },
  messageCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, alignItems: "center" },
  emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: "center" },
  errorText: { color: colors.accent, fontSize: 14, textAlign: "center", marginBottom: 12 },
  retryButton: { backgroundColor: colors.tabActive, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: colors.white, fontWeight: "700" },
});
