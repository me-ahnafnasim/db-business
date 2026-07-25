import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeProvider";

export default function CatalogSectionHeader({ title, onPress, actionLabel }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const resolvedActionLabel = actionLabel === undefined ? t("home.viewAll") : actionLabel;
  const showAction = Boolean(resolvedActionLabel);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {showAction ? (
        <Pressable style={styles.action} onPress={onPress}>
          <Text style={styles.actionText}>{resolvedActionLabel}</Text>
          <Feather name="chevron-right" size={20} color={colors.tabActive} />
        </Pressable>
      ) : null}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      lineHeight: 29,
      fontWeight: "800",
      flex: 1,
      marginRight: 12,
    },
    action: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    actionText: {
      color: colors.tabActive,
      fontSize: 16,
      fontWeight: "700",
      flexShrink: 1,
    },
  });
