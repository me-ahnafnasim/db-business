// AntDesign is loaded for exactly one glyph — the Google mark on the sign-in button.
// It costs ~130 KB, and it is kept on purpose: Google's Sign-In branding guidelines
// require the official mark, so substituting a generic icon is not an option. Every
// other family (MaterialCommunityIcons 1.31 MB, Ionicons 390 KB, SimpleLineIcons 54 KB)
// has been collapsed into Feather. Do not add a second family without the same scrutiny.
import AntDesign from "@expo/vector-icons/AntDesign";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import LanguageToggle from "../components/LanguageToggle";
import { useBackHandler } from "../hooks/useBackHandler";
import { useExitConfirm } from "../hooks/useExitConfirm";
import { useLanguage } from "../i18n/LanguageProvider";
import { radius, spacing } from "../theme";

const BRAND_TEXT = "NoboSole";
const NOBO_COUNT = 4;

// The launch screen is a fixed dark brand surface: it renders identically whichever theme
// is active, so it deliberately does not consume the palette in src/theme. Every colour it
// uses is collected here rather than scattered through the stylesheet below.
const LAUNCH = {
  backdrop: ["#0a0e27", "#1a1f3a", "#0f1729"],
  nobo: ["#ffd700", "#ffed4e", "#d4af37"],
  sole: ["#00d9ff", "#0099ff", "#0052cc"],
  noboGlow: "rgba(255, 215, 0, 0.5)",
  soleGlow: "rgba(0, 217, 255, 0.5)",
  shoeGlow: "rgba(212, 175, 55, 0.4)",
  textPrimary: "#e8e8e8",
  textSecondary: "#b0bac9",
  textMuted: "#64748b",
  error: "#ef4444",
  google: "#4285F4",
  buttonFill: "rgba(212, 175, 55, 0.08)",
  buttonBorder: "rgba(212, 175, 55, 0.3)",
  buttonFillPressed: "rgba(212, 175, 55, 0.15)",
  buttonBorderPressed: "rgba(212, 175, 55, 0.6)",
  rule: "rgba(212, 175, 55, 0.2)",
};

const NOBO_COLORS = LAUNCH.nobo;
const SOLE_COLORS = LAUNCH.sole;

function SmokeChar({ char, index, isNobo, compact, reduceMotion }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(-30)).current;
  const color = isNobo ? NOBO_COLORS[index % NOBO_COLORS.length] : SOLE_COLORS[(index - NOBO_COUNT) % SOLE_COLORS.length];
  const glowColor = isNobo ? LAUNCH.noboGlow : LAUNCH.soleGlow;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      translateX.setValue(0);
      return undefined;
    }
    const delay = 200 + index * 100;

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 800,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, opacity, reduceMotion, translateX, translateY]);

  return (
    <Animated.Text
      style={[
        styles.smokeChar,
        compact && styles.smokeCharCompact,
        {
          color,
          opacity,
          transform: [{ translateY }, { translateX }],
          textShadowColor: glowColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 12,
        },
      ]}
    >
      {char}
    </Animated.Text>
  );
}

