import { FlatList, StyleSheet, View } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import ScreenShell from "../components/ScreenShell";
import CategoryFilterBar from "../features/catalog/components/CategoryFilterBar";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import { getCategoryById, getFilteredProducts } from "../features/catalog/utils/catalogSelectors";
import { useResponsiveGrid } from "../hooks/useResponsiveGrid";
import { spacing, useStyles } from "../theme";
import { AppText, EmptyState } from "../ui";

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
  const { t } = useTranslation();
  const grid = useResponsiveGrid();
  const styles = useStyles(getStyles);
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
  const footer = products.length > visibleCount ? (
    <AppText variant="bodySm" tone="secondary" style={styles.footerText}>
      {t("catalog.loadingMore")}
    </AppText>
  ) : null;
  const columnWrapper = useMemo(
    () => (grid.columns > 1 ? [styles.row, { gap: grid.gap }] : undefined),
    [grid.columns, grid.gap, styles.row]
  );

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
          columnWrapperStyle={columnWrapper}
          contentContainerStyle={styles.list}
          renderItem={renderProduct}
          ListEmptyComponent={<EmptyState title={t("catalog.noProducts")} />}
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

const getStyles = () =>
  StyleSheet.create({
    content: {
      flex: 1,
    },
    list: {
      paddingHorizontal: spacing.gutter,
      paddingBottom: spacing.xxl,
    },
    row: {
      alignItems: "stretch",
    },
    footerText: {
      textAlign: "center",
      marginTop: spacing.sm,
      marginBottom: spacing.xs + 2,
    },
  });
