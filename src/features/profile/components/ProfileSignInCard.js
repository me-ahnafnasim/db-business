import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileSignInCard() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sign in to access</Text>
      <Text style={styles.subtitle}>Sign in to access all features</Text>
      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <Text style={styles.buttonText}>Sign In</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      paddingHorizontal: 18,
      paddingVertical: 24,
      alignItems: "center",
      marginBottom: 18,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 10,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 16,
      textAlign: "center",
      marginBottom: 22,
    },
    button: {
      alignSelf: "stretch",
      backgroundColor: colors.white,
      borderRadius: 24,
      minHeight: 56,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonPressed: {
      opacity: 0.88,
    },
    buttonText: {
      color: colors.black,
      fontSize: 18,
      fontWeight: "700",
    },
  });
