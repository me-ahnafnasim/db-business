import { memo, useEffect, useRef } from "react";

import Feather from "@expo/vector-icons/Feather";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { duration, spacing, useStyles, useTheme } from "../../../theme";
import { AppText } from "../../../ui";

// One question in the Help Center, collapsed by default.
//
// The answer is mounted only while open rather than animated to a height: a height
// transition cannot run on the native driver, and measuring Bangla text — which wraps to a
// different number of lines than the English — would mean an onLayout pass per item. Only
// the chevron animates, and it animates a transform, so it stays off the JS thread.

function FaqItem({ question, answer, open, onToggle, showDivider }) {
  const { colors } = useTheme();
  const styles = useStyles(getStyles);
  const reducedMotion = useReducedMotion();
  const spin = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    const target = open ? 1 : 0;
    if (reducedMotion) {
      spin.setValue(target);
      return undefined;
    }
    const animation = Animated.timing(spin, {
      toValue: target,
      duration: duration.fast,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [open, reducedMotion, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <View style={[styles.item, showDivider && styles.divided]}>
      <Pressable
        onPress={onToggle}
        style={styles.header}
        android_ripple={{ color: colors.surfaceSoft }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={question}
      >
        <AppText variant="bodyStrong" style={styles.question}>
          {question}
        </AppText>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Feather name="chevron-down" size={20} color={colors.textSecondary} />
        </Animated.View>
      </Pressable>

      {open ? (
        <AppText variant="bodySm" tone="secondary" style={styles.answer}>
          {answer}
        </AppText>
      ) : null}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    item: {
      overflow: "hidden",
    },
    divided: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      // A 48dp row before the label wraps, so the whole question is the tap target.
      paddingVertical: spacing.md + 2,
    },
    question: {
      flex: 1,
    },
    answer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
  });

export default memo(FaqItem);
