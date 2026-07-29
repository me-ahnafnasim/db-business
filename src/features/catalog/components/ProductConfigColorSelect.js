import Feather from "@expo/vector-icons/Feather";
import { memo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { hitSlop, radius, spacing, useStyles, useTheme } from "../../../theme";
import { AppText, Dialog, SelectionCard } from "../../../ui";

// Which colour a single size in the pack is ordered in.
//
// The pack used to divide each size evenly across every selected colour, so the buyer had no
// say in it: picking Black and Navy for 2 dozen always produced half of every size in each.
// This is the control that makes it explicit — one colour per size row.
//
// A pressable field that opens a dialog rather than a true inline dropdown: React Native has
// no <select>, and a floating anchored menu would have to measure and reposition itself
// against the scroll view. Dialog + SelectionCard already exist and already carry the radio
// semantics, so the choice is announced properly instead of being conveyed by a tick alone.

function ProductConfigColorSelect({
  value,
  options,
  onChange,
  sizeLabel,
  disabled = false,
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);
  const selectedLabel =
    selected?.label ?? t("product_configurator.choose_color");

  return (
    <View style={styles.wrap}>
      <AppText variant="bodySm" tone="secondary" style={styles.label}>
        {t("product_configurator.color")}
      </AppText>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        hitSlop={hitSlop.sm}
        accessibilityRole="button"
        // Names the row it belongs to. Without the size, every field on the screen announces
        // itself identically and the list becomes unusable by voice.
        accessibilityLabel={t("product_configurator.color_for_size", {
          size: sizeLabel,
          color: selectedLabel,
        })}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.field,
          pressed && !disabled && styles.fieldPressed,
        ]}
      >
        <AppText variant="bodySm" style={styles.value} numberOfLines={1}>
          {selectedLabel}
        </AppText>
        <Feather name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>

      <Dialog
        visible={open}
        onDismiss={() => setOpen(false)}
        accessibilityLabel={t("product_configurator.choose_color")}
      >
        <AppText variant="bodyStrong">
          {t("product_configurator.choose_color")}
        </AppText>
        <AppText variant="caption" tone="secondary" style={styles.dialogHint}>
          {t("product_configurator.color_for_size_hint", { size: sizeLabel })}
        </AppText>
        {options.map((option) => (
          <SelectionCard
            key={option.value}
            title={option.label}
            selected={option.value === value}
            onPress={() => {
              onChange(option.value);
              setOpen(false);
            }}
          />
        ))}
      </Dialog>
    </View>
  );
}

export default memo(ProductConfigColorSelect);

const getStyles = (colors) =>
  StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    label: {
      flexShrink: 0,
    },
    // Takes the rest of the row. The colour name is the variable-length part, so it gets the
    // slack and the chevron stays pinned to the right edge.
    field: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    fieldPressed: {
      borderColor: colors.brand,
    },
    value: {
      flex: 1,
    },
    dialogHint: {
      marginTop: spacing.xs,
    },
  });
