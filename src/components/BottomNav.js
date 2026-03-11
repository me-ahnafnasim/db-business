import { Feather, Ionicons, MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { tabs } from "../data/tabs";
import { useTheme } from "../theme/ThemeProvider";

export default function BottomNav({ activeTab, onTabPress, cartCount = 0 }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress?.(tab.key)}
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
                  <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
                </>
              );
            }}
          </Pressable>
        );
      })}
    </View>
  );
}

const getStyles = (colors) =>
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
    minWidth: 58,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    fontSize: 15,
    fontWeight: "500",
  },
  activeLabel: {
    color: colors.tabActive,
    fontWeight: "500",
  },
  });
