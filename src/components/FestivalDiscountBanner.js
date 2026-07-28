import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../i18n/LanguageProvider";
import { radius, spacing, useStyles, useTheme } from "../theme";
import { AppText } from "../ui";

function remainingParts(endsAt) {
  const remaining = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const seconds = Math.floor(remaining / 1000);
  return {
    remaining,
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

export default function FestivalDiscountBanner({ campaign }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const [time, setTime] = useState(() => remainingParts(campaign?.endsAt));

  useEffect(() => {
    setTime(remainingParts(campaign?.endsAt));
    const timer = setInterval(() => setTime(remainingParts(campaign?.endsAt)), 1000);
    return () => clearInterval(timer);
  }, [campaign?.endsAt]);

  if (!campaign || !time.remaining) return null;
  const bangla = language === "bn";
  const festivalName = bangla && campaign.festivalNameBn ? campaign.festivalNameBn : campaign.festivalName;
  const headline = bangla && campaign.headlineBn ? campaign.headlineBn : campaign.headline;
  const units = [
    [time.days, t("festival.days")],
    [time.hours, t("festival.hours")],
    [time.minutes, t("festival.minutes")],
    [time.seconds, t("festival.seconds")],
  ];

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <MaterialCommunityIcons name="party-popper" size={24} color={colors.onBrand} />
        <View style={styles.headingText}>
          <AppText variant="label" style={styles.festival}>
            {festivalName}
          </AppText>
          <AppText variant="bodySm" style={styles.headline}>
            {headline}
          </AppText>
        </View>
        <View style={styles.discount}>
          <AppText variant="h4" style={styles.discountValue}>
            {campaign.discountPercent}%
          </AppText>
          <AppText variant="micro" style={styles.discountLabel}>
            {t("festival.off")}
          </AppText>
        </View>
      </View>
      <View style={styles.timer}>
        {units.map(([value, label]) => (
          <View style={styles.timeBox} key={label}>
            <AppText variant="h4" style={styles.timeValue}>
              {String(value).padStart(2, "0")}
            </AppText>
            <AppText variant="micro" style={styles.timeLabel} numberOfLines={1}>
              {label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      marginHorizontal: spacing.gutter,
      marginTop: spacing.lg + 2,
      padding: spacing.lg,
      borderRadius: radius.card,
      backgroundColor: colors.sale,
      borderWidth: 1,
      borderColor: colors.saleBorder,
    },
    headingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm + 2,
    },
    headingText: {
      flex: 1,
    },
    festival: {
      color: colors.onBrand,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    headline: {
      color: colors.onSaleMuted,
      fontWeight: "700",
      marginTop: 2,
    },
    discount: {
      alignItems: "center",
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.sm,
      backgroundColor: colors.onBrand,
    },
    discountValue: {
      color: colors.onScrim,
    },
    discountLabel: {
      color: colors.sale,
    },
    timer: {
      flexDirection: "row",
      gap: spacing.sm - 1,
      marginTop: spacing.md + 1,
    },
    timeBox: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: "rgba(255, 255, 255, 0.55)",
    },
    timeValue: {
      color: colors.onBrand,
    },
    timeLabel: {
      color: colors.onSaleMuted,
    },
  });
