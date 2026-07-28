import { useEffect, useRef } from "react";

import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { elevation, radius, spacing, useStyles, useTheme } from "../theme";
import Card from "./Card";

// The app's floating-surface primitive: a dimmed backdrop with a centred card above it.
//
// Nothing in src/ui floated before this. The only Modal in the app was the bespoke
// fullscreen image viewer in ProductGallery, so every future dialog would have started
// from scratch — this is the shared piece it starts from instead.
//
// The entrance is driven here rather than by Modal's own `animationType`, which offers
// only slide/fade for the whole surface and cannot move the card independently of the
// scrim. Everything animated is opacity or transform, so the whole thing runs on the
// native thread; a width or height here would pin it to JS, which is the trap that had
// the banner carousel interpolating its scroll on the JS thread.
const ENTER_SPRING = { friction: 7, tension: 140, useNativeDriver: true };

export default function Dialog({
  visible = false,
  onDismiss,
  dismissOnBackdropPress = true,
  accessibilityLabel,
  contentStyle,
  children,
  ...rest
}) {
  const styles = useStyles(getStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      // Reset while hidden so a second open animates from the start rather than snapping in
      // at its finished state.
      progress.setValue(0);
      return undefined;
    }
    if (reducedMotion) {
      progress.setValue(1);
      return undefined;
    }
    const animation = Animated.spring(progress, { toValue: 1, ...ENTER_SPRING });
    animation.start();
    return () => animation.stop();
  }, [visible, reducedMotion, progress]);

  // Clamped, because the spring settles by overshooting past 1 — welcome on the card's
  // scale, meaningless on the backdrop's opacity.
  const scrimOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const cardOpacity = progress.interpolate({
    inputRange: [0, 0.6],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const cardTranslate = progress.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const cardScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Modal
      visible={visible}
      transparent
      // Our own entrance runs instead; Modal's would fight it.
      animationType="none"
      // Lets the scrim reach under the status bar on Android, so the dim is edge to edge.
      statusBarTranslucent
      // Android hardware back. Android delivers it here before the app's BackHandler
      // listeners, so back closes the dialog and only later falls through to the app's
      // own back ladder — which is exactly the order we want.
      onRequestClose={onDismiss}
      {...rest}
    >
      <View
        style={[
          styles.root,
          {
            paddingTop: Math.max(insets.top, spacing.gutter),
            paddingBottom: Math.max(insets.bottom, spacing.gutter),
          },
        ]}
      >
        <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]} pointerEvents="none" />

        {dismissOnBackdropPress ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onDismiss}
            // A backdrop is a shortcut, not a control. Screen readers get the dialog's own
            // dismiss action instead of an unlabelled full-screen button.
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null}

        <Animated.View
          style={[
            styles.animator,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslate }, { scale: cardScale }] },
          ]}
          accessibilityViewIsModal
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={accessibilityLabel}
        >
          <Card style={[styles.card, elevation(3, colors.shadow), contentStyle]} padded={false}>
            {children}
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.gutter,
    },
    // `overlay`, not `scrim`. The latter is the theme-independent value the fullscreen
    // image viewer needs; this one follows the theme, as a dialog backdrop should.
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    animator: {
      width: "100%",
      // A dialog that grows to a tablet's full width stops reading as a dialog.
      maxWidth: 420,
    },
    card: {
      // One step rounder than a content card, so it reads as lifted off the page rather
      // than as another row in it.
      borderRadius: radius.xl,
      padding: spacing.xxl,
    },
  });
