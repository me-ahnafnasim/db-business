import Feather from "@expo/vector-icons/Feather";
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { radius, spacing, useStyles, useTheme } from "../../../theme";
import { AppText, IconButton, Input } from "../../../ui";

// One size's share of the dozen.
//
// The pairs across all selected sizes must add up to exactly the pack size, with a minimum
// in each size — so this is a budget allocation, not free numeric entry. The steppers keep
// every tap inside the valid range, and the number itself stays a real input so a customer
// who wants an uneven split can still type it.
//
// Laid out as a full-width row rather than a two-up grid. Two 36dp buttons plus a number
// simply do not fit in half a phone's width: at 320dp the field collapsed to 12dp of text
// area, and at 360dp to 31dp. A row keeps the control the same size on every device and
// only costs vertical space, which scrolls.

function ProductConfigPairStepper({
  size,
  value,
  min,
  remaining,
  onChange,
  invalid = false,
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  const label = `${t("catalog.size")} ${size}`;
  const canDecrease = value > min;
  const canIncrease = remaining > 0;

  return (
    <View style={[styles.row, invalid && styles.rowInvalid]}>
      <AppText variant="bodySm" style={styles.label} numberOfLines={1}>
        {label}
      </AppText>
      <View style={styles.stepper}>
        <IconButton
          label={t("cart.decrease", { name: label })}
          onPress={() => onChange(size, value - 1)}
          disabled={!canDecrease}
          size="md"
          tone="bordered"
        >
          <Feather name="minus" size={16} color={colors.textPrimary} />
        </IconButton>
        <Input
          value={String(value)}
          onChangeText={(raw) => {
            // Empty is treated as 0 so the field can be cleared while editing; the parent
            // clamps to whatever budget is actually left. Three digits because the budget is
            // 12 x quantity, so a single size can legitimately exceed 99.
            const digits = raw.replace(/[^0-9]/g, "").slice(0, 3);
            onChange(size, digits === "" ? 0 : Number(digits));
          }}
          keyboardType="number-pad"
          accessibilityLabel={label}
          error={invalid}
          style={styles.input}
        />
        <IconButton
          label={t("cart.increase", { name: label })}
          onPress={() => onChange(size, value + 1)}
          disabled={!canIncrease}
          size="md"
          tone="bordered"
        >
          <Feather name="plus" size={16} color={colors.textPrimary} />
        </IconButton>
      </View>
    </View>
  );
}

export default memo(ProductConfigPairStepper);

const getStyles = (colors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    rowInvalid: {
      borderColor: colors.errorBorder,
    },
    // Takes the slack, so a long size code truncates rather than squeezing the stepper.
    label: {
      flex: 1,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flexShrink: 0,
    },
    input: {
      width: 52,
      minHeight: 40,
      borderRadius: radius.xs,
      borderWidth: 0,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.sm,
      textAlign: "center",
      fontWeight: "800",
    },
  });
