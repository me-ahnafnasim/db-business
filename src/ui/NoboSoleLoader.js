import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { loaderColors } from "../theme/colors";
import { radius, spacing, useStyles } from "../theme";

const BRAND_LETTERS = [..."NoboSole"];
const CYCLE_MS = 2000;
const STAGGER_MS = 120;
const KEYFRAMES = [0, 0.4, 0.55, 0.7, 0.85, 1];

function AnimatedLetter({ letter, index, letterSize, letterStyles, reducedMotion }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      // The 70% keyframe is the settled, fully visible state.
      progress.setValue(0.7);
      return undefined;
    }

    progress.setValue(0);
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true }
    );
    const startTimer = setTimeout(() => animation.start(), index * STAGGER_MS);

    return () => {
      clearTimeout(startTimer);
      animation.stop();
    };
  }, [index, progress, reducedMotion]);

  const opacity = progress.interpolate({
    inputRange: KEYFRAMES,
    outputRange: [0, 1, 1, 1, 1, 0],
    extrapolate: "clamp",
  });
  const translateY = progress.interpolate({
    inputRange: KEYFRAMES,
    outputRange: [60, -10, 3, 0, 0, -35],
    extrapolate: "clamp",
  });
  const scale = progress.interpolate({
    inputRange: KEYFRAMES,
    outputRange: [0.3, 1.12, 0.95, 1, 1, 0.8],
    extrapolate: "clamp",
  });
  const rotate = progress.interpolate({
    inputRange: KEYFRAMES,
    outputRange: ["-15deg", "3deg", "-1deg", "0deg", "0deg", "5deg"],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }, { scale }, { rotate }],
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <LinearGradient
        colors={[loaderColors.letterStart, loaderColors.letterEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          letterStyles.letterButton,
          {
            width: letterSize,
            height: letterSize,
          },
        ]}
      >
        <Animated.Text style={letterStyles.letterText} allowFontScaling={false}>
          {letter}
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function NoboSoleLoader({ accessibilityLabel = "NoboSole Loading", style }) {
  const styles = useStyles(getStyles);
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const compact = width < 520;
  const narrow = width < 360;
  const horizontalGutter = spacing.x4;
  const trayPadding = narrow ? spacing.md : compact ? spacing.lg : spacing.x4;
  const letterGap = narrow ? spacing.xs : compact ? spacing.sm : spacing.sm + 2;
  const availableForLetters = width - horizontalGutter - (trayPadding * 2) - (letterGap * 7);
  const letterSize = Math.max(28, Math.min(48, Math.floor(availableForLetters / BRAND_LETTERS.length)));

  return (
    <View
      style={[styles.root, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
    >
      <View
        style={[
          styles.tray,
          {
            gap: letterGap,
            paddingHorizontal: trayPadding,
            paddingVertical: compact ? spacing.lg : spacing.xxl,
          },
        ]}
      >
        {BRAND_LETTERS.map((letter, index) => (
          <AnimatedLetter
            key={`${letter}-${index}`}
            letter={letter}
            index={index}
            letterSize={letterSize}
            letterStyles={styles}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
    </View>
  );
}

const getStyles = (_colors, typography) =>
  StyleSheet.create({
    root: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: loaderColors.background,
      paddingHorizontal: spacing.lg,
    },
    tray: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    letterButton: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      shadowColor: loaderColors.shadow,
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    letterText: {
      ...typography.h3,
      color: loaderColors.letterText,
    },
  });
