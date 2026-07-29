import { FlatList, StyleSheet, View } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import ScreenShell from "../components/ScreenShell";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import { fetchCategoryPage } from "../features/catalog/services/catalogService";
import { useResponsiveGrid } from "../hooks/useResponsiveGrid";
import { spacing, useStyles } from "../theme";
import { AppText, Button, Chip, EmptyState } from "../ui";

// Ten at a time, revealed on scroll. Client-side on purpose: the catalogue is already fully
// in memory — fetchCatalogRaw pulls limit:100 once and MainTabs shares it with Home, this
// screen and Search — so paging the server here would add requests while the bulk fetch
// carried on anyway. That only becomes the right trade once the app stops bulk-loading.
// The two filter rows. `null` is "no filter" in both, and is deliberately first so the default
// is the whole catalogue rather than a slice of it.
const SECTIONS = [
  { value: null, labelKey: "catalog.filterAll" },
  { value: "featured", labelKey: "home.featured" },
  { value: "new", labelKey: "home.newArrivals" },
  { value: "popular", labelKey: "home.popular" },
];
const BANDS = [
  { value: null, labelKey: "catalog.filterAllPrices" },
  { value: "LOW", labelKey: "catalog.bandLow" },
  { value: "MEDIUM", labelKey: "catalog.bandMedium" },
  { value: "HIGH", labelKey: "catalog.bandHigh" },
];

export default function CategoriesScreen({
  activeTab,
  onTabPress,
  onProfilePress,
  onSearchPress,
  onCartPress,
  initialSection = null,
  filterRequestId = 0,
  festivalCampaign,
  onOpenProduct,
  cartCount,
  auth,
}) {
  const { t } = useTranslation();
  const grid = useResponsiveGrid();
  const styles = useStyles(getStyles);

  // Server-filtered and server-paged, unlike every other screen, which shares one bulk-loaded
  // catalogue. Categories is the only place that has to be correct past the bulk fetch's 100.
  const [section, setSection] = useState(initialSection);
  const [priceBand, setPriceBand] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Home's View All arrives with a section already chosen; the tab bar arrives with none. Both
  // land here, and either resets the list.
  //
  // Keyed on filterRequestId as well as the section, so asking for the section already showing
  // still re-applies it. Without that, View All on Featured did nothing once the buyer had
  // changed the chips by hand — the value had not changed, so the effect never ran.
  useEffect(() => {
    setSection(initialSection);
    setPriceBand(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSection, filterRequestId]);

  // Page 1 whenever a filter changes. `replace` rather than append, so switching filters cannot
  // leave the previous filter's products stranded at the top of the list.
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCategoryPage({ section, priceBand, page: 1, festivalCampaign })
      .then((result) => {
        if (!active) return;
        setProducts(result.products);
        setPagination(result.pagination);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [section, priceBand, festivalCampaign]);

  // Explicitly requested, never automatic. A buyer on a metered connection decides when to
  // spend the data, which loading on scroll takes away from them.
  const handleLoadMore = useCallback(() => {
    if (loadingMore || pagination.page >= pagination.totalPages) return;
    setLoadingMore(true);
    fetchCategoryPage({
      section,
      priceBand,
      page: pagination.page + 1,
      festivalCampaign,
    })
      .then((result) => {
        // Append. The whole point of the button is that what is already read stays put.
        setProducts((current) => [...current, ...result.products]);
        setPagination(result.pagination);
      })
      .finally(() => setLoadingMore(false));
  }, [
    festivalCampaign,
    loadingMore,
    pagination.page,
    pagination.totalPages,
    priceBand,
    section,
  ]);

  const remaining = Math.max(0, pagination.total - products.length);
  const renderProduct = useCallback(
    ({ item }) => (
      <CatalogProductCard
        product={item}
        cardWidth={grid.cardWidth}
        onOpenProduct={onOpenProduct}
      />
    ),
    [grid.cardWidth, onOpenProduct],
  );
  // The button, plus the count that justifies it. Both disappear on the last page: an inert
  // "More products" is worse than none, because it reads as a broken control rather than as the
  // end of the list.
  const footer =
    remaining > 0 ? (
      <View style={styles.footer}>
        <AppText variant="bodySm" tone="secondary" style={styles.footerText}>
          {t("catalog.showingCount", {
            shown: products.length,
            total: pagination.total,
          })}
        </AppText>
        <Button
          title={
            loadingMore
              ? t("common.loading")
              : t("catalog.moreProducts", { count: remaining })
          }
          onPress={handleLoadMore}
          disabled={loadingMore}
          variant="secondary"
        />
      </View>
    ) : null;

  const renderChip = (item, current, onSelect) => (
    <Chip
      key={String(item.value)}
      label={t(item.labelKey)}
      selected={current === item.value}
      onPress={() => onSelect(item.value)}
      size="sm"
    />
  );
  const columnWrapper = useMemo(
    () => (grid.columns > 1 ? [styles.row, { gap: grid.gap }] : undefined),
    [grid.columns, grid.gap, styles.row],
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
      title={t("catalog.allCategories")}
      subtitle={t("catalog.filterSummary", { count: pagination.total })}
      scrollable={false}
    >
      <View style={styles.content}>
        {/* Two rows, combining with AND. Each is a real server filter now — the old bar was
            removed precisely because its two options resolved to identical lists. */}
        <View style={styles.filters}>
          <View style={styles.filterRow}>
            {SECTIONS.map((item) => renderChip(item, section, setSection))}
          </View>
          <View style={styles.filterRow}>
            {BANDS.map((item) => renderChip(item, priceBand, setPriceBand))}
          </View>
        </View>
        <FlatList
          data={products}
          keyExtractor={(item, index) => item?.id ?? String(index)}
          key={`categories-${grid.columns}`}
          numColumns={grid.columns}
          columnWrapperStyle={columnWrapper}
          contentContainerStyle={styles.list}
          renderItem={renderProduct}
          ListEmptyComponent={
            loading ? null : <EmptyState title={t("catalog.noProducts")} />
          }
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
    filters: {
      paddingHorizontal: spacing.gutter,
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },
    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    footer: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    footerText: {
      textAlign: "center",
      marginTop: spacing.sm,
      marginBottom: spacing.xs + 2,
    },
  });
