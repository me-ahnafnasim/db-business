import { StyleSheet, View } from "react-native";

import { spacing, useStyles } from "../theme";
import AppText from "./AppText";
import Card from "./Card";

// A card that behaves as a radio option. Replaces the hand-rolled radio row written twice
// in the shipping screen plus the separate selection affordances in the shipping-option
// and payment-method cards.
//
// Exposes accessibilityRole="radio" with selected state, so the choice is not conveyed by
// border colour alone.

export default function SelectionCard({
  selected = false,
  onPress,
  title,
  description,
  trailing = null,
  accessibilityLabel,
  style,
  children,
  ...rest
}) {
  const styles = useStyles(getStyles);

  return (
    <Card
      selected={selected}
      onPress={onPress}
      style={[styles.card, style]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? title}
      {...rest}
    >
      <View style={styles.row}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.dot} /> : null}
        </View>
        <View style={styles.body}>
          {title ? <AppText variant="bodyStrong">{title}</AppText> : null}
          {description ? (
            <AppText variant="bodySm" tone="secondary" style={styles.description}>
              {description}
            </AppText>
          ) : null}
          {children}
        </View>
        {trailing}
      </View>
    </Card>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      marginTop: spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    radioSelected: {
      borderColor: colors.brand,
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.brand,
    },
    body: {
      flex: 1,
    },
    description: {
      marginTop: spacing.xs,
    },
  });
