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
// Every rail on this screen, not just one — one constant so the three cannot drift apart.
//
// Load-bearing: Home is a ScrollView with .map(), not a FlatList, so every card mounts and
// stays mounted. The catalog fetches limit:100, and a product may carry both flags, so
// uncapped this screen could hold 200 live cards. Capped it holds at most 18.
//
// Home is a landing page; the full list is one tap away through View All on each rail.
// Convert this screen to a FlatList before raising this number.
const HOME_RAIL_LIMIT = 6;

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
  // Both rails are curated in the dashboard now. This used to sort by `featuredRank`, which
  // the client invented from array position — so "Featured Picks" was really just the two
  // most recently created products, and "Popular Right Now" came from a lifetime sales
  // aggregate. Neither reflected anyone's intent.
  //
  // An empty rail is a valid state: it means nothing is ticked, and the section is hidden
  // rather than backfilled with something the admin did not choose.
  // All three rails share the same cap. The curated two were previously unbounded on the
  // grounds that ticking is deliberate — true, but it left nothing stopping 40 ticked
  // products from mounting 40 cards on a screen that does not virtualise. View All on each
  // rail reaches the rest.
  // How many each rail previews, set by the admin. `?? HOME_RAIL_LIMIT` is a compatibility
  // fallback, not a default: a build newer than the server it talks to gets no limits at all,
  // and six is what every rail used before this was configurable.
  //
  // 0 is a real value and means the admin hid that rail, so it must survive `??` — which is why
  // this reads the three keys individually rather than defaulting the whole object.
  // On `storefront`, not `catalog`: the limits come from the public storefront payload
  // alongside the carousel slides, and storefrontForNow in MainTabs passes them through
  // untouched (it only ever nulls an expired campaign).
  const limits = storefront?.homeSectionLimits ?? {};
  const featuredLimit = limits.featured ?? HOME_RAIL_LIMIT;
  const newArrivalsLimit = limits.newArrivals ?? HOME_RAIL_LIMIT;
  const popularLimit = limits.popular ?? HOME_RAIL_LIMIT;

  const featuredProducts = useMemo(
    () => (catalog.featuredProducts ?? []).slice(0, featuredLimit),
    [catalog.featuredProducts, featuredLimit]
  );
  // Everything in neither curated rail, so an unticked product still has somewhere to appear.
  const newArrivals = useMemo(
    () => (catalog.newArrivals ?? []).slice(0, newArrivalsLimit),
    [catalog.newArrivals, newArrivalsLimit]
  );
  const popularProducts = useMemo(
    () => (catalog.popularProducts ?? []).slice(0, popularLimit),
    [catalog.popularProducts, popularLimit]
  );
  const hasProducts = useMemo(
    () => flattenProducts(catalog.categories).length > 0,
    [catalog.categories]
  );
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
        {/* The empty state now means "the catalog itself is empty", not "nothing is
            featured" — an uncurated catalog full of products should still offer a way in. */}
        {!hasProducts ? (
          <EmptyState title={t("home.noProductsTitle")} description={t("home.noProductsText")} />
        ) : (
          <>
            {featuredProducts.length ? (
              <>
                <CatalogSectionHeader title={t("home.featured")} onPress={() => onViewCategory?.({ section: "featured" })} actionLabel={t("home.viewAll")} />
                <View style={[styles.topRow, gridGap]}>
                  {featuredProducts.map((product, index) => (
                    <CatalogProductCard
                      key={product?.id ?? `featured-${index}`}
                      product={product}
                      cardWidth={grid.cardWidth}
                      onOpenProduct={onOpenProduct}
                    />
                  ))}
                </View>
              </>
            ) : null}
            {newArrivals.length ? (
              <>
                <CatalogSectionHeader title={t("home.newArrivals")} onPress={() => onViewCategory?.({ section: "new" })} actionLabel={t("home.viewAll")} />
                <View style={[styles.grid, gridGap]}>
                  {newArrivals.map((product, index) => (
                    <CatalogProductCard key={product?.id ?? `new-${index}`} product={product} cardWidth={grid.cardWidth} onOpenProduct={onOpenProduct} />
                  ))}
                </View>
              </>
            ) : null}
            {popularProducts.length ? (
              <>
                {/* Gained a View All: with an empty actionLabel this rendered no action at
                    all, which was fine when the rail showed everything ticked and misleading
                    once it shows six of forty. */}
                <CatalogSectionHeader title={t("home.popular")} onPress={() => onViewCategory?.({ section: "popular" })} actionLabel={t("home.viewAll")} />
                <View style={[styles.grid, gridGap]}>
                  {popularProducts.map((product, index) => (
                    <CatalogProductCard key={product?.id ?? `popular-${index}`} product={product} cardWidth={grid.cardWidth} onOpenProduct={onOpenProduct} />
                  ))}
                </View>
              </>
            ) : null}
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
