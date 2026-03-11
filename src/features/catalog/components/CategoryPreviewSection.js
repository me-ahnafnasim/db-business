import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";
import CatalogProductCard from "./CatalogProductCard";
import CatalogSectionHeader from "./CatalogSectionHeader";

export default function CategoryPreviewSection({ category, onViewAll, onAddToCart }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.section}>
      <CatalogSectionHeader title={category.name} onPress={() => onViewAll?.(category.id)} />
      <Text style={styles.description}>{category.description}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {category.products.map((product) => (
          <CatalogProductCard
            key={product.id}
            product={{ ...product, categoryName: category.name }}
            onAddToCart={onAddToCart}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    section: {
      paddingHorizontal: 20,
      marginTop: 24,
    },
    description: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 14,
    },
    row: {
      paddingRight: 6,
    },
  });
