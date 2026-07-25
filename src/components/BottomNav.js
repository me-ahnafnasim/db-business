import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tabs } from "../data/tabs";
import { useLanguage } from "../i18n/LanguageProvider";
import { useTheme } from "../theme/ThemeProvider";

export default function BottomNav({ activeTab, onTabPress, cartCount = 0 }) {
  const { colors } = useTheme();
  const { layout } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, layout);
  return (
    <View style={[styles.container, { paddingBottom: Math.max(10, insets.bottom) }]}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress?.(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(tab.labelKey)}
          >
            {({ pressed }) => {
              const iconColor = active || pressed ? colors.white : colors.tabInactive;
              const icon =
                tab.key === "home" ? (
                  <Ionicons name="home" size={20} color={iconColor} />
                ) : tab.key === "categories" ? (
                  <MaterialCommunityIcons name="view-grid-outline" size={20} color={iconColor} />
                ) : tab.key === "search" ? (
                  <Feather name="search" size={20} color={iconColor} />
                ) : tab.key === "cart" ? (
                  <SimpleLineIcons name="handbag" size={18} color={iconColor} />
                ) : (
                  <Feather name="user" size={20} color={iconColor} />
                );

              return (
                <>
                  <View style={styles.iconWrap}>
                    {icon}
                    {tab.key === "cart" && cartCount > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{cartCount > 99 ? "99+" : cartCount}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.label, active && styles.activeLabel]} numberOfLines={1}>
                    {t(tab.labelKey)}
                  </Text>
                </>
              );
            }}
          </Pressable>
        );
      })}
    </View>
  );
}

const getStyles = (colors, layout) =>
  StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tab: {
    alignItems: "center",
    gap: 6,
    minWidth: layout.tabMinWidth,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flex: 1,
  },
  iconWrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -12,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
  },
  label: {
    color: colors.tabInactive,
    fontSize: layout.tabFontSize,
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "center",
  },
  activeLabel: {
    color: colors.tabActive,
    fontWeight: "500",
  },
  });
