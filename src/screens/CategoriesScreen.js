import { FlatList, StyleSheet, View } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import ScreenShell from "../components/ScreenShell";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import { getCategoryById, getFilteredProducts } from "../features/catalog/utils/catalogSelectors";
import { useResponsiveGrid } from "../hooks/useResponsiveGrid";
import { spacing, useStyles } from "../theme";
import { AppText, EmptyState } from "../ui";

// Ten at a time, revealed on scroll. Client-side on purpose: the catalogue is already fully
// in memory — fetchCatalogRaw pulls limit:100 once and MainTabs shares it with Home, this
// screen and Search — so paging the server here would add requests while the bulk fetch
// carried on anyway. That only becomes the right trade once the app stops bulk-loading.
const PAGE_SIZE = 10;

export default function CategoriesScreen({
  activeTab,
  onTabPress,
  onProfilePress,
  onSearchPress,
  onCartPress,
  catalog,
  selectedCategoryId,
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
  // A count rather than a bare "loading more", so it is obvious there is more to come and
  // roughly how much. Hidden once everything is on screen.
  const footer = products.length > visibleProducts.length ? (
    <AppText variant="bodySm" tone="secondary" style={styles.footerText}>
      {t("catalog.showingCount", { shown: visibleProducts.length, total: products.length })}
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
        {/* The filter bar is gone. It offered "All" and "All Products", which resolved to
            byte-identical lists because the catalogue has exactly one synthetic category —
            there is no category concept anywhere in the server. Two controls that did
            nothing read as broken; a plain paginated grid is what this screen actually is. */}
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
