import { useEffect, useMemo, useRef } from "react";

import { Animated, Easing, StyleSheet, View } from "react-native";

import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { duration, radius, useTheme } from "../../../theme";

// A one-shot confetti spray, in core Animated only.
//
// No particle library is installed and adding one would mean a native rebuild — this is a
// dev-client/EAS setup, not Expo Go. It is not needed: LaunchScreen already ships a 20-node
// staggered native-driven animation with the same technique.
//
// ONE Animated.Value drives all fourteen particles. Each particle instead gets its own
// shifted inputRange, so a particle with delay 0.2 simply reads nothing from the driver
// until the driver passes 0.2. Fourteen separate values would be fourteen native animations
// to schedule and stop for no visible difference.

const PARTICLE_COUNT = 14;
// Bounded so the spray stays inside the dialog card on the narrowest phone we support
// (320dp screen -> 272dp of card content). Android clips children to a rounded background
// in some configurations, so a burst that relied on spilling out would look different per
// device; this one never leaves the card.
const SPREAD = 112; // widest horizontal reach, dp
const RISE = 52; // how far a particle climbs before gravity takes it
const FALL = 168;

// Deterministic pseudo-jitter. Math.random() here would reshuffle the spray on every
// re-render of the parent, so the table is derived from the index and then frozen in a ref.
const wobble = (index, modulus) => ((index * 37) % modulus) / modulus;

function buildParticles(colors) {
  // Every colour is an existing token. Literal hexes here would trip `npm run check:tokens`,
  // and more to the point the confetti should shift with the theme like everything else.
  const palette = [colors.brand, colors.sale, colors.success, colors.brandPressed, colors.saleBorder];

  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    // Fan across a half-circle: t=0 throws right, t=1 throws left.
    const t = (i + 0.5) / PARTICLE_COUNT;
    const angle = Math.PI * t;
    const reach = 0.55 + wobble(i, 11) * 0.6;

    // Start fraction along the shared driver. Five stagger buckets, so the spray leaves in
    // waves rather than as one wall.
    const start = (i % 5) * 0.05;

    return {
      key: `confetti-${i}`,
      x: Math.cos(angle) * SPREAD * reach,
      rise: RISE * (0.6 + wobble(i, 7) * 0.7),
      fall: FALL + wobble(i, 13) * 70,
      start,
      size: 6 + Math.round(wobble(i, 5) * 4),
      spin: i % 2 ? 900 : -720,
      color: palette[i % palette.length],
      round: i % 3 === 0,
    };
  });
}

function Particle({ particle, driver, styles }) {
  const { start } = particle;
  const span = 1 - start;

  // Every inputRange below is strictly increasing and begins at `start`, so the particle
  // holds at its origin until the shared driver reaches its wave.
  const translateX = driver.interpolate({
    inputRange: [start, start + span * 0.3, 1],
    // Most of the horizontal travel happens early, which is what makes it read as thrown
    // rather than blown.
    outputRange: [0, particle.x * 0.72, particle.x],
    extrapolate: "clamp",
  });
  const translateY = driver.interpolate({
    inputRange: [start, start + span * 0.34, 1],
    outputRange: [0, -particle.rise, particle.fall],
    extrapolate: "clamp",
  });
  const rotate = driver.interpolate({
    inputRange: [start, 1],
    outputRange: ["0deg", `${particle.spin}deg`],
    extrapolate: "clamp",
  });
  const opacity = driver.interpolate({
    inputRange: [start, start + span * 0.08, start + span * 0.62, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: "clamp",
  });
  const scale = driver.interpolate({
    inputRange: [start, start + span * 0.2, 1],
    outputRange: [0.4, 1, 0.85],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.round ? particle.size : particle.size * 1.6,
          borderRadius: particle.round ? radius.pill : 2,
          backgroundColor: particle.color,
          opacity,
          transform: [{ translateX }, { translateY }, { rotate }, { scale }],
        },
      ]}
    />
  );
}

export default function ConfettiBurst({ style }) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const driver = useRef(new Animated.Value(0)).current;

  // Frozen once per theme. The table is pure geometry apart from the colours, so it only
  // needs rebuilding when the palette flips.
  const particles = useMemo(() => buildParticles(colors), [colors]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const animation = Animated.timing(driver, {
      toValue: 1,
      duration: duration.celebrate,
      // Linear on purpose: the arc and the easing both live in the interpolations above,
      // so easing here as well would double-apply it.
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [driver, reducedMotion]);

  // Reduced motion gets no confetti at all. Unlike the rest of the dialog there is no
  // meaningful end state to snap to — a still frame of scattered dots is just clutter.
  if (reducedMotion) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {particles.map((particle) => (
        <Particle key={particle.key} particle={particle} driver={driver} styles={styles} />
      ))}
    </View>
  );
}

// Not themed — the particles carry their own colours and everything else is geometry, so
// this sheet is built once at module scope rather than per theme.
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
  },
});
