import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileSignInCard({ auth, onSignOut }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const isSignedIn = auth?.isSignedIn;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{isSignedIn ? t("profile.signedIn") : t("profile.signInToAccess")}</Text>
      <Text style={styles.subtitle}>
        {isSignedIn ? `${auth.displayName} · ${auth.email}` : t("profile.signInSubtitle")}
      </Text>
      {isSignedIn ? (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onSignOut}
          accessibilityRole="button"
          accessibilityLabel={t("profile.logout")}
        >
          <Text style={styles.buttonText}>{t("profile.logout")}</Text>
        </Pressable>
      ) : null}
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
