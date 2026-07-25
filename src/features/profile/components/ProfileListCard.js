import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileListCard({
  items,
  onThemePress,
  onLanguagePress,
  themeValue,
}) {
  const { colors } = useTheme();
  const { languageLabel } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors);

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
        const onPress = isThemeItem ? onThemePress : isLanguageItem ? onLanguagePress : undefined;

        return (
          <Pressable
            key={item.key}
            style={({ pressed }) => [styles.row, index < items.length - 1 && styles.rowBorder, pressed && styles.rowPressed]}
            onPress={onPress}
          >
            <View style={styles.left}>
              <Feather name={item.icon} size={26} color={colors.tabActive} />
              <Text style={styles.label}>{t(item.labelKey)}</Text>
            </View>

            <View style={styles.right}>
              {value ? <Text style={styles.value}>{value}</Text> : null}
              <Feather name="chevron-right" size={26} color={colors.textSecondary} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      overflow: "hidden",
      marginBottom: 18,
    },
    row: {
      paddingHorizontal: 18,
      paddingVertical: 22,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowPressed: {
      opacity: 0.9,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      flexShrink: 1,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 12,
      flexShrink: 0,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "500",
      marginLeft: 14,
      flexShrink: 1,
    },
    value: {
      color: colors.textSecondary,
      fontSize: 16,
      marginRight: 12,
      flexShrink: 1,
      textAlign: "right",
    },
  });
