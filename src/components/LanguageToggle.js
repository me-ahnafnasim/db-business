import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useLanguage } from "../i18n/LanguageProvider";

export default function LanguageToggle({ variant = "dark" }) {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(variant);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.chip, language === "en" && styles.chipActive]}
        onPress={() => setLanguage("en")}
        accessibilityRole="button"
        accessibilityLabel={t("common.english")}
        accessibilityState={{ selected: language === "en" }}
      >
        <Text style={[styles.chipText, language === "en" && styles.chipTextActive]}>EN</Text>
      </Pressable>
      <Pressable
        style={[styles.chip, language === "bn" && styles.chipActive]}
        onPress={() => setLanguage("bn")}
        accessibilityRole="button"
        accessibilityLabel={t("common.bangla")}
        accessibilityState={{ selected: language === "bn" }}
      >
        <Text style={[styles.chipText, language === "bn" && styles.chipTextActive]}>বাং</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (variant) => {
  const isDark = variant === "dark";

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 4,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
    },
    chip: {
      minWidth: 44,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      alignItems: "center",
    },
    chipActive: {
      backgroundColor: isDark ? "rgba(212, 175, 55, 0.25)" : "#dbeafe",
    },
    chipText: {
      fontSize: 13,
      fontWeight: "700",
      color: isDark ? "#b0bac9" : "#64748b",
    },
    chipTextActive: {
      color: isDark ? "#ffd700" : "#2563eb",
    },
  });
};
