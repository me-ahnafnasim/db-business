import { useCallback, useEffect, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import AllocationLine from "../features/order/components/AllocationLine";
import { cancelOrder, getClientOrders } from "../services/api";
import { useLanguage } from "../i18n/LanguageProvider";
import { getLocalizedError } from "../i18n/errors";
import { formatBdt, formatDate, paisaToBdt } from "../utils/money";
import { spacing, useStyles, useTheme } from "../theme";
import { AppText, AsyncStateView, Button, Card } from "../ui";

export default function OrdersScreen({ onBack }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
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
    <StackScreenShell
      title={t("orders.title")}
      subtitle={t("orders.subtitle")}
      onBack={onBack}
      refreshControl={
        <RefreshControl
          refreshing={status === "loading"}
          onRefresh={loadOrders}
          tintColor={colors.brand}
          colors={[colors.brand]}
        />
      }
    >
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
      {error && status === "ready" ? (
        <AppText variant="bodySm" tone="error" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
      {orders.map((order) => (
        <Card key={String(order.id)} style={styles.card}>
          <View style={styles.row}>
            <AppText variant="bodyStrong" style={styles.orderNumber}>
              {order.orderNumber}
            </AppText>
            <AppText variant="caption" tone="brand" style={styles.status}>
              {t(`status.${String(order.workflowStatus || order.status).toLowerCase()}`)}
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
          {(order.workflowStatus || order.status) === "PENDING" ? (
            <Button
              title={busyId === order.id ? t("orders.cancelling") : t("orders.cancel")}
              onPress={() => handleCancel(order.id)}
              variant="dangerOutline"
              size="sm"
              loading={busyId === order.id}
              style={styles.cancelButton}
            />
          ) : null}
        </Card>
      ))}
    </StackScreenShell>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      marginBottom: spacing.lg - 2,
    },
    refreshButton: {
      alignSelf: "flex-end",
      marginBottom: spacing.md,
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
    errorText: {
      textAlign: "center",
      marginBottom: spacing.md,
    },
  });
