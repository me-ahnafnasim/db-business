import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileWelcomeCard() {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Feather name="user" size={28} color={colors.black} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>
    </View>
  );
}

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDarkMode ? "#ececec" : colors.surface,
      borderRadius: 28,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingVertical: 20,
      marginBottom: 18,
    },
    iconWrap: {
      width: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    textWrap: {
      marginLeft: 12,
    },
    title: {
      color: colors.black,
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 4,
    },
    subtitle: {
      color: "#4b5563",
      fontSize: 18,
      fontWeight: "400",
    },
  });
