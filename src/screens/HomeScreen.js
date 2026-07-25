import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import BannerCarousel from "../components/BannerCarousel";
import FestivalDiscountBanner from "../components/FestivalDiscountBanner";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import CatalogSectionHeader from "../features/catalog/components/CatalogSectionHeader";
import { flattenProducts } from "../features/catalog/utils/catalogSelectors";
import { useResponsiveGrid } from "../hooks/useResponsiveGrid";
import { useTheme } from "../theme/ThemeProvider";
import { useLanguage } from "../i18n/LanguageProvider";

export default function HomeScreen({
  activeTab,
  onTabPress,
  onProfilePress,
  onSearchPress,
  onCartPress,
  catalog,
  onViewCategory,
  onOpenProduct,
  cartCount,
  auth,
  storefront,
  festivalCampaign,
}) {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const grid = useResponsiveGrid();
  const styles = getStyles(colors);
  const bannerSlides = useMemo(() => {
    const managed = storefront?.carouselSlides || [];
    if (managed.length) return managed.map((slide) => ({
      ...slide,
      id: String(slide.id),
      title: language === "bn" && slide.titleBn ? slide.titleBn : slide.title,
      subtitle: language === "bn" && slide.subtitleBn ? slide.subtitleBn : slide.subtitle,
    }));
    return [
      { id: "footwear", title: t("home.banner1Title"), subtitle: t("home.banner1Subtitle"), colors: ["#0a0e27", "#7c5d12"] },
      { id: "retailers", title: t("home.banner2Title"), subtitle: t("home.banner2Subtitle"), colors: ["#0f2742", "#087a91"] },
      { id: "collection", title: t("home.banner3Title"), subtitle: t("home.banner3Subtitle"), colors: ["#151a35", "#5f3a8d"] },
    ];
  }, [language, storefront?.carouselSlides, t]);
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
          auth={auth}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <BannerCarousel slides={bannerSlides} />
          <FestivalDiscountBanner campaign={festivalCampaign} />
          <View style={styles.featuredSection}>
            {!homeProducts.length ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>{t("home.noProductsTitle")}</Text>
                <Text style={styles.emptyText}>{t("home.noProductsText")}</Text>
              </View>
            ) : null}
            <CatalogSectionHeader title={t("home.featured")} onPress={() => onViewCategory?.(null)} actionLabel={t("home.viewAll")} />
            <View style={[styles.topRow, { gap: grid.gap }]}> 
              {topProducts.map((product, index) => (
                <CatalogProductCard
                  key={product?.id ?? `top-${index}`}
                  product={product}
                  cardWidth={grid.cardWidth}
                  onOpenProduct={onOpenProduct}
                />
              ))}
            </View>
            <CatalogSectionHeader title={t("home.popular")} actionLabel="" />
            <View style={[styles.grid, { gap: grid.gap }]}> 
              {moreProducts.map((product, index) => (
                <CatalogProductCard key={product?.id ?? `more-${index}`} product={product} cardWidth={grid.cardWidth} onOpenProduct={onOpenProduct} />
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
      flexWrap: "wrap",
      marginBottom: 22,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    emptyCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 20, marginBottom: 20 },
    emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", marginBottom: 6 },
    emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  });
