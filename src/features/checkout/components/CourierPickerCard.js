import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { radius, spacing, useStyles } from "../../../theme";
import { AppText } from "../../../ui";
import { formatBdt } from "../../../utils/money";
import { localizedName, methodPriceBdt } from "../utils/deliveryOptions";

// One courier in the horizontal picker.
//
// A fixed width rather than one that hugs its label: couriers are chosen by scanning across
// them, and tiles that each size to their own name make that a ragged, harder read. It also
// keeps the row's scroll distance predictable however long a Bangla name turns out to be.
export const COURIER_CARD_WIDTH = 148;

function CourierPickerCard({ courier, selected, onPress }) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  // The cheapest option this courier offers. It is the number a buyer actually compares
  // couriers on, and showing it here saves selecting each one just to find out.
  const cheapest = (courier.methods || []).reduce((lowest, method) => {
    const price = methodPriceBdt(method);
    return lowest === null || price < lowest ? price : lowest;
  }, null);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={localizedName(courier, language)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.body}>
        <AppText
          numberOfLines={2}
          variant="bodyStrong"
          style={[styles.name, selected && styles.nameSelected]}
        >
          {localizedName(courier, language)}
        </AppText>
        <AppText numberOfLines={1} variant="caption" tone="secondary" style={styles.price}>
          {cheapest === null
            ? ""
            : cheapest === 0
              ? t("checkout.deliveryFree")
              : `${t("catalog.from")} ${formatBdt(cheapest, language)}`}
        </AppText>
      </View>
    </Pressable>
  );
}

export default memo(CourierPickerCard);

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      width: COURIER_CARD_WIDTH,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    // Border and tint rather than a checkmark: at this size a tick competes with the name for
    // the only two lines of room there are.
    cardSelected: {
      borderColor: colors.brand,
      backgroundColor: colors.brandSoft,
    },
    cardPressed: {
      opacity: 0.85,
    },
    body: {
      gap: spacing.xs,
    },
    name: {
      // Reserves both lines so a one-line and a two-line name produce the same tile height and
      // the row does not step up and down as you scroll it.
      minHeight: 40,
    },
    nameSelected: {
      color: colors.brand,
    },
    price: {
      fontWeight: "600",
    },
  });
