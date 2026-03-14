import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { getTimeGreeting } from "../../shared/utils/timeGreeting";
import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileWelcomeCard({ auth }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);
  const title = auth?.isSignedIn ? `Welcome, ${auth.displayName}` : "Welcome";
  const subtitle = auth?.isSignedIn ? `${getTimeGreeting()} — account ready` : "Sign in to continue";

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Feather name="user" size={28} color={colors.black} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
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
