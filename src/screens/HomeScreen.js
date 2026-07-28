import { StyleSheet, View } from "react-native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import BannerCarousel from "../components/BannerCarousel";
import FestivalDiscountBanner from "../components/FestivalDiscountBanner";
import ScreenShell from "../components/ScreenShell";
import CatalogProductCard from "../features/catalog/components/CatalogProductCard";
import CatalogSectionHeader from "../features/catalog/components/CatalogSectionHeader";
import { TAB_KEYS } from "../data/tabs";
import { flattenProducts } from "../features/catalog/utils/catalogSelectors";
import { useResponsiveGrid } from "../hooks/useResponsiveGrid";
import { spacing, useStyles } from "../theme";
import { EmptyState } from "../ui";
import { useLanguage } from "../i18n/LanguageProvider";

// Gradients for the placeholder banners shown before the storefront returns managed
// slides. They sit behind white display text and are the same in either theme, so they
// are content rather than palette.
const PLACEHOLDER_BANNER_GRADIENTS = {
  footwear: ["#0a0e27", "#7c5d12"],
  retailers: ["#0f2742", "#087a91"],
  collection: ["#151a35", "#5f3a8d"],
};

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
  const { t } = useTranslation();
  const { language } = useLanguage();
  const grid = useResponsiveGrid();
  const styles = useStyles(getStyles);
  const bannerSlides = useMemo(() => {
    const managed = storefront?.carouselSlides || [];
    if (managed.length) return managed.map((slide) => ({
      ...slide,
      id: String(slide.id),
      title: language === "bn" && slide.titleBn ? slide.titleBn : slide.title,
      subtitle: language === "bn" && slide.subtitleBn ? slide.subtitleBn : slide.subtitle,
    }));
    return [
      { id: "footwear", title: t("home.banner1Title"), subtitle: t("home.banner1Subtitle"), colors: PLACEHOLDER_BANNER_GRADIENTS.footwear },
      { id: "retailers", title: t("home.banner2Title"), subtitle: t("home.banner2Subtitle"), colors: PLACEHOLDER_BANNER_GRADIENTS.retailers },
      { id: "collection", title: t("home.banner3Title"), subtitle: t("home.banner3Subtitle"), colors: PLACEHOLDER_BANNER_GRADIENTS.collection },
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
  const moreProducts = catalog.popularProducts?.length ? catalog.popularProducts : homeProducts.slice(2, 8);
  const gridGap = useMemo(() => ({ gap: grid.gap }), [grid.gap]);
  // Home stays mounted once visited, so its timers need to know when it is the front tab.
  const isActive = activeTab === TAB_KEYS.HOME;

  return (
    <ScreenShell
      activeTab={activeTab}
      onTabPress={onTabPress}
      onProfilePress={onProfilePress}
      onSearchPress={onSearchPress}
      onCartPress={onCartPress}
      cartCount={cartCount}
      auth={auth}
    >
      <BannerCarousel slides={bannerSlides} active={isActive} />
      <FestivalDiscountBanner campaign={festivalCampaign} active={isActive} />
      <View style={styles.featuredSection}>
        {!homeProducts.length ? (
          <EmptyState title={t("home.noProductsTitle")} description={t("home.noProductsText")} />
        ) : (
          <>
            <CatalogSectionHeader title={t("home.featured")} onPress={() => onViewCategory?.(null)} actionLabel={t("home.viewAll")} />
            <View style={[styles.topRow, gridGap]}>
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
            <View style={[styles.grid, gridGap]}>
              {moreProducts.map((product, index) => (
                <CatalogProductCard key={product?.id ?? `more-${index}`} product={product} cardWidth={grid.cardWidth} onOpenProduct={onOpenProduct} />
              ))}
            </View>
          </>
        )}
      </View>
    </ScreenShell>
  );
}

const getStyles = () =>
  StyleSheet.create({
    featuredSection: {
      paddingHorizontal: spacing.gutter,
      marginTop: spacing.xxl,
    },
    topRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: spacing.xxl,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
  });