function AnimatedShoe({ compact, reduceMotion }) {
  const floatOpacity = useRef(new Animated.Value(0)).current;
  const floatTranslateY = useRef(new Animated.Value(50)).current;
  const floatScale = useRef(new Animated.Value(0.85)).current;
  const bounceY = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(-8)).current;
  const rotateZ = useRef(new Animated.Value(-5)).current;

  useEffect(() => {
    if (reduceMotion) {
      floatOpacity.setValue(1);
      floatTranslateY.setValue(0);
      floatScale.setValue(1);
      bounceY.setValue(0);
      rotateY.setValue(0);
      rotateZ.setValue(0);
      return undefined;
    }

    const intro = Animated.parallel([
      Animated.timing(floatOpacity, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(floatTranslateY, {
        toValue: 0,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(floatScale, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceY, { toValue: -20, duration: 875, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(bounceY, { toValue: 0, duration: 875, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(bounceY, { toValue: -12, duration: 875, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(bounceY, { toValue: 0, duration: 875, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
    intro.start(({ finished }) => {
      if (finished) bounce.start();
    });

    const horizontalRotate = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateY, { toValue: 12, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(rotateY, { toValue: -8, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    horizontalRotate.start();

    const verticalRotate = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateZ, { toValue: 8, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(rotateZ, { toValue: -5, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    verticalRotate.start();

    return () => {
      intro.stop();
      bounce.stop();
      horizontalRotate.stop();
      verticalRotate.stop();
    };
  }, [bounceY, floatOpacity, floatScale, floatTranslateY, reduceMotion, rotateY, rotateZ]);

  return (
    <Animated.View
      style={[
        styles.shoeIconContainer,
        compact && styles.shoeIconContainerCompact,
        {
          opacity: floatOpacity,
          transform: [
            { translateY: Animated.add(floatTranslateY, bounceY) },
            { scale: floatScale },
            { rotateY: rotateY.interpolate({ inputRange: [-8, 12], outputRange: ["-8deg", "12deg"] }) },
            { rotateZ: rotateZ.interpolate({ inputRange: [-5, 8], outputRange: ["-5deg", "8deg"] }) },
          ],
        },
      ]}
    >
      <Text
        style={[styles.shoeEmoji, compact && styles.shoeEmojiCompact]}
        accessibilityRole="image"
        accessibilityLabel={BRAND_TEXT}
      >
        👟
      </Text>
    </Animated.View>
  );
}

function FadeSlideIn({ children, delay, style, reduceMotion }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return undefined;
    }
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1000,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1000,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, opacity, reduceMotion, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export default function LaunchScreen({ onGoogleLogin, onContinueAsGuest, error, loading }) {
  const loginOpacity = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const { t } = useTranslation();
  const { layout } = useLanguage();
  const { height } = useWindowDimensions();
  const compact = height < 700;
  const dynamicStyles = getDynamicStyles(layout);

  // Signed out, so there is nothing to navigate back to — but back should still confirm
  // rather than closing the app outright.
  useBackHandler(useExitConfirm());

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      loginOpacity.setValue(1);
      return undefined;
    }
    const animation = Animated.timing(loginOpacity, {
      toValue: 1,
      duration: 1000,
      delay: 1600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [loginOpacity, reduceMotion]);

  return (
    <LinearGradient colors={LAUNCH.backdrop} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.topBar}>
          <LanguageToggle variant="dark" />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.container, compact && styles.containerCompact]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <AnimatedShoe compact={compact} reduceMotion={reduceMotion} />

          <View style={styles.brandNameRow}>
            {BRAND_TEXT.split("").map((char, index) => (
              <SmokeChar key={`${char}-${index}`} char={char} index={index} isNobo={index < NOBO_COUNT} compact={compact} reduceMotion={reduceMotion} />
            ))}
          </View>

          <FadeSlideIn delay={1200} reduceMotion={reduceMotion}>
            <Text style={[styles.brandSubtitle, dynamicStyles.brandSubtitle]}>{t("launch.subtitle")}</Text>
          </FadeSlideIn>

          <FadeSlideIn delay={1400} style={compact && styles.compactTaglineWrap} reduceMotion={reduceMotion}>
            <Text style={[styles.tagline, compact && styles.taglineCompact, dynamicStyles.tagline]}>{t("launch.tagline")}</Text>
          </FadeSlideIn>

          <Animated.View style={[styles.loginSection, { opacity: loginOpacity }]}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={[styles.dividerText, dynamicStyles.dividerText]}>{t("launch.divider")}</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.premiumBtn,
                dynamicStyles.premiumBtn,
                pressed && styles.premiumBtnPressed,
                loading && styles.premiumBtnDisabled,
              ]}
              onPress={onGoogleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={t("launch.googleSignIn")}
              accessibilityState={{ disabled: loading, busy: loading }}
            >
              <AntDesign name="google" size={24} color={LAUNCH.google} />
              <Text style={styles.btnText}>
                {loading ? t("launch.signingIn") : t("launch.googleSignIn")}
              </Text>
            </Pressable>

            {onContinueAsGuest ? (
              <Pressable
                style={({ pressed }) => [
                  styles.guestBtn,
                  pressed && styles.guestBtnPressed,
                  loading && styles.premiumBtnDisabled,
                ]}
                onPress={onContinueAsGuest}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={t("launch.continueAsGuest")}
                accessibilityState={{ disabled: loading }}
              >
                <Text style={styles.btnText}>{t("launch.continueAsGuest")}</Text>
              </Pressable>
            ) : null}

            {error ? (
              <Text style={styles.errorText} accessibilityLiveRegion="assertive">
                {error}
              </Text>
            ) : null}
          </Animated.View>

          <Text style={[styles.footer, compact && styles.footerCompact]}>{t("launch.footer")}</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getDynamicStyles = (layout) =>
  StyleSheet.create({
    brandSubtitle: {
      letterSpacing: layout.subtitleLetterSpacing,
      lineHeight: layout.bodyLineHeight,
    },
    tagline: {
      letterSpacing: layout.subtitleLetterSpacing,
      lineHeight: layout.bodyLineHeight,
    },
    dividerText: {
      letterSpacing: layout.dividerLetterSpacing,
      flexShrink: 1,
      textAlign: "center",
    },
    premiumBtn: {
      paddingHorizontal: layout.buttonPaddingH,
    },
  });

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    minHeight: 56,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  containerCompact: {
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  shoeIconContainer: {
    width: 160,
    height: 160,
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
    perspective: 1200,
  },
  shoeEmoji: {
    fontSize: 120,
    lineHeight: 130,
    textShadowColor: LAUNCH.shoeGlow,
    textShadowOffset: { width: 0, height: 15 },
    textShadowRadius: 20,
  },
  shoeIconContainerCompact: {
    width: 96,
    height: 96,
    marginBottom: 10,
  },
  shoeEmojiCompact: {
    fontSize: 76,
    lineHeight: 86,
  },
  brandNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  smokeChar: {
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -1,
  },
  smokeCharCompact: {
    fontSize: 38,
  },
  brandSubtitle: {
    fontSize: 14,
    color: LAUNCH.textPrimary,
    fontWeight: "700",
    letterSpacing: 2.5,
    marginTop: 8,
    textAlign: "center",
  },
  tagline: {
    fontSize: 12,
    color: LAUNCH.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 12,
    marginBottom: 48,
    fontWeight: "500",
    textAlign: "center",
  },
  taglineCompact: {
    marginTop: 8,
    marginBottom: 20,
  },
  compactTaglineWrap: {
    alignSelf: "stretch",
  },
  loginSection: {
    width: "100%",
    maxWidth: 420,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: LAUNCH.rule,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: LAUNCH.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  premiumBtn: {
    backgroundColor: LAUNCH.buttonFill,
    borderWidth: 1.5,
    borderColor: LAUNCH.buttonBorder,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    minHeight: 56,
  },
  premiumBtnDisabled: {
    opacity: 0.6,
  },
  premiumBtnPressed: {
    backgroundColor: LAUNCH.buttonFillPressed,
    borderColor: LAUNCH.buttonBorderPressed,
    transform: [{ scale: 0.97 }],
  },
  guestBtn: {
    minHeight: 52,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: LAUNCH.buttonBorder,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  guestBtnPressed: {
    backgroundColor: LAUNCH.buttonFillPressed,
    borderColor: LAUNCH.buttonBorderPressed,
  },
  btnText: {
    color: LAUNCH.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 48,
    fontSize: 10,
    color: LAUNCH.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  footerCompact: {
    marginTop: 24,
  },
  errorText: {
    color: LAUNCH.error,
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
    fontWeight: "500",
  },
});
