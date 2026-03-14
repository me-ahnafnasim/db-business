import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileSignInCard({ auth, onPress, onSignOut, onAdminPress }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);
  const isSignedIn = auth?.isSignedIn;
  const isAdmin = auth?.role === "admin";

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{isSignedIn ? "Signed in" : "Sign in to access"}</Text>
      <Text style={styles.subtitle}>
        {isSignedIn ? `${auth.displayName} · ${auth.email}` : "Sign in to access all features"}
      </Text>
      {isSignedIn ? (
        <View style={styles.actions}>
          {isAdmin ? (
            <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={onAdminPress}>
              <Text style={styles.buttonText}>Open Admin Panel</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isAdmin && styles.secondaryButton]}
            onPress={onSignOut}
          >
            <Text style={[styles.buttonText, isAdmin && styles.secondaryButtonText]}>{isAdmin ? "Sign Out" : "Logout"}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={onPress}>
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
      )}
    </View>
  );
}

const getStyles = (colors, isDarkMode) =>
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
    actions: {
      alignSelf: "stretch",
      gap: 10,
    },
    secondaryButton: {
      backgroundColor: colors.surfaceSoft,
    },
    secondaryButtonText: {
      color: isDarkMode ? colors.white : colors.textPrimary,
    },
  });
