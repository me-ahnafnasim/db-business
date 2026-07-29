import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import OrderHistoryCard from "../features/order/components/OrderHistoryCard";
import { cancelOrder, getClientOrders } from "../services/api";
import { getLocalizedError } from "../i18n/errors";
import { spacing, useStyles, useTheme } from "../theme";
import { AppText, AsyncStateView, Button } from "../ui";

export default function OrdersScreen({ onBack, onContactSupport }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // `t` through a ref: as a dependency it re-created loadOrders on every language toggle,
  // and the effect below dutifully refired GET /client/orders just because the user
  // switched EN/BN.
  const tRef = useRef(t);
  tRef.current = t;

  const loadOrders = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      // Bounded: this list renders virtualised cards, not an accounting report, and the
      // request used to ask for every order the account has ever placed.
      const response = await getClientOrders({ limit: 100 });
      setOrders(response.data || []);
      setStatus("ready");
    } catch (loadError) {
      setError(getLocalizedError(loadError, tRef.current, "orders.loadError"));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCancel = useCallback(async (orderId) => {
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
      setError(getLocalizedError(cancelError, tRef.current, "orders.cancelError"));
    } finally {
      setBusyId(null);
    }
  }, []);

  const renderOrder = useCallback(
    ({ item }) => (
      <OrderHistoryCard order={item} busy={busyId === item.id} onCancel={handleCancel} onContactSupport={onContactSupport} />
    ),
    [busyId, handleCancel, onContactSupport]
  );

  // Header travels inside the list so the whole screen scrolls as one virtualised
  // surface rather than a ScrollView holding every order at once.
  const header = (
    <View>
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
    </View>
  );

  return (
    <StackScreenShell
      title={t("orders.title")}
      subtitle={t("orders.subtitle")}
      onBack={onBack}
      scrollable={false}
    >
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrder}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={status === "loading"}
            onRefresh={loadOrders}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
      />
    </StackScreenShell>
  );
}

const getStyles = () =>
  StyleSheet.create({
    listContent: {
      paddingBottom: spacing.xxl,
    },
    refreshButton: {
      alignSelf: "flex-end",
      marginBottom: spacing.md,
    },
    errorText: {
      textAlign: "center",
      marginBottom: spacing.md,
    },
  });
