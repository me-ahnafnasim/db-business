import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing, useStyles } from "../../../theme";
import { AppText, Card, SummaryRows } from "../../../ui";

export default function CheckoutSummaryCard({ title, rows, total }) {
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  return (
    <Card style={styles.card}>
      <AppText variant="h4" style={styles.title}>
        {title || t("checkout.orderSummary")}
      </AppText>
      <SummaryRows rows={rows} total={total} />
    </Card>
  );
}

const getStyles = () =>
  StyleSheet.create({
    card: {
      marginTop: spacing.lg - 2,
    },
    title: {
      marginBottom: spacing.md,
    },
  });
