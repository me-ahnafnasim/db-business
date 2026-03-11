import { ScrollView, Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function CategoryFilterBar({ categories, activeCategoryId, onSelectCategory }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      <Pressable
        style={[styles.chip, !activeCategoryId && styles.activeChip]}
        onPress={() => onSelectCategory?.(null)}
      >
        <Text style={[styles.chipText, !activeCategoryId && styles.activeChipText]}>All</Text>
      </Pressable>
      {categories.map((category) => {
        const active = category.id === activeCategoryId;

        return (
          <Pressable
            key={category.id}
            style={[styles.chip, active && styles.activeChip]}
            onPress={() => onSelectCategory?.(category.id)}
          >
            <Text
              style={[styles.chipText, active && styles.activeChipText]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {category.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingBottom: 14,
      gap: 10,
    },
    chip: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 18,
      marginRight: 10,
      minWidth: 72,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    activeChip: {
      backgroundColor: colors.tabActiveBackground,
      borderColor: colors.tabActiveBackground,
    },
    chipText: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      maxWidth: 150,
      textAlign: "center",
    },
    activeChipText: {
      color: colors.tabActive,
    },
  });
