import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileListCard({ items, onThemePress, themeValue }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      {items.map((item, index) => {
        const isThemeItem = item.key === "theme";
        const value = isThemeItem ? themeValue || item.value : item.value;

        return (
          <Pressable
            key={item.key}
            style={({ pressed }) => [styles.row, index < items.length - 1 && styles.rowBorder, pressed && styles.rowPressed]}
            onPress={isThemeItem ? onThemePress : undefined}
          >
            <View style={styles.left}>
              <Feather name={item.icon} size={26} color={colors.white} />
              <Text style={styles.label}>{item.label}</Text>
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
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 12,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "500",
      marginLeft: 14,
    },
    value: {
      color: colors.textSecondary,
      fontSize: 16,
      marginRight: 12,
    },
  });
