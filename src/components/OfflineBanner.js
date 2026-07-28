import { useEffect, useRef } from "react";

import Feather from "@expo/vector-icons/Feather";
import { Animated, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { duration, radius, spacing, useStyles, useTheme } from "../theme";
import { AppText } from "../ui";

// A connectivity notice pinned to the top of the app.
//
// Top rather than bottom on purpose: the bottom already carries the mutation-error banner
// and the tab bar, and — more importantly — this has to be visible during checkout, which
// renders as a full-screen overlay above the tabs. Losing signal on the payment screen is
// exactly when someone needs to be told it is their connection and not their order.
//
// Stays mounted and animates in both directions rather than unmounting, so leaving does not
// snap. `pointerEvents="none"` throughout: it is a notice, never a control, and it must not
// swallow a tap meant for the header underneath it.

export default function OfflineBanner({ visible }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useStyles(getStyles);
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    const target = visible ? 1 : 0;
    if (reducedMotion) {
      progress.setValue(target);
      return undefined;
    }
    const animation = Animated.timing(progress, {
      toValue: target,
      duration: duration.base,
      // Opacity and transform only, so this runs on the native thread. A height or a
      // `top` here would pin it to JS.
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, reducedMotion, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-72, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.banner,
        { top: insets.top + spacing.sm, opacity: progress, transform: [{ translateY }] },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Feather name="wifi-off" size={16} color={colors.onWarning} />
      <AppText variant="bodySm" style={styles.text} numberOfLines={2}>
        {t("network.offline")}
      </AppText>
    </Animated.View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    banner: {
      position: "absolute",
      left: spacing.lg,
      right: spacing.lg,
      // Above the checkout stack overlay (10) so it survives a pushed screen, but below the
      // opaque full-screen status overlay (30), which already explains a total load failure.
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.warning,
    },
    text: {
      flex: 1,
      color: colors.onWarning,
      fontWeight: "600",
    },
  });
