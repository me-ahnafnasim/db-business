import Feather from "@expo/vector-icons/Feather";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { getTimeGreeting } from "../features/shared/utils/timeGreeting";
import { useTheme } from "../theme/ThemeProvider";

export default function Header({ onProfilePress, onSearchPress, onCartPress, cartCount = 0, auth }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const displayName = auth?.isSignedIn ? auth.displayName : t("header.guestUser");
  const avatarText = displayName?.trim()?.charAt(0)?.toUpperCase() || "?";
  const greeting = `${getTimeGreeting(t)}👋`;

  return (
    <View style={styles.container}>
      <Pressable style={styles.leftSection} onPress={onProfilePress} accessibilityRole="button" accessibilityLabel={t("header.openProfile")}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>{avatarText}</Text>
        </View>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text numberOfLines={1} style={styles.storeName}>
            {displayName}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={onSearchPress}
          accessibilityRole="button"
          accessibilityLabel={t("header.openSearch")}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        >
          <Feather name="search" size={20} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          onPress={onCartPress}
          accessibilityRole="button"
          accessibilityLabel={t("header.openCart", { count: cartCount })}
        >
          <View style={styles.iconWrap}>
          <SimpleLineIcons name="handbag" size={20} color={colors.textPrimary} />
          {cartCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount > 99 ? "99+" : cartCount}</Text>
            </View>
          ) : null}
          </View>
        </Pressable>
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
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1d4f91",
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "700",
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  storeName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    maxWidth: 150,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPressed: {
    backgroundColor: colors.headerIconPressedBackground,
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
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  });
