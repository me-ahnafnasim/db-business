import Feather from "@expo/vector-icons/Feather";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { getTimeGreeting } from "../../shared/utils/timeGreeting";
import { radius, spacing, useStyles, useTheme } from "../../../theme";
import { AppText } from "../../../ui";

export default function ProfileWelcomeCard({ auth }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const title = auth?.isSignedIn
    ? t("profile.welcomeUser", { name: auth.displayName })
    : t("profile.welcome");
  const subtitle = auth?.isSignedIn
    ? `${getTimeGreeting(t)} — ${t("profile.accountReady")}`
    : t("profile.signInToContinue");

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        {/* Was colors.black on surfaceSoft — invisible in dark mode. */}
        <Feather name="user" size={28} color={colors.textPrimary} />
      </View>
      <View style={styles.textWrap}>
        <AppText variant="h2" style={styles.title}>
          {title}
        </AppText>
        <AppText variant="body" tone="secondary" style={styles.subtitle}>
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceSoft,
      borderRadius: radius.card,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg + 2,
      paddingVertical: spacing.xl,
      marginBottom: spacing.lg + 2,
    },
    iconWrap: {
      width: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    textWrap: {
      marginLeft: spacing.md,
      flex: 1,
      flexShrink: 1,
    },
    title: {
      marginBottom: spacing.xs,
      flexShrink: 1,
    },
    subtitle: {
      flexShrink: 1,
    },
  });
