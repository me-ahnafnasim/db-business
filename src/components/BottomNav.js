import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tabs } from "../data/tabs";
import { useLanguage } from "../i18n/LanguageProvider";
import { elevation, spacing, useStyles, useTheme } from "../theme";
import { AppText, Badge } from "../ui";

// One icon family for the whole bar. It previously mixed Ionicons, MaterialCommunityIcons,
// Feather and SimpleLineIcons, so stroke weights and optical sizes did not match, and the
// cart glyph was drawn 2pt smaller than its neighbours.
const TAB_ICONS = {
  home: "home",
  categories: "grid",
  search: "search",
  cart: "shopping-bag",
  profile: "user",
};

export default function BottomNav({ activeTab, onTabPress, cartCount = 0 }) {
  const { colors } = useTheme();
  const { layout } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useStyles((themeColors) => getStyles(themeColors, layout), [layout]);

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
              const iconColor = active || pressed ? colors.brand : colors.tabInactive;

              return (
                <>
                  <View style={styles.iconWrap}>
                    <Feather name={TAB_ICONS[tab.key] ?? "circle"} size={20} color={iconColor} />
                    {tab.key === "cart" ? <Badge count={cartCount} style={styles.badge} /> : null}
                  </View>
                  <AppText
                    variant="label"
                    tone={active ? "brand" : "secondary"}
                    style={styles.label}
                    numberOfLines={1}
                  >
                    {t(tab.labelKey)}
                  </AppText>
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
      // Elevation is reserved for genuinely floating surfaces; cards stay flat.
      ...elevation(1, colors.shadow),
      paddingTop: spacing.sm + 2,
      paddingBottom: spacing.lg - 2,
      flexDirection: "row",
      justifyContent: "space-around",
    },
    tab: {
      alignItems: "center",
      gap: spacing.xs + 2,
      minWidth: layout.tabMinWidth,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 2,
      flex: 1,
    },
    iconWrap: {
      position: "relative",
    },
    badge: {
      position: "absolute",
      top: -8,
      right: -12,
    },
    label: {
      // The locale metrics keep Bangla labels from wrapping the five-item bar.
      fontSize: layout.tabFontSize,
      fontWeight: "500",
      flexShrink: 1,
      textAlign: "center",
    },
  });
