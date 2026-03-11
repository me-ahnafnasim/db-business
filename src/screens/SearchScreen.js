import { Feather } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";

import ScreenShell from "../components/ScreenShell";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import { getFilteredProducts } from "../features/catalog/utils/catalogSelectors";
import { TAB_KEYS } from "../data/tabs";
import { useTheme } from "../theme/ThemeProvider";

export default function SearchScreen({
  activeTab,
  onTabPress,
  onProfilePress,
  onSearchPress,
  onCartPress,
  catalog,
  onAddToCart,
  cartCount,
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const results = useMemo(() => getFilteredProducts(catalog.categories, query), [catalog.categories, query]);

  useEffect(() => {
    if (activeTab !== TAB_KEYS.SEARCH) {
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, [activeTab]);

  return (
    <ScreenShell
      activeTab={activeTab}
      onTabPress={onTabPress}
      onProfilePress={onProfilePress}
      onSearchPress={onSearchPress}
      onCartPress={onCartPress}
      cartCount={cartCount}
      title="Search"
      subtitle="Search by name, SKU, or category"
      scrollable={false}
    >
      <View style={styles.content}>
        <View style={styles.searchBox}>
          <Feather name="search" size={22} color={colors.textSecondary} />
          <TextInput
            ref={inputRef}
            placeholder="Search products"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <Text style={styles.resultText}>{results.length} matching products</Text>
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <CatalogProductCard product={item} compact onAddToCart={onAddToCart} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No products match your search.</Text>}
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
  searchBox: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 17,
  },
  resultText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginHorizontal: 20,
    marginBottom: 10,
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
  });
