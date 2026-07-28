import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";

import { useStyles } from "../theme";

// Scrollable content that stays usable with the keyboard open.
//
// The app had zero KeyboardAvoidingView and zero keyboardShouldPersistTaps anywhere, so
// on the two long forms the keyboard covered the submit button and the first tap on any
// control merely dismissed the keyboard.
//
// Android is deliberately given no `behavior`: the manifest's adjustResize already
// shrinks the window, and adding "padding" on top double-adjusts and makes the layout
// visibly jump.

export default function KeyboardAwareScreen({
  contentContainerStyle,
  style,
  children,
  ...rest
}) {
  const styles = useStyles(getStyles);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = () =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
  });
