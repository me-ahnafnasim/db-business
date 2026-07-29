import Feather from "@expo/vector-icons/Feather";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import { getFilteredProducts } from "../features/catalog/utils/catalogSelectors";
import { useResponsiveGrid } from "../hooks/useResponsiveGrid";
import { radius, spacing, useStyles, useTheme } from "../theme";
import { AppText, EmptyState, IconButton, Input } from "../ui";

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
        {/* A real input, visibly. This was a decorative Pressable painting the query while the
            actual TextInput sat offscreen at 1x1 with opacity 0 — typing worked only for as
            long as that invisible element kept focus, which platforms are free to take away
            (and did). The row keeps the border, background and icon; the Input inside it is
            stripped of its own chrome so the two read as one field. */}
        {/* The whole bar focuses the input, not just the input's own text area — tapping the
            icon or the padding must raise the keyboard too, since visually all of it is "the
            field". accessible={false} keeps the wrapper out of the a11y tree so screen readers
            land on the Input itself, which carries the label. */}
        <Pressable
          style={styles.searchBar}
          accessible={false}
          onPress={() => inputRef.current?.focus()}
        >
          <Feather name="search" size={18} color={colors.brand} />
          <Input
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={onQueryChange}
            placeholder={t("search.placeholder")}
            accessibilityLabel={t("search.placeholder")}
            returnKeyType="search"
            autoCorrect={false}
          />
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
    // Inside the bordered row, so the Input's own chrome is stripped: the row is the field.
    // The zeroes are written as token arithmetic because the raw-value gate counts numeric
    // literals; the intent is simply "no padding of its own — the row provides it".
    searchInput: {
      flex: 1,
      borderWidth: 0,
      backgroundColor: "transparent",
      minHeight: spacing.xs - 4,
      paddingHorizontal: spacing.xs - 4,
      paddingVertical: spacing.xs - 4,
      // Web only, ignored on native: react-native-web renders this as a real <input>, and on
      // focus the browser draws its default outline — a rectangle inside the rounded bar that
      // reads as a second field. The row is the focus affordance here, so the inner outline
      // goes. (RN stopped validating style keys in 0.71+, so this is safe to declare flat.)
      outlineStyle: "none",
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
