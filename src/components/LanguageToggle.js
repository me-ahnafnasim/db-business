import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../i18n/LanguageProvider";
import { radius, spacing, useStyles } from "../theme";
import { Chip } from "../ui";

// EN / বাং segmented control.
//
// Previously carried an entire parallel palette of its own, including a blue that appears
// nowhere else in the app. The `dark` variant survives because the launch screen is a
// fixed dark brand surface regardless of the active theme.

export default function LanguageToggle({ variant = "dark" }) {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const onDark = variant === "dark";
  const styles = useStyles((colors) => getStyles(colors, onDark), [onDark]);

  return (
    <View style={[styles.container, onDark && styles.containerOnDark]}>
      <Chip
        label="EN"
        size="sm"
        selected={language === "en"}
        onPress={() => setLanguage("en")}
        tone={onDark ? "inverse" : "secondary"}
        accessibilityLabel={t("common.english")}
        style={[styles.chip, onDark && styles.chipOnDark, language === "en" && onDark && styles.chipOnDarkActive]}
      />
      <Chip
        label="বাং"
        size="sm"
        selected={language === "bn"}
        onPress={() => setLanguage("bn")}
        tone={onDark ? "inverse" : "secondary"}
        accessibilityLabel={t("common.bangla")}
        style={[styles.chip, onDark && styles.chipOnDark, language === "bn" && onDark && styles.chipOnDarkActive]}
      />
    </View>
  );
}

const getStyles = (colors, onDark) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs + 2,
      padding: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    containerOnDark: {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderColor: "rgba(255, 255, 255, 0.12)",
    },
    chip: {
      minWidth: 44,
      minHeight: 36,
    },
    chipOnDark: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
    chipOnDarkActive: {
      backgroundColor: colors.brandSoft,
      borderColor: colors.brand,
    },
  });
