import { useEffect, useRef } from "react";

import Feather from "@expo/vector-icons/Feather";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { duration, radius, spacing, useStyles, useTheme } from "../../../theme";
import { AppText, Button, Dialog, SummaryRows } from "../../../ui";
import { formatBdt } from "../../../utils/money";
import ConfettiBurst from "./ConfettiBurst";

// The celebration shown the moment an order lands.
//
// Placing an order used to be silent: the checkout stack was swapped for the confirmation
// screen with no transition and "Order placed successfully" rendered as plain h2 text, so
// the most important moment in the app looked no different from the review screen before it.
//
// This sits over the confirmation screen rather than replacing it — dismissing reveals the
// full order details underneath, unchanged.

const MEDALLION = 76;

// The medallion lands after the card has arrived, so the two do not compete; the ring is a
// single expanding pulse behind it, and the copy follows once the eye is already on the tick.
const MEDALLION_SPRING = { friction: 5, tension: 170, delay: 120, useNativeDriver: true };
const RING_DELAY = 200;
const COPY_DELAY = 220;

export default function OrderSuccessDialog({ visible, order, onDismiss }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const reducedMotion = useReducedMotion();

  const medallion = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const copy = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      medallion.setValue(0);
      ring.setValue(0);
      copy.setValue(0);
      return undefined;
    }
    if (reducedMotion) {
      // The end state, immediately — same tick, same copy, just no motion. The ring is a
      // pure flourish and its end state is invisible, so it stays at 0.
      medallion.setValue(1);
      copy.setValue(1);
      return undefined;
    }
    const animation = Animated.parallel([
      Animated.spring(medallion, { toValue: 1, ...MEDALLION_SPRING }),
      Animated.timing(ring, {
        toValue: 1,
        duration: duration.celebrate - RING_DELAY,
        delay: RING_DELAY,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(copy, {
        toValue: 1,
        duration: duration.slow,
        delay: COPY_DELAY,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [visible, reducedMotion, medallion, ring, copy]);

  if (!order) return null;

  const medallionScale = medallion.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [0.9, 2.1] });
  const ringOpacity = ring.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 0.5, 0],
    extrapolate: "clamp",
  });
  const copyTranslate = copy.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  const title = t("confirmation.celebrationTitle");
  const body = t("confirmation.celebrationBody");

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      accessibilityLabel={`${title} ${body}`}
    >
      <View style={styles.medallionZone}>
        <ConfettiBurst />
        <Animated.View
          style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          pointerEvents="none"
        />
        <Animated.View style={[styles.medallion, { transform: [{ scale: medallionScale }] }]}>
          <Feather name="check" size={38} color={colors.onBrand} />
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: copy, transform: [{ translateY: copyTranslate }] }}>
        <AppText variant="h2" tone="brand" style={styles.title}>
          {title}
        </AppText>
        <AppText variant="bodySm" tone="secondary" style={styles.body}>
          {body}
        </AppText>

        <SummaryRows
          rows={[
            { label: t("confirmation.orderNumber"), value: order.id },
            { label: t("confirmation.total"), value: formatBdt(order.total, language) },
          ]}
          style={styles.rows}
        />

        <Button title={t("confirmation.viewOrderDetails")} onPress={onDismiss} size="lg" />
      </Animated.View>
    </Dialog>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    // Reserves the confetti's airspace. Without a fixed height the burst would size the
    // zone to the medallion and the particles would have nowhere to land.
    medallionZone: {
      height: MEDALLION + spacing.x4,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg,
    },
    ring: {
      position: "absolute",
      width: MEDALLION,
      height: MEDALLION,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: colors.brand,
    },
    medallion: {
      width: MEDALLION,
      height: MEDALLION,
      borderRadius: radius.pill,
      backgroundColor: colors.brand,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      textAlign: "center",
    },
    body: {
      textAlign: "center",
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
    },
    rows: {
      backgroundColor: colors.surfaceSoft,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      // SummaryRows gives every row a bottom margin, so the box only needs padding on top.
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
      marginBottom: spacing.xl,
    },
  });
