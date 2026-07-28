import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing, useStyles } from "../../../theme";
import { AppText, Card, SummaryRows } from "../../../ui";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { formatBdt } from "../../../utils/money";

export default function ProductConfigPriceSummary({
  basePrice,
  originalBasePrice,
  sizeSurcharge,
  logoSurcharge,
  quantity,
  totalPrice,
}) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  return (
    <Card tone="soft" style={styles.card}>
      <SummaryRows
        rows={[
          {
            label: t("catalog.basePrice"),
            value: (
              <View style={styles.priceValues}>
                {originalBasePrice > basePrice ? (
                  <AppText variant="caption" tone="secondary" style={styles.originalValue}>
                    {formatBdt(originalBasePrice, language)}
                  </AppText>
                ) : null}
                <AppText variant="bodySm">{formatBdt(basePrice, language)}</AppText>
              </View>
            ),
          },
          { label: t("catalog.quantity"), value: t("catalog.moq", { count: quantity }) },
        ]}
        total={{ label: t("catalog.totalPrice"), value: formatBdt(totalPrice, language) }}
      />
    </Card>
  );
}

const getStyles = () =>
  StyleSheet.create({
    card: {
      padding: spacing.lg - 2,
      marginBottom: spacing.lg,
    },
    priceValues: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm - 1,
    },
    originalValue: {
      textDecorationLine: "line-through",
    },
  });
