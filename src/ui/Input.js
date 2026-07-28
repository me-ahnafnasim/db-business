import { forwardRef } from "react";
import { StyleSheet, TextInput } from "react-native";

import { control, radius, spacing, useStyles, useTheme } from "../theme";

// Themed text input: surface, border, error state and font scaling in one place.
//
// Keyboard behaviour is deliberately NOT defaulted here. returnKeyType, onSubmitEditing
// and autoCapitalize change how a field behaves, so each form opts in explicitly rather
// than inheriting a silent change. `minHeight` rather than `height` lets Bangla's taller
// line box grow the field instead of clipping inside it.

const Input = forwardRef(function Input({ error = false, editable = true, style, ...rest }, ref) {
  const styles = useStyles(getStyles);
  const { colors } = useTheme();

  return (
    <TextInput
      ref={ref}
      editable={editable}
      placeholderTextColor={colors.textSecondary}
      maxFontSizeMultiplier={1.4}
      style={[styles.base, error && styles.error, !editable && styles.disabled, style]}
      {...rest}
    />
  );
});

export default Input;

const getStyles = (colors, type) =>
  StyleSheet.create({
    base: {
      minHeight: control.input,
      borderRadius: radius.input,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      color: colors.textPrimary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: type.input.fontSize,
    },
    error: {
      borderColor: colors.errorBorder,
      backgroundColor: colors.errorSoft,
    },
    disabled: {
      color: colors.textDisabled,
    },
  });
