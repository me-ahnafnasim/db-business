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
// carried instead by an indicator, a colour change and a heavier label, which cost nothing.
//
// That colour is theme-dependent and the tabActive* roles hold it: gold on dark, where gold
// reads at 9.33:1, and a dark chip with a white glyph on light, where it reads at 2.54:1 and
// AA wants 4.5:1 for this 13px label.
const TAB_ICONS = {
  home: "home",
  categories: "grid",
  cart: "shopping-bag",
  // message-circle, not help-circle: this entry opens a WhatsApp chat, so it should promise a
  // conversation rather than a FAQ. It is also the icon already on the "Chat on WhatsApp"
  // button inside HelpCenterScreen, so the same action looks the same in both places.
  support: "message-circle",
  profile: "user",
};

// Springs rather than linear timing: the pill settles with a slight overshoot, which reads as
// responsive rather than mechanical. Both driven natively — opacity and scale only, never
// width, which is a layout property and would pin every tab change to the JS thread.
const SELECT_SPRING = { friction: 7, tension: 140, useNativeDriver: true };
const PRESS_SPRING = { friction: 6, tension: 320, useNativeDriver: true };

function BottomNavItem({
  tabKey,
  label,
  active,
  isAction,
  badgeCount,
  reducedMotion,
  onPress,
  styles,
  colors,
}) {
  // Light theme carries the selection on the glyph alone — a filled pill there is either
  // invisible (gold, 1.17:1) or a near-black slab in a light bar. Its palette says so by
  // setting the pill colour to `transparent`, and nothing below renders or animates when it
  // does, so there is no view being sprung in that nobody can see.
  const showPill = colors.tabActiveBackground !== "transparent";
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = active ? 1 : 0;
    if (reducedMotion) {
      progress.setValue(target);
      return undefined;
    }
    const animation = Animated.spring(progress, {
      toValue: target,
      ...SELECT_SPRING,
    });
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
  const pillScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });
  const pillOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const contentScale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.94],
  });

  return (
    <Pressable
      style={styles.tab}
      onPress={() => onPress?.(tabKey)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      // The native Android ripple. It was absent here, and switched off outright elsewhere in
      // the app — a tab press had no platform feedback at all.
      android_ripple={{
        color: colors.tabPressedBackground,
        borderless: true,
        radius: 44,
      }}
      // An action entry opens WhatsApp instead of navigating, so it is a button. Announcing it
      // as a tab would promise selection semantics it never has — a screen reader would be
      // waiting for a "selected" state that can never arrive.
      accessibilityRole={isAction ? "button" : "tab"}
      accessibilityState={isAction ? undefined : { selected: active }}
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        <>
          {/* The other half of `showPill`. A theme without a pill still needs to mark the
              selection somewhere other than on the glyph, so it gets a bar on the divider
              instead: full-strength dark at 16.40:1, but 72dp2 of ink against the chip's
              1408dp2, which is the whole point — highlight without a slab.

              Driven by the same spring as the pill, so the selection animates identically in
              both themes and the motion lands on something visible in each. */}
          {!showPill ? (
            <View style={styles.indicatorBarWrap} pointerEvents="none">
              <Animated.View
                style={[
                  styles.indicatorBar,
                  { opacity: pillOpacity, transform: [{ scaleX: pillScale }] },
                ]}
              />
            </View>
          ) : null}
          <Animated.View
            style={[styles.content, { transform: [{ scale: contentScale }] }]}
          >
            <View style={styles.indicator}>
              {showPill ? (
                <Animated.View
                  style={[
                    styles.pill,
                    {
                      opacity: pillOpacity,
                      transform: [{ scaleX: pillScale }],
                    },
                  ]}
                  pointerEvents="none"
                />
              ) : null}
              {/* Touching an inactive tab shows a faint pill, so the press lands on something
                visible instead of only tinting the icon. */}
              {pressed && !active ? (
                <View style={styles.ghostPill} pointerEvents="none" />
              ) : null}
              <Feather
                name={TAB_ICONS[tabKey] ?? "circle"}
                size={24}
                color={
                  active || pressed
                    ? colors.tabActiveForeground
                    : colors.tabInactive
                }
              />
              {tabKey === "cart" ? (
                <Badge
                  count={badgeCount}
                  size="sm"
                  style={[
                    styles.badge,
                    active && showPill && styles.badgeOnPill,
                  ]}
                />
              ) : null}
            </View>
            <AppText
              variant="label"
              tone="secondary"
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
            >
              {label}
            </AppText>
          </Animated.View>
        </>
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
  const styles = useStyles(
    (themeColors) => getStyles(themeColors, layout),
    [layout],
  );

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(spacing.sm, insets.bottom) },
      ]}
    >
      {tabs.map((tab) => (
        <MemoBottomNavItem
          key={tab.key}
          tabKey={tab.key}
          label={t(tab.labelKey)}
          active={tab.key === activeTab}
          isAction={Boolean(tab.action)}
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
      // The body colour, not a raised surface. `surface` against `background` measured 1.08:1
      // in light and 1.10:1 in dark — below the point where anyone reads it as a boundary — so
      // the fill was implying an elevation it never actually conveyed. The rule below was
      // already doing the work at 1.21:1 / 1.49:1, and now does it alone.
      backgroundColor: colors.background,
      // One separator, not two. A shadow is invisible against a dark surface, so the
      // hairline is the divider that actually works in both themes.
      //
      // `divider` rather than `border`, because this is now the ONLY thing dividing the bar
      // from the content above it: in light theme `border` is 1.21:1 against the body, faint
      // enough that the tabs read as loose at the foot of the page.
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      // Paired with indicatorBarWrap's `top`, which negates it exactly so the bar lands on the
      // rule. Changing one without the other detaches the bar from the divider.
      paddingTop: spacing.xs,
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
    // Sits flush under the container's top rule: the cell begins spacing.sm below it, so -sm
    // puts the bar exactly on the divider and the selected tab reads as a thickened segment of
    // it. The wrapper exists purely to centre a fixed-width child inside a flex:1 cell.
    indicatorBarWrap: {
      position: "absolute",
      top: -spacing.xs,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    indicatorBar: {
      width: 24,
      height: 3,
      borderRadius: radius.pill,
      backgroundColor: colors.tabActiveForeground,
    },
    // 28, not 32: the glyph inside is 24dp, so 32 was carrying 4dp of slack above and below
    // it. The pill and ghost pill fill this box and follow it down. Content is now
    // 28 + gap 4 + label 18 = 50dp, which is also the Pressable — 6dp clear of control.target.
    indicator: {
      width: 64,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    // 44 wide inside the 64dp indicator, not the full width of it. As a pale gold wash a
    // 64x32 capsule read as a tint; filled near-black it reads as a slab, and the icon inside
    // it is only 24dp. 44 leaves 10dp of chip either side of the glyph — still unmistakably a
    // pill, ~31% less ink. Absolute with no insets, so Yoga still centres it on the indicator's
    // own alignment and the badge keeps its 64dp-relative anchor.
    pill: {
      position: "absolute",
      width: 44,
      height: 28,
      borderRadius: radius.pill,
      // Its own role rather than brandSoft: this is the only brandSoft fill in the app with no
      // `brand` border beside it, so it is the only one that has to carry a selection on
      // contrast alone — and against the body colour brandSoft could not. Light theme takes it
      // all the way to a dark chip; dark theme keeps the soft gold.
      backgroundColor: colors.tabActiveBackground,
    },
    // Same box as the pill: the press state and the selected state have to be the same shape,
    // or tapping a tab changes the indicator's size as well as its colour.
    ghostPill: {
      position: "absolute",
      width: 44,
      height: 28,
      borderRadius: radius.pill,
      backgroundColor: colors.tabPressedBackground,
    },
    // Centred on the icon's top-right corner inside the 64dp indicator. At the default `md`
    // size it was as wide as the icon itself and covered 55% of the bag; an `sm` badge here
    // overlaps 38%, which is the usual corner tuck. The ring in the bar's own fill colour
    // cuts it away from the glyph so both stay legible.
    //
    // Which means it tracks the container: left on `surface` after the bar moved to
    // `background` it would stop matching what it is punched out of and read as a pale halo.
    badge: {
      position: "absolute",
      top: 0,
      right: 11,
      borderWidth: 2,
      borderColor: colors.background,
    },
    // Selected, the badge sits on the pill rather than on the body — so the ring follows it,
    // or it stops being a cut-out and becomes a pale halo.
    badgeOnPill: {
      borderColor: colors.tabActiveBackground,
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
      // Wins over the "secondary" tone above: AppText renders [base, style]. Shares the glyph's
      // role: with no pill in light theme both sit on the background, and in dark theme gold
      // clears the pill (6.79:1) and the background (9.33:1) alike.
      color: colors.tabActiveForeground,
    },
  });
