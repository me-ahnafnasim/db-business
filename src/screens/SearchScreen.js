import Feather from "@expo/vector-icons/Feather";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import { getFilteredProducts } from "../features/catalog/utils/catalogSelectors";
import { useResponsiveGrid } from "../hooks/useResponsiveGrid";
import { radius, spacing, useStyles, useTheme } from "../theme";
import { AppText, EmptyState, IconButton } from "../ui";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Opened from the header rather than living in the tab bar — searching is an action, not a
// destination. The query is owned by MainTabs so it survives opening a product from the
// results and coming back, which a pushed screen would otherwise lose on unmount.
export default function SearchScreen({ catalog, onOpenProduct, onBack, query, onQueryChange }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const grid = useResponsiveGrid();
  const styles = useStyles(getStyles);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef(null);
  const results = useMemo(
    () => getFilteredProducts(catalog.categories, debouncedQuery),
    [catalog.categories, debouncedQuery]
  );
  const renderProduct = useCallback(
    ({ item }) => <CatalogProductCard product={item} cardWidth={grid.cardWidth} onOpenProduct={onOpenProduct} />,
    [grid.cardWidth, onOpenProduct]
  );
  const columnWrapper = useMemo(
    () => (grid.columns > 1 ? [styles.row, { gap: grid.gap }] : undefined),
    [grid.columns, grid.gap, styles.row]
  );

  // Focus on open, but only for a fresh search — coming back from a product should show the
  // results already there, not throw the keyboard over them.
  const shouldAutoFocus = useRef(!query);
  useEffect(() => {
    if (!shouldAutoFocus.current) return undefined;
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <StackScreenShell
      title={t("search.title")}
      subtitle={t("search.subtitle")}
      onBack={onBack}
      scrollable={false}
    >
      <View style={styles.content}>
        <Pressable
          style={styles.searchBar}
          onPress={() => inputRef.current?.focus()}
          accessibilityRole="search"
          accessibilityLabel={t("search.placeholder")}
        >
          <Feather name="search" size={18} color={colors.brand} />
          <AppText variant="body" tone={query ? "primary" : "secondary"} style={styles.inputText} numberOfLines={1}>
            {query || t("search.placeholder")}
          </AppText>
          {query.length > 0 ? (
            <IconButton
              label={t("common.clear")}
              size="sm"
              tone="plain"
              onPress={() => {
                onQueryChange("");
                inputRef.current?.focus();
              }}
            >
              <Feather name="x" size={16} color={colors.textSecondary} />
            </IconButton>
          ) : null}
        </Pressable>
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={query}
          onChangeText={onQueryChange}
        />
        <AppText variant="bodySm" tone="secondary" style={styles.resultText}>
          {t("search.results", { count: results.length })}
        </AppText>
        <FlatList
          data={results}
          keyExtractor={(item, index) => item?.id ?? String(index)}
          key={`search-${grid.columns}`}
          numColumns={grid.columns}
          columnWrapperStyle={columnWrapper}
          contentContainerStyle={styles.list}
          renderItem={renderProduct}
          ListEmptyComponent={<EmptyState title={t("search.empty")} />}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
        />
      </View>
    </StackScreenShell>
  );
}

// No horizontal gutters here — StackScreenShell's fixedContent already applies them, unlike
// the ScreenShell this screen used while it was a tab.
const getStyles = (colors) =>
  StyleSheet.create({
    content: {
      flex: 1,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      marginBottom: spacing.lg - 2,
      paddingHorizontal: spacing.lg + 2,
      paddingVertical: spacing.lg - 2,
      borderRadius: radius.xl,
      gap: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputText: {
      flex: 1,
    },
    // The real input is kept offscreen and driven by the pressable above it. Replacing
    // this with a plain TextInput is tracked in UI_IMPROVEMENT_REPORT.md — it changes
    // focus and state wiring, so it is out of scope here.
    hiddenInput: {
      position: "absolute",
      width: 1,
      height: 1,
      opacity: 0,
    },
    resultText: {
      marginBottom: spacing.sm + 2,
    },
    list: {
      paddingBottom: spacing.xxl,
    },
    row: {
      alignItems: "stretch",
    },
  });
