import { FlatList, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";

import ScreenShell from "../components/ScreenShell";
import CategoryFilterBar from "../features/catalog/components/CategoryFilterBar";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import { getCategoryById, getFilteredProducts } from "../features/catalog/utils/catalogSelectors";
import { useTheme } from "../theme/ThemeProvider";

const PAGE_SIZE = 14;

export default function CategoriesScreen({
  activeTab,
  onTabPress,
  onProfilePress,
  onSearchPress,
  onCartPress,
  catalog,
  selectedCategoryId,
  onSelectCategory,
  onAddToCart,
  cartCount,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const selectedCategory = getCategoryById(catalog.categories, selectedCategoryId);
  const products = useMemo(
    () => getFilteredProducts(catalog.categories, "", selectedCategoryId),
    [catalog.categories, selectedCategoryId]
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategoryId]);

  const visibleProducts = products.slice(0, visibleCount);
  const handleLoadMore = () => {
    if (visibleCount >= products.length) {
      return;
    }

    setVisibleCount((currentCount) => currentCount + PAGE_SIZE);
  };

  return (
    <ScreenShell
      activeTab={activeTab}
      onTabPress={onTabPress}
      onProfilePress={onProfilePress}
      onSearchPress={onSearchPress}
      onCartPress={onCartPress}
      cartCount={cartCount}
      title={selectedCategory ? selectedCategory.name : "All Shoe Categories"}
      subtitle={
        selectedCategory
          ? `${selectedCategory.description} · Showing ${products.length} products`
          : "Browse all categories with scalable grid loading"
      }
      scrollable={false}
    >
      <View style={styles.content}>
        <CategoryFilterBar
          categories={catalog.categories}
          activeCategoryId={selectedCategoryId}
          onSelectCategory={onSelectCategory}
        />
        <FlatList
          data={visibleProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <CatalogProductCard product={item} compact onAddToCart={onAddToCart} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            products.length > visibleCount ? <Text style={styles.footerText}>Loading more products...</Text> : null
          }
        />
      </View>
    </ScreenShell>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    content: {
      flex: 1,
    },
    list: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    row: {
      justifyContent: "space-between",
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 40,
      fontSize: 16,
    },
    footerText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 6,
      fontSize: 14,
    },
  });
