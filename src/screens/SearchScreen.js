import Feather from "@expo/vector-icons/Feather";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import ScreenShell from "../components/ScreenShell";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import { getFilteredProducts } from "../features/catalog/utils/catalogSelectors";
import { TAB_KEYS } from "../data/tabs";
import { useResponsiveGrid } from "../hooks/useResponsiveGrid";
import { useTheme } from "../theme/ThemeProvider";

export default function SearchScreen({
  activeTab,
  onTabPress,
  onProfilePress,
  onSearchPress,
  onCartPress,
  catalog,
  onOpenProduct,
  cartCount,
  auth,
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const grid = useResponsiveGrid();
  const styles = getStyles(colors);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const results = useMemo(() => getFilteredProducts(catalog.categories, query), [catalog.categories, query]);
  const renderProduct = useCallback(
    ({ item }) => <CatalogProductCard product={item} cardWidth={grid.cardWidth} onOpenProduct={onOpenProduct} />,
    [grid.cardWidth, onOpenProduct]
  );

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
      auth={auth}
      title={t("search.title")}
      subtitle={t("search.subtitle")}
      scrollable={false}
    >
      <View style={styles.content}>
        <View style={styles.searchBox}>
          <Feather name="search" size={22} color={colors.textSecondary} />
          <TextInput
            ref={inputRef}
            placeholder={t("search.placeholder")}
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <Text style={styles.resultText}>{t("search.results", { count: results.length })}</Text>
        <FlatList
          data={results}
          keyExtractor={(item, index) => item?.id ?? String(index)}
          key={`search-${grid.columns}`}
          numColumns={grid.columns}
          columnWrapperStyle={grid.columns > 1 ? [styles.row, { gap: grid.gap }] : undefined}
          contentContainerStyle={styles.list}
          renderItem={renderProduct}
          ListEmptyComponent={<Text style={styles.emptyText}>{t("search.empty")}</Text>}
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
      alignItems: "stretch",
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 40,
      fontSize: 16,
    },
  });
