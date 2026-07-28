import { memo } from "react";

import { StyleSheet, View } from "react-native";

import { radius, spacing, useStyles } from "../theme";
import AppText from "./AppText";

// Count bubble for the cart icon. Previously written twice at different sizes — 18dp
// with 9px text in the header, 22dp with 11px in the tab bar. Uses minHeight rather than
// a fixed height so Bangla numerals cannot clip.

function Badge({ count = 0, max = 99, tone = "danger", size = "md", style, ...rest }) {
  const styles = useStyles(getStyles);
  if (!count) return null;

  return (
    <View style={[styles.base, styles[`size_${size}`], styles[`tone_${tone}`], style]} {...rest}>
      <AppText variant="micro" tone={tone === "danger" ? "onError" : "onBrand"}>
        {count > max ? `${max}+` : count}
      </AppText>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xs + 1,
    },
    size_sm: {
      minWidth: 18,
      minHeight: 18,
    },
    size_md: {
      minWidth: 20,
      minHeight: 20,
    },
    tone_danger: {
      backgroundColor: colors.error,
    },
    tone_brand: {
      backgroundColor: colors.brand,
    },
  });

export default memo(Badge);
