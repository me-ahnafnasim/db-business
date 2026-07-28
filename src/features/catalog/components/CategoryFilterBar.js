import { ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing, useStyles } from "../../../theme";
import { Chip } from "../../../ui";

export default function CategoryFilterBar({ categories, activeCategoryId, onSelectCategory }) {
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      <Chip
        label={t("catalog.all")}
        selected={!activeCategoryId}
        onPress={() => onSelectCategory?.(null)}
        style={styles.chip}
      />
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.nameKey ? t(category.nameKey) : category.name}
          selected={category.id === activeCategoryId}
          onPress={() => onSelectCategory?.(category.id)}
          style={styles.chip}
        />
      ))}
    </ScrollView>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.gutter,
      paddingBottom: spacing.lg - 2,
      gap: spacing.sm + 2,
    },
    chip: {
      minWidth: 72,
      minHeight: 48,
      maxWidth: 180,
    },
  });
