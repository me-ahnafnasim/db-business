import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { spacing, useStyles } from "../../../theme";
import { AppText, Button, Card, SummaryRows } from "../../../ui";
import { formatBdt } from "../../../utils/money";
import AllocationLine from "./AllocationLine";

export default function OrderConfirmationCard({ order, onTrackOrder, onContinueShopping }) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  if (!order) {
    return null;
  }

  return (
    <Card style={styles.card}>
      {/* The subtitle used to repeat here. StackScreenShell already renders
          `confirmation.subtitle` in the header, so it was on screen twice. */}
      <AppText variant="h2" style={styles.title}>
        {t("confirmation.success")}
      </AppText>
      <SummaryRows
        rows={[
          { label: t("confirmation.status"), value: t(`status.${String(order.status || "pending").toLowerCase()}`) },
          { label: t("confirmation.orderNumber"), value: order.id },
          { label: t("confirmation.items"), value: order.itemCount },
        ]}
      />
      {(order.packs || []).map((pack) => (
        <View key={pack.lineId || pack.id} style={styles.pack}>
          <AppText variant="caption" tone="primary" style={styles.packTitle}>
            {pack.name} · {pack.quantity} {t("catalog.perDozen")}
          </AppText>
          {(pack.allocations || []).map((allocation) => (
            <AllocationLine
              key={allocation.productVariantId}
              allocation={allocation}
              colorNames={pack.colorNames}
              variant="micro"
            />
          ))}
        </View>
      ))}
      <SummaryRows
        rows={[
          { label: t("confirmation.shipping"), value: order.shippingMethodLabel || "" },
          { label: t("confirmation.payment"), value: t(order.paymentMethodKey || "status.unpaid") },
          { label: t("confirmation.delivery"), value: order.etaLabel || "" },
        ]}
        total={{ label: t("confirmation.total"), value: formatBdt(order.total, language) }}
        style={styles.totals}
      />
      <Button title={t("confirmation.track")} onPress={onTrackOrder} size="lg" style={styles.action} />
      <Button
        title={t("confirmation.continueShopping")}
        onPress={onContinueShopping}
        variant="secondary"
        size="lg"
        style={styles.action}
      />
    </Card>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      padding: spacing.lg + 2,
    },
    title: {
      // Carries the gap the removed subtitle used to hold below it.
      marginBottom: spacing.lg + 2,
    },
    pack: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: spacing.sm,
    },
    packTitle: {
      fontWeight: "700",
    },
    totals: {
      marginTop: spacing.sm,
    },
    action: {
      marginTop: spacing.sm + 2,
    },
  });
