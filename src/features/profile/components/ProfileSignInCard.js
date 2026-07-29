import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { radius, spacing, useStyles } from "../../../theme";
import { AppText, Button } from "../../../ui";

export default function ProfileSignInCard({ auth, onSignIn, onSignOut }) {
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const isSignedIn = auth?.isSignedIn;

  return (
    <View style={styles.card}>
      <AppText variant="h2" style={styles.title}>
        {isSignedIn ? t("profile.signedIn") : t("profile.signInToAccess")}
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.subtitle}>
        {isSignedIn ? `${auth.displayName} · ${auth.email}` : t("profile.signInSubtitle")}
      </AppText>
      {isSignedIn ? (
        // Was a white button on a white card — invisible in light mode.
        <Button title={t("profile.logout")} onPress={onSignOut} variant="secondary" size="lg" />
      ) : (
        <Button title={t("profile.continueWithGoogle")} onPress={onSignIn} size="lg" />
      )}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      paddingHorizontal: spacing.lg + 2,
      paddingVertical: spacing.xxl,
      alignSelf: "stretch",
      alignItems: "stretch",
      marginBottom: spacing.lg + 2,
    },
    title: {
      marginBottom: spacing.sm + 2,
      textAlign: "center",
    },
    subtitle: {
      textAlign: "center",
      marginBottom: spacing.xxl - 2,
    },
  });
