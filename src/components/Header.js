import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { getTimeGreeting } from "../features/shared/utils/timeGreeting";
import { radius, spacing, useStyles, useTheme } from "../theme";
import { AppText, Badge, IconButton } from "../ui";

export default function Header({ onProfilePress, onSearchPress, onCartPress, cartCount = 0, auth }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const displayName = auth?.isSignedIn ? auth.displayName : t("header.guestUser");
  const avatarText = displayName?.trim()?.charAt(0)?.toUpperCase() || "?";
  const greeting = `${getTimeGreeting(t)}👋`;

  return (
    <View style={styles.container}>
      <Pressable style={styles.leftSection} onPress={onProfilePress} accessibilityRole="button" accessibilityLabel={t("header.openProfile")}>
        <View style={styles.logoWrap}>
          <AppText variant="h2">{avatarText}</AppText>
        </View>
        <View style={styles.identity}>
          <AppText variant="micro" tone="secondary" style={styles.greeting}>
            {greeting}
          </AppText>
          <AppText numberOfLines={1} variant="bodySm" style={styles.storeName}>
            {displayName}
          </AppText>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <IconButton label={t("header.openSearch")} onPress={onSearchPress}>
          <Feather name="search" size={20} color={colors.textPrimary} />
        </IconButton>
        <IconButton label={t("header.openCart", { count: cartCount })} onPress={onCartPress}>
          <View style={styles.iconWrap}>
            <Feather name="shopping-bag" size={20} color={colors.textPrimary} />
            <Badge count={cartCount} size="sm" style={styles.badge} />
          </View>
        </IconButton>
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg + 2,
      paddingVertical: spacing.md,
    },
    leftSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg - 2,
      flex: 1,
    },
    // Was a hardcoded navy circle that ignored the theme entirely.
    logoWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: colors.brand,
      backgroundColor: colors.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    identity: {
      flex: 1,
    },
    greeting: {
      fontWeight: "400",
      marginBottom: 2,
    },
    storeName: {
      fontWeight: "700",
      maxWidth: 150,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginLeft: spacing.md,
    },
    iconWrap: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: -7,
      right: -9,
    },
  });
