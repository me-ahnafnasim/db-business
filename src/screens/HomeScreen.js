import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo } from "react";

import BannerCarousel from "../components/BannerCarousel";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header";
import { bannerSlides } from "../data/mockData";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import CatalogSectionHeader from "../features/catalog/components/CatalogSectionHeader";
import { flattenProducts } from "../features/catalog/utils/catalogSelectors";
import { useTheme } from "../theme/ThemeProvider";

export default function HomeScreen({
  activeTab,
  onTabPress,
  onProfilePress,
  onSearchPress,
  onCartPress,
  catalog,
  onViewCategory,
  onAddToCart,
  cartCount,
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors);
  const homeProducts = useMemo(() => {
    return flattenProducts(catalog.categories)
      .sort((leftProduct, rightProduct) => {
        const leftRank = leftProduct.featuredRank ?? Number.MAX_SAFE_INTEGER;
        const rightRank = rightProduct.featuredRank ?? Number.MAX_SAFE_INTEGER;
        return leftRank - rightRank;
      })
      .slice(0, 16);
  }, [catalog.categories]);
  const topProducts = homeProducts.slice(0, 2);
  const moreProducts = homeProducts.slice(2, 16);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={colors.surface} />
      <View style={styles.container}>
        <Header
          onProfilePress={onProfilePress}
          onSearchPress={onSearchPress}
          onCartPress={onCartPress}
          cartCount={cartCount}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <BannerCarousel slides={bannerSlides} />
          <View style={styles.featuredSection}>
            <CatalogSectionHeader title="Featured Picks" onPress={() => onViewCategory?.(null)} actionLabel="View All" />
            <View style={styles.topRow}>
              {topProducts.map((product) => (
                <CatalogProductCard
                  key={product.id}
                  product={product}
                  compact
                  featured
                  onAddToCart={onAddToCart}
                />
              ))}
            </View>
            <CatalogSectionHeader title="Popular Right Now" actionLabel="" />
            <View style={styles.grid}>
              {moreProducts.map((product) => (
                <CatalogProductCard key={product.id} product={product} compact onAddToCart={onAddToCart} />
              ))}
            </View>
          </View>
        </ScrollView>

        <BottomNav activeTab={activeTab} onTabPress={onTabPress} cartCount={cartCount} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 18,
  },
  featuredSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  });
