import { Component, Fragment } from "react";

import Feather from "@expo/vector-icons/Feather";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { lightColors } from "../theme/colors";
import { radius, spacing } from "../theme/tokens";
import { getTypography } from "../theme/typography";

// The app's only class component, because catching a render error still requires one.
//
// Before this existed, a throw anywhere unmounted the whole tree to a blank screen with no
// dialog, no restart path and no report. The entire app renders inside one MainTabs subtree,
// so a throw in any single screen took the tab bar with it and the user's only recourse was
// to force-quit.
//
// It is mounted OUTERMOST, above AuthProvider/LanguageProvider/ThemeProvider, so it also
// catches a provider blowing up during start-up. That placement is why it cannot use any of
// them:
//
//   - no useTheme     -> `lightColors` is imported directly; colors.js is a plain module and
//                        is safe to read when no context exists. Light, because that is now
//                        the app's default theme — a dark crash screen would be the one
//                        black surface in an otherwise white app.
//   - no useTranslation -> the copy is bilingual and inline. A crash screen that renders in
//                        the wrong language is worse than one that renders in both, and the
//                        language provider is one of the things this is here to catch.
//
// Retry remounts the subtree by changing the Fragment's key, which is a real remount rather
// than a re-render — component state that caused the throw is discarded with it.

const BILINGUAL = {
  title: { bn: "কিছু একটা ভুল হয়েছে", en: "Something went wrong" },
  body: {
    bn: "অ্যাপটি অপ্রত্যাশিত সমস্যায় পড়েছে। আবার চেষ্টা করুন।",
    en: "The app hit an unexpected problem. Please try again.",
  },
  retry: { bn: "আবার চেষ্টা করুন", en: "Try again" },
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, componentStack: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ componentStack: info?.componentStack ?? null });
    // The single place a crash reporter would be wired in. There is no SDK installed —
    // adding one needs a DSN — so for now this is the only record a crash leaves.
    console.error("[ErrorBoundary]", error, info?.componentStack);
    this.props.onError?.(error, info);
  }

  handleRetry = () => {
    this.setState((state) => ({
      error: null,
      componentStack: null,
      resetKey: state.resetKey + 1,
    }));
  };

  render() {
    const { error, componentStack, resetKey } = this.state;

    if (!error) {
      return <Fragment key={resetKey}>{this.props.children}</Fragment>;
    }

    return (
      <View style={styles.container}>
        <View style={styles.badge}>
          <Feather name="alert-triangle" size={34} color={lightColors.brand} />
        </View>

        <Text style={styles.title}>{BILINGUAL.title.bn}</Text>
        <Text style={styles.titleEn}>{BILINGUAL.title.en}</Text>

        <Text style={styles.bodyBn}>{BILINGUAL.body.bn}</Text>
        <Text style={styles.bodyEn}>{BILINGUAL.body.en}</Text>

        <Pressable
          onPress={this.handleRetry}
          accessibilityRole="button"
          accessibilityLabel={BILINGUAL.retry.en}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonLabel}>
            {BILINGUAL.retry.bn} · {BILINGUAL.retry.en}
          </Text>
        </Pressable>

        {/* Development only. In release the stack is noise the user cannot act on, and it
            can leak internals; the console.error above is what carries it instead. */}
        {__DEV__ ? (
          <ScrollView style={styles.debug} contentContainerStyle={styles.debugContent}>
            <Text style={styles.debugText}>{String(error?.stack || error?.message || error)}</Text>
            {componentStack ? <Text style={styles.debugText}>{componentStack}</Text> : null}
          </ScrollView>
        ) : null}
      </View>
    );
  }
}

// Not routed through useStyles: that hook reads the theme context this component sits above.
// `getTypography` is a pure lookup into a cache built at module load, not a hook, so the
// Bangla and English lines still get their own correct leading without a LanguageProvider.
const BN = getTypography("bn");
const EN = getTypography("en");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.x4,
    backgroundColor: lightColors.background,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightColors.brandSoft,
    marginBottom: spacing.xxl,
  },
  title: {
    ...BN.h3,
    textAlign: "center",
    color: lightColors.textPrimary,
  },
  titleEn: {
    ...EN.h4,
    textAlign: "center",
    color: lightColors.textPrimary,
    marginBottom: spacing.md,
  },
  bodyBn: {
    ...BN.bodySm,
    textAlign: "center",
    color: lightColors.textSecondary,
  },
  bodyEn: {
    ...EN.bodySm,
    textAlign: "center",
    color: lightColors.textSecondary,
  },
  button: {
    marginTop: spacing.x4,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.button,
    backgroundColor: lightColors.brand,
  },
  buttonPressed: {
    backgroundColor: lightColors.brandPressed,
  },
  buttonLabel: {
    ...EN.bodyStrong,
    color: lightColors.onBrand,
  },
  debug: {
    alignSelf: "stretch",
    maxHeight: 220,
    marginTop: spacing.xxl,
  },
  debugContent: {
    padding: spacing.md,
  },
  debugText: {
    ...EN.micro,
    fontWeight: "400",
    color: lightColors.muted,
  },
});
