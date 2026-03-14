import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function AdminStatCard({ item }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <Text style={styles.value}>{item.value}</Text>
      <Text style={styles.label}>{item.label}</Text>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 96,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 14,
    },
    value: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "800",
      marginBottom: 6,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
  });
