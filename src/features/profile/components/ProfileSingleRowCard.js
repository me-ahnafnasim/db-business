import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileSingleRowCard({ icon = "truck", labelKey = "profile.trackOrder", onPress }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.left}>
        <Feather name={icon} size={26} color={colors.tabActive} />
        <Text style={styles.label}>{t(labelKey)}</Text>
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
