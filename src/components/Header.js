import Feather from "@expo/vector-icons/Feather";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { getTimeGreeting } from "../features/shared/utils/timeGreeting";
import { radius, spacing, useStyles, useTheme } from "../theme";
import { AppText, Badge, IconButton } from "../ui";

// memo: one Header renders under every mounted tab, and its props (four stable handlers, a
// count, the auth object) almost never change — language and theme still reach it through
// their contexts.
export default memo(function Header({ onProfilePress, onSearchPress, onCartPress, cartCount = 0, auth }) {
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
        <IconButton label={t("header.openSearch")} onPress={onSearchPress} style={styles.actionButton}>
          <Feather name="search" size={20} color={colors.textPrimary} />
        </IconButton>
        <IconButton label={t("header.openCart", { count: cartCount })} onPress={onCartPress} style={styles.actionButton}>
          <View style={styles.iconWrap}>
            <Feather name="shopping-bag" size={20} color={colors.textPrimary} />
            <Badge count={cartCount} size="sm" style={styles.badge} />
          </View>
        </IconButton>
      </View>
    </View>
  );
});

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      // The body colour, with the rule below as the only separation — the same treatment the
      // bottom nav takes. `surface` against `background` measures 1.08:1 in light and 1.10:1
      // in dark, so the fill was implying an elevation nobody could actually see.
      backgroundColor: colors.background,
      // `divider`, not `border`: this is now the only thing marking where the header ends, and
      // `border` is 1.21:1 against the body in light theme, faint enough to read as nothing.
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg + 2,
      // 8 rather than 12: the tallest thing in here is a 40dp avatar, and 12dp above and below
      // it was slack rather than breathing room. 8 still clears it and takes the header from
      // 65 to 57dp (71 to 63 in Bangla, where the two-line text block is taller than the
      // avatar and sets the height instead).
      paddingVertical: spacing.sm,
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
      // Shares the role with the two action buttons: the avatar is a header control too, and
      // the three have to match.
      backgroundColor: colors.headerControlBackground,
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
    // IconButton applies the caller's style after its own tone, so this overrides tone_soft
    // without needing a new tone. `surfaceSoft` is left alone app-wide: it still reads at
    // 1.13:1 on the cards it was chosen for — it is only on the body that it disappears.
    actionButton: {
      backgroundColor: colors.headerControlBackground,
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
