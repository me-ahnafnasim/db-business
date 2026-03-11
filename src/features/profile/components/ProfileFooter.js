import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileFooter() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.helpText}>
        Need help? Call us at <Text style={styles.phone}>1-800-123-4567</Text>
      </Text>
      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      paddingTop: 28,
      paddingBottom: 10,
    },
    helpText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
      marginBottom: 8,
    },
    phone: {
      color: colors.textPrimary,
      fontWeight: "700",
    },
    version: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
