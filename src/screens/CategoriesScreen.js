import { FlatList, StyleSheet, Text, View } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import ScreenShell from "../components/ScreenShell";
import CategoryFilterBar from "../features/catalog/components/CategoryFilterBar";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import { getCategoryById, getFilteredProducts } from "../features/catalog/utils/catalogSelectors";
import { useResponsiveGrid } from "../hooks/useResponsiveGrid";
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
  onOpenProduct,
  cartCount,
  auth,
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const grid = useResponsiveGrid();
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
  const renderProduct = useCallback(
    ({ item }) => <CatalogProductCard product={item} cardWidth={grid.cardWidth} onOpenProduct={onOpenProduct} />,
    [grid.cardWidth, onOpenProduct]
  );
  const footer = products.length > visibleCount ? <Text style={styles.footerText}>{t("catalog.loadingMore")}</Text> : null;

  return (
    <ScreenShell
      activeTab={activeTab}
      onTabPress={onTabPress}
      onProfilePress={onProfilePress}
      onSearchPress={onSearchPress}
      onCartPress={onCartPress}
      cartCount={cartCount}
      auth={auth}
      title={selectedCategory ? (selectedCategory.nameKey ? t(selectedCategory.nameKey) : selectedCategory.name) : t("catalog.allCategories")}
      subtitle={
        selectedCategory
          ? t("catalog.categorySummary", { description: selectedCategory.descriptionKey ? t(selectedCategory.descriptionKey) : selectedCategory.description, count: products.length })
          : t("catalog.browseAll")
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
          keyExtractor={(item, index) => item?.id ?? String(index)}
          key={`categories-${grid.columns}`}
          numColumns={grid.columns}
          columnWrapperStyle={grid.columns > 1 ? [styles.row, { gap: grid.gap }] : undefined}
          contentContainerStyle={styles.list}
          renderItem={renderProduct}
          ListEmptyComponent={<Text style={styles.emptyText}>{t("catalog.noProducts")}</Text>}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={footer}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
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
      alignItems: "stretch",
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
