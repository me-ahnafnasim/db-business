import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileSingleRowCard() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.left}>
        <Feather name="truck" size={26} color={colors.white} />
        <Text style={styles.label}>Track Order</Text>
      </View>
      <Feather name="chevron-right" size={28} color={colors.textSecondary} />
    </Pressable>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      paddingHorizontal: 18,
      paddingVertical: 22,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    cardPressed: {
      opacity: 0.9,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
    },
    label: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "500",
      marginLeft: 14,
    },
  });
