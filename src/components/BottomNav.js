import Feather from "@expo/vector-icons/Feather";
import { memo, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tabs } from "../data/tabs";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useLanguage } from "../i18n/LanguageProvider";
import { radius, spacing, useStyles, useTheme } from "../theme";
import { AppText, Badge } from "../ui";

// One icon family for the whole bar. It previously mixed Ionicons, MaterialCommunityIcons,
// Feather and SimpleLineIcons, so stroke weights and optical sizes did not match.
//
// Feather is outline-only, so there is no filled variant to switch to when a tab is active —
// a filled set would mean a second icon font (~1.3 MB) for four glyphs. The active state is
// carried instead by the pill, the brand colour and a heavier label, which cost nothing.
const TAB_ICONS = {
  home: "home",
  categories: "grid",
  cart: "shopping-bag",
  profile: "user",
};

// Springs rather than linear timing: the pill settles with a slight overshoot, which reads as
// responsive rather than mechanical. Both driven natively — opacity and scale only, never
// width, which is a layout property and would pin every tab change to the JS thread.
const SELECT_SPRING = { friction: 7, tension: 140, useNativeDriver: true };
const PRESS_SPRING = { friction: 6, tension: 320, useNativeDriver: true };

function BottomNavItem({ tabKey, label, active, badgeCount, reducedMotion, onPress, styles, colors }) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = active ? 1 : 0;
    if (reducedMotion) {
      progress.setValue(target);
      return undefined;
    }
    const animation = Animated.spring(progress, { toValue: target, ...SELECT_SPRING });
    animation.start();
    return () => animation.stop();
  }, [active, progress, reducedMotion]);

  const setPressed = (down) => {
    if (reducedMotion) {
      press.setValue(down ? 1 : 0);
      return;
    }
    Animated.spring(press, { toValue: down ? 1 : 0, ...PRESS_SPRING }).start();
  };

  // Overshoots slightly past 1 as the spring settles, so the pill has a little bounce.
  const pillScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  const pillOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const contentScale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] });

  return (
    <Pressable
      style={styles.tab}
      onPress={() => onPress?.(tabKey)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      // The native Android ripple. It was absent here, and switched off outright elsewhere in
      // the app — a tab press had no platform feedback at all.
      android_ripple={{ color: colors.brandSoft, borderless: true, radius: 44 }}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        <Animated.View style={[styles.content, { transform: [{ scale: contentScale }] }]}>
          <View style={styles.indicator}>
            <Animated.View
              style={[styles.pill, { opacity: pillOpacity, transform: [{ scaleX: pillScale }] }]}
              pointerEvents="none"
            />
            {/* Touching an inactive tab shows a faint pill, so the press lands on something
                visible instead of only tinting the icon. */}
            {pressed && !active ? <View style={styles.ghostPill} pointerEvents="none" /> : null}
            <Feather
              name={TAB_ICONS[tabKey] ?? "circle"}
              size={24}
              color={active || pressed ? colors.brand : colors.tabInactive}
            />
            {tabKey === "cart" ? (
              <Badge count={badgeCount} size="sm" style={styles.badge} />
            ) : null}
          </View>
          <AppText
            variant="label"
            tone={active ? "brand" : "secondary"}
            style={[styles.label, active && styles.labelActive]}
            numberOfLines={1}
          >
            {label}
          </AppText>
        </Animated.View>
      )}
    </Pressable>
  );
}

const MemoBottomNavItem = memo(BottomNavItem);

export default function BottomNav({ activeTab, onTabPress, cartCount = 0 }) {
  const { colors } = useTheme();
  const { layout } = useLanguage();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const styles = useStyles((themeColors) => getStyles(themeColors, layout), [layout]);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(spacing.sm, insets.bottom) }]}>
      {tabs.map((tab) => (
        <MemoBottomNavItem
          key={tab.key}
          tabKey={tab.key}
          label={t(tab.labelKey)}
          active={tab.key === activeTab}
          badgeCount={cartCount}
          reducedMotion={reducedMotion}
          onPress={onTabPress}
          styles={styles}
          colors={colors}
        />
      ))}
    </View>
  );
}

const getStyles = (colors, layout) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      // One separator, not two. A shadow is invisible against a dark surface, so the
      // hairline is the divider that actually works in both themes.
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
      flexDirection: "row",
      // Keeps the borderless ripple from spilling over the screen edge on the outer tabs.
      overflow: "hidden",
    },
    // flex: 1 already distributes the cells evenly, and the Pressable spans the full bar
    // height — so the tap target is the whole cell, not the 32dp pill.
    tab: {
      minWidth: layout.tabMinWidth,
      paddingHorizontal: spacing.sm,
      flex: 1,
    },
    content: {
      alignItems: "center",
      gap: spacing.xs,
    },
    indicator: {
      width: 64,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    pill: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: radius.pill,
      backgroundColor: colors.brandSoft,
    },
    ghostPill: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: radius.pill,
      backgroundColor: colors.tabPressedBackground,
    },
    // Centred on the icon's top-right corner inside the 64dp indicator. At the default `md`
    // size it was as wide as the icon itself and covered 55% of the bag; an `sm` badge here
    // overlaps 38%, which is the usual corner tuck. The ring in the bar's own surface colour
    // cuts it away from the glyph so both stay legible.
    badge: {
      position: "absolute",
      top: 0,
      right: 11,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    label: {
      fontSize: layout.tabFontSize,
      // Derived from the same locale metric as the size. Inheriting the `label` role's line
      // height left Bangla rendering 11px text inside a 23dp box, sitting optically high.
      lineHeight: Math.round(layout.tabFontSize * layout.leading.body),
      fontWeight: "500",
      flexShrink: 1,
      textAlign: "center",
    },
    labelActive: {
      fontWeight: "700",
    },
  });
