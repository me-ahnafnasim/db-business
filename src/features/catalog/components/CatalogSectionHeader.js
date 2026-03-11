import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function CatalogSectionHeader({ title, onPress, actionLabel = "View All" }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const showAction = Boolean(actionLabel);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {showAction ? (
        <Pressable style={styles.action} onPress={onPress}>
          <Text style={styles.actionText}>{actionLabel}</Text>
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
      fontSize: 24,
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
    },
  });
