import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { radius, spacing, useStyles } from "../../../theme";
import ProfileRow from "./ProfileRow";

export default function ProfileListCard({
  items,
  onThemePress,
  onLanguagePress,
  onSupportItemPress,
  themeValue,
}) {
  const { languageLabel } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  return (
    <View style={styles.card}>
      {items.map((item, index) => {
        const isThemeItem = item.key === "theme";
        const isLanguageItem = item.key === "language";
        const value = isThemeItem
          ? themeValue
          : isLanguageItem
            ? languageLabel
            : item.staticValue ?? null;
        // Display-only rows such as "Currency · BDT" have no handler, so they no longer
        // advertise a chevron they never honoured.
        const onPress = isThemeItem
          ? onThemePress
          : isLanguageItem
            ? onLanguagePress
            : onSupportItemPress
              ? () => onSupportItemPress(item.key)
              : undefined;

        return (
          <ProfileRow
            key={item.key}
            icon={item.icon}
            label={t(item.labelKey)}
            value={value}
            onPress={onPress}
            showDivider={index < items.length - 1}
          />
        );
      })}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      overflow: "hidden",
      marginBottom: spacing.lg + 2,
    },
  });
