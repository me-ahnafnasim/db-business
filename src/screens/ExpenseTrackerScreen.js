import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import ExpenseOrderCard from "../features/order/components/ExpenseOrderCard";
import { getClientOrders } from "../services/api";
import { useLanguage } from "../i18n/LanguageProvider";
import { getLocalizedError } from "../i18n/errors";
import { formatBdt, paisaToBdt } from "../utils/money";
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
  const hasOrders = status === "ready" && orders.length > 0;

  const renderOrder = useCallback(({ item }) => <ExpenseOrderCard order={item} />, []);

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
      {hasOrders ? (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryNeutral]}>
            {/* Three cards across leaves ~58dp of text on a 320dp phone, so these values
                shrink to fit rather than wrapping a currency amount mid-number. */}
            <AppText
              variant="h4"
              style={styles.summaryValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {summary.totalOrders}
            </AppText>
            <AppText variant="micro" tone="secondary" style={styles.summaryLabel}>
              {t("expenseTracker.totalOrders")}
            </AppText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.success + "22" }]}>
            <AppText
              variant="h4"
              tone="success"
              style={styles.summaryValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatBdt(paisaToBdt(summary.totalPaidPaisa), language)}
            </AppText>
            <AppText variant="micro" tone="success" style={styles.summaryLabel}>
              {t("expenseTracker.totalPaid")}
            </AppText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.error + "22" }]}>
            <AppText
              variant="h4"
              tone="error"
              style={styles.summaryValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatBdt(paisaToBdt(summary.totalDuePaisa), language)}
            </AppText>
            <AppText variant="micro" tone="error" style={styles.summaryLabel}>
              {t("expenseTracker.totalDue")}
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );

  const footer = hasOrders ? (
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
  ) : null;

  return (
    <StackScreenShell
      title={t("expenseTracker.title")}
      subtitle={t("expenseTracker.subtitle")}
      onBack={onBack}
      scrollable={false}
    >
      <FlatList
        data={hasOrders ? orders : []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrder}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
      />
    </StackScreenShell>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    listContent: {
      paddingBottom: spacing.xxl,
    },
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
    footerSummary: {
      marginTop: spacing.xs,
    },
  });
