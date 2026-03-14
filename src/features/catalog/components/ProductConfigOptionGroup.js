import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProductConfigOptionGroup({
  title,
  options,
  selectedValue,
  onSelect,
  showSurcharge = false,
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = option.value === selectedValue;

          return (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
              onPress={() => onSelect?.(option.value)}
            >
              {"hex" in option ? <View style={[styles.swatch, { backgroundColor: option.hex }]} /> : null}
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{option.label}</Text>
              {showSurcharge && option.surcharge > 0 ? (
                <Text style={[styles.optionMeta, isSelected && styles.optionLabelSelected]}>
                  +${option.surcharge}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    section: {
      marginBottom: 16,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 10,
    },
    options: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    option: {
      minWidth: 74,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    optionSelected: {
      backgroundColor: isDarkMode ? colors.white : colors.tabActiveBackground,
      borderColor: isDarkMode ? colors.white : colors.tabActive,
    },
    optionPressed: {
      opacity: 0.9,
    },
    swatch: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: "rgba(0,0,0,0.12)",
    },
    optionLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    optionLabelSelected: {
      color: isDarkMode ? colors.black : colors.tabActive,
    },
    optionMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
  });
