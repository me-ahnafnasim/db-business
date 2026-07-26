import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import { cancelOrder, getClientOrders } from "../services/api";
import { useLanguage } from "../i18n/LanguageProvider";
import { getLocalizedError } from "../i18n/errors";
import { formatBdt, formatDate, paisaToBdt } from "../utils/money";
import { useTheme } from "../theme/ThemeProvider";

export default function OrdersScreen({ onBack }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

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

  const handleCancel = async (orderId) => {
    setBusyId(orderId);
    setError("");
    try {
      await cancelOrder(orderId);
      setOrders((current) =>
        current.map((order) =>
          String(order.id) === String(orderId) ? { ...order, status: "CANCELLED" } : order
        )
      );
    } catch (cancelError) {
      setError(getLocalizedError(cancelError, t, "orders.cancelError"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <StackScreenShell title={t("orders.title")} subtitle={t("orders.subtitle")} onBack={onBack}>
      <Pressable style={styles.refreshButton} onPress={loadOrders} accessibilityRole="button">
        <Text style={styles.refreshText}>{t("common.refresh")}</Text>
      </Pressable>
      {status === "loading" ? <ActivityIndicator size="large" color={colors.tabActive} /> : null}
      {status === "error" ? (
        <View style={styles.messageCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadOrders}><Text style={styles.retryText}>{t("common.retry")}</Text></Pressable>
        </View>
      ) : null}
      {status === "ready" && !orders.length ? (
        <View style={styles.messageCard}><Text style={styles.emptyText}>{t("orders.empty")}</Text></View>
      ) : null}
      {error && status === "ready" ? <Text style={styles.errorText}>{error}</Text> : null}
      {orders.map((order) => (
        <View key={String(order.id)} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.status}>{t(`status.${String(order.workflowStatus || order.status).toLowerCase()}`)}</Text>
          </View>
          <Text style={styles.meta}>{formatDate(order.createdAt, language)} · {t("orders.lines", { count: order.items?.length || 0 })}</Text>
          {(order.items || []).map((item) => (
            <View key={String(item.id)} style={styles.pack}>
              <Text style={styles.packTitle}>{item.productName} · {item.quantityDozen} {t("catalog.perDozen")}</Text>
              {(item.allocations || []).map((allocation) => <Text key={String(allocation.productVariantId)} style={styles.meta}>{language === 'bn' && item.colorNames?.[allocation.colorCode]?.bn || allocation.colorCode} · {t("catalog.size")} {allocation.sizeCode} · {t("cart.pairs", { count: allocation.pairsPerDozen })}</Text>)}
            </View>
          ))}
          <Text style={styles.total}>{formatBdt(paisaToBdt(order.grandTotalPaisa), language)}</Text>
          {(order.workflowStatus || order.status) === "PENDING" ? (
            <Pressable
              style={[styles.cancelButton, busyId === order.id && styles.disabled]}
              disabled={busyId === order.id}
              onPress={() => handleCancel(order.id)}
            >
              <Text style={styles.cancelText}>{busyId === order.id ? t("orders.cancelling") : t("orders.cancel")}</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </StackScreenShell>
  );
}

const getStyles = (colors) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14 },
  refreshButton: { alignSelf: "flex-end", minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surfaceSoft, marginBottom: 12 },
  refreshText: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  orderNumber: { color: colors.textPrimary, fontSize: 16, fontWeight: "800", flex: 1 },
  status: { color: colors.tabActive, fontSize: 12, fontWeight: "800" },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 8 },
  pack: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 8 },
  packTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: "700" },
  total: { color: colors.textPrimary, fontSize: 20, fontWeight: "800", marginTop: 10 },
  cancelButton: { marginTop: 14, borderColor: colors.accent, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  cancelText: { color: colors.accent, fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.5 },
  messageCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, alignItems: "center" },
  emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: "center" },
  errorText: { color: colors.accent, fontSize: 14, textAlign: "center", marginBottom: 12 },
  retryButton: { backgroundColor: colors.tabActive, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: colors.white, fontWeight: "700" },
});
