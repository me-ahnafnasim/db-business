import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useIsAppForeground } from "../hooks/useIsAppForeground";
import { radius, spacing, useStyles, useTheme } from "../theme";
import { AppText, IconButton } from "../ui";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// Scrims and gradient stops sit on top of photography, so they are fixed rather than
// theme-derived: the text above them must stay legible whichever theme is active.
// Much lighter than it was: the top stop is now fully clear instead of a 0.12 haze laid over
// the entire photograph, and the bottom lands at 0.58 rather than 0.88. Two stops exactly —
// a third would be a new hardcoded colour and the token check counts those.
//
// The scrim still exists, and deliberately: the 12px subtitle is drawn at 58% white and would
// disappear over a pale image without something behind it. What changed is where the darkness
// sits — see the gradient's `start` below, which now begins the fade partway down so the upper
// half of the image is untouched.
const IMAGE_SCRIM = ["rgba(5, 9, 24, 0)", "rgba(5, 9, 24, 0.58)"];
const FALLBACK_GRADIENT = ["#0a0e27", "#7c5d12"];
// Faint enough to read as a whisper over the photograph. The title is softened with `opacity`
// in the stylesheet instead of a second rgba constant here, so it keeps the theme's inverse
// colour and does not add another hardcoded colour for the token check to count.
const SUBTITLE_ON_IMAGE = "rgba(255, 255, 255, 0.58)";
const ICON_ON_IMAGE = "rgba(255, 255, 255, 0.9)";
const ARROW_BACKGROUND = "rgba(0, 0, 0, 0.45)";
const DOT_INACTIVE = "rgba(0, 0, 0, 0.28)";

export default function BannerCarousel({ slides, active = true }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const foreground = useIsAppForeground();
  const styles = useStyles(getStyles);
  const { width } = useWindowDimensions();
  const slideWidth = width - 40;
  const slideHeight = slideWidth / (920 / 520);
  // Below 340 the banner is ~170px tall or less, and a two-line 20px overlay covers most of
  // the photograph — including any text the admin drew into the artwork. Compact mode steps
  // the type down one variant and caps each line to one, sized off the slide the type
  // actually sits on rather than a global device class. 340 slide width = a 380dp device.
  const compact = slideWidth < 340;
  const scrollX = useRef(new Animated.Value(0)).current;
  // The pagination dots animate `width`, which is a layout property and therefore can
  // never run on the native driver. Keeping them on `scrollX` forced the whole carousel —
  // including the slide opacity, scale and parallax — onto the JS thread at 60 callbacks
  // per second. They now ride a separate value stepped discretely per slide, which frees
  // `scrollX` to be fully native while keeping the pill geometry exactly as it was.
  const dotProgress = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);
  const currentIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const animation = Animated.timing(dotProgress, {
      toValue: activeIndex,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [activeIndex, dotProgress]);

  const safeSlides = useMemo(() => slides ?? [], [slides]);

  const goToSlide = useCallback(
    (index) => {
      if (!safeSlides.length) {
        return;
      }

      const nextIndex = (index + safeSlides.length) % safeSlides.length;
      currentIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      listRef.current?.scrollToOffset({
        offset: nextIndex * slideWidth,
        animated: true,
      });
    },
    [safeSlides, slideWidth]
  );

  // Auto-advance only while visible and foregrounded. This previously kept scrolling an
  // invisible list every 3.2 s for the entire session, because the Home tab never unmounts.
  useEffect(() => {
    if (safeSlides.length <= 1 || !active || !foreground) {
      return undefined;
    }

    const interval = setInterval(() => {
      goToSlide(currentIndexRef.current + 1);
    }, 3200);

    return () => clearInterval(interval);
  }, [active, foreground, goToSlide, safeSlides.length]);

  const handleMomentumEnd = useCallback(
    (event) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
      currentIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    },
    [slideWidth]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const inputRange = [
        (index - 1) * slideWidth,
        index * slideWidth,
        (index + 1) * slideWidth,
      ];
      const translateY = scrollX.interpolate({
        inputRange,
        outputRange: [20, 0, 20],
        extrapolate: "clamp",
      });
      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.45, 1, 0.45],
        extrapolate: "clamp",
      });
      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.96, 1, 0.96],
        extrapolate: "clamp",
      });

      // Both are optional: a slide may be artwork alone. Nothing below renders when this is
      // false — not the text, and not the scrim that exists to make the text readable.
      const hasText = Boolean(item.title || item.subtitle);

      const content = (showIcon) => (
        <Animated.View style={[styles.bannerContent, { transform: [{ translateY }] }]}>
          {showIcon ? (
            <Feather
              name="shopping-bag"
              size={compact ? 20 : 26}
              color={ICON_ON_IMAGE}
              style={styles.bannerIcon}
            />
          ) : null}
          {/* Both capped, because slide text is admin-entered and the server allows a 180
              character title and a 240 character subtitle. Uncapped, a long slide wraps to
              eight or ten lines, grows upward out of the banner (the content is flex-end) and
              is sliced mid-line by the banner's overflow:hidden — on a 320dp phone in Bangla
              the stack reaches roughly three times the slide height.

              In compact mode the title cap tightens to ONE line and its variant steps down.
              The banner on a 320dp phone is only ~158px tall; at two lines apiece the overlay
              covered up to 89% of the photograph in Bangla, hiding whatever the admin drew in
              the image, and ellipsis keeps the truncation visible rather than silent.

              The subtitle is one line at `micro` on EVERY device, not just the small ones. It
              is a kicker for the title, and at two lines of `caption` it was the single
              largest thing in the overlay — the admin's own artwork is what the banner is for.
              Both nodes are conditional: `subtitle` is optional on the server
              (storefront.controller.js:10), and an empty <AppText> still occupies a full line
              box plus its margin, so clearing the field in the dashboard has to remove the
              element, not just its text. */}
          {item.subtitle ? (
            <AppText variant="micro" numberOfLines={1} style={styles.bannerSubtitle}>
              {item.subtitle}
            </AppText>
          ) : null}
          {item.title ? (
            <AppText
              variant={compact ? "h4" : "h3"}
              tone="inverse"
              numberOfLines={compact ? 1 : 2}
              style={styles.bannerTitle}
            >
              {item.title}
            </AppText>
          ) : null}
        </Animated.View>
      );

      return (
        <View style={[styles.slide, { width: slideWidth, height: slideHeight }]}>
          <Animated.View style={[styles.banner, { opacity, transform: [{ scale }] }]}>
            {item.imageUrl ? (
              <View style={styles.gradient}>
                <Image
                  source={{ uri: item.imageUrl }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={item.imageUrl}
                  transition={120}
                  style={styles.backgroundImage}
                />
                {/* The scrim exists to keep the overlay legible, so a slide carrying neither a
                    title nor a subtitle does not get one — dimming the lower two-thirds of
                    artwork that has nothing written on it is the opposite of what an
                    image-only banner is for. Both fields are optional on the server, and an
                    admin whose lettering is drawn into the image leaves them blank.

                    Starts at 0.35 rather than the top, so the fade is confined to the lower
                    two-thirds and the photograph reads clean above it. */}
                {hasText ? (
                  <LinearGradient colors={IMAGE_SCRIM} start={{ x: 0.5, y: 0.35 }} end={{ x: 0.5, y: 1 }} style={styles.gradient}>
                    {content(false)}
                  </LinearGradient>
                ) : null}
              </View>
            ) : (
              <LinearGradient colors={item.colors || FALLBACK_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
                {content(true)}
              </LinearGradient>
            )}
          </Animated.View>
        </View>
      );
    },
    [compact, scrollX, slideHeight, slideWidth, styles]
  );

  return (
    <View style={styles.wrapper}>
      <AnimatedFlatList
        ref={listRef}
        data={safeSlides}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => item?.id ?? String(index)}
        renderItem={renderItem}
        onMomentumScrollEnd={handleMomentumEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      />

      {/* Paired in the bottom-right rather than pinned to either edge at the vertical centre,
          where they sat over the middle of the photograph — the most valuable part of it — and
          split the controls across three separate places on the slide. Grouped here they read
          as one control next to the dots, and the artwork is left alone.

          The buttons keep size="sm", which is what gives them hitSlop.md; that puts the real
          touch target back at 44dp even though the visible circle is 24. */}
      <View style={styles.arrowGroup}>
        <IconButton
          label={t("common.previous")}
          size="sm"
          onPress={() => goToSlide(activeIndex - 1)}
          style={styles.arrowButton}
        >
          <Feather name="chevron-left" size={16} color={colors.white} />
        </IconButton>

        <IconButton
          label={t("common.next")}
          size="sm"
          onPress={() => goToSlide(activeIndex + 1)}
          style={styles.arrowButton}
        >
          <Feather name="chevron-right" size={16} color={colors.white} />
        </IconButton>
      </View>

      <View style={styles.pagination}>
        {safeSlides.map((slide, index) => {
          const inputRange = [index - 1, index, index + 1];
          const widthAnim = dotProgress.interpolate({
            inputRange,
            outputRange: [6, 20, 6],
            extrapolate: "clamp",
          });
          const opacityAnim = dotProgress.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={slide.id}
              style={[
                styles.paginationDot,
                index === activeIndex && styles.paginationDotActive,
                { width: widthAnim, opacity: opacityAnim },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.gutter,
      position: "relative",
    },
    slide: {
      overflow: "hidden",
    },
    banner: {
      flex: 1,
      borderRadius: radius.lg,
      overflow: "hidden",
    },
    gradient: {
      flex: 1,
    },
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
    },
    bannerContent: {
      flex: 1,
      justifyContent: "flex-end",
      // 26 each side cost 19% of the usable width on a 320dp phone, which is where the Bangla
      // strings wrap worst. 20 matches the screen gutter used everywhere else.
      paddingHorizontal: spacing.xl,
      // The floor is the pagination dots: 6px tall, 12 from the slide bottom, so they occupy
      // 12–18. This padding plus the title's marginBottom puts the title's bottom edge at 26 —
      // 8px clear of them in both modes and both locales. Going to spacing.xl (20) would leave
      // Bengali descenders 4px off the dots; this is as low as the block can seat.
      paddingBottom: spacing.xxl,
    },
    bannerSubtitle: {
      color: SUBTITLE_ON_IMAGE,
      // Overridden because the variants underneath are anything but light: `micro` (compact
      // mode) is 700 in the type scale — BOLDER than the 600 title above it — and `caption`
      // is 500. A kicker line has to sit visually beneath its heading, so the weight is
      // pinned here regardless of which variant the breakpoint picks.
      fontWeight: "400",
      // Tightened so the subtitle reads as the title's kicker, not a separate paragraph — the
      // pair covers less of the photograph as one unit.
      marginBottom: spacing.xs - 2,
      // Loosened because the caption is now small and faint; tight tracking at 12px over a
      // photograph reads as noise.
      letterSpacing: 0.3,
    },
    bannerIcon: {
      marginBottom: spacing.xs,
    },
    bannerTitle: {
      // 600 rather than the h3 default of 700. The softening is done with weight and size, not
      // opacity: the opacity scale has no step between muted (0.7) and solid, and 0.7 is too
      // faint for a 20px title sitting over a photograph. Adding a token for one banner would
      // be worse than not having one.
      fontWeight: "600",
      marginBottom: spacing.xs - 2,
    },
    // Bottom-right, pulled in off the corner. The dots are centred and at most ~44 wide, these
    // are ~54 at the right edge, so the two never meet even on a 320dp phone with five slides —
    // ~32dp between them in that worst case.
    //
    // The banner is rounded to radius.lg (20), which puts a floor on how far into the corner
    // these can go before they read as hanging off the curve. It is not reached here: at 20/8
    // the circle clears the arc entirely.
    arrowGroup: {
      position: "absolute",
      right: spacing.xl,
      bottom: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      zIndex: 2,
    },
    arrowButton: {
      // 24 rather than the 28 size_sm gives. Overriding here rather than adding a size to
      // IconButton: this is one decorative control on one component, and the shrink is only
      // safe because size="sm" keeps hitSlop.md around it.
      width: 24,
      height: 24,
      backgroundColor: ARROW_BACKGROUND,
      borderRadius: radius.pill,
    },
    pagination: {
      position: "absolute",
      // Moved down with the text so the whole overlay group sits lower together, and so the
      // caption/title have room to drop without colliding with the dots.
      bottom: spacing.md,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      // Tightened with the dots: a 14 gap between 6px dots leaves them floating apart.
      gap: spacing.xs + 2,
    },
    paginationDot: {
      // Was 18 tall with a 58-wide active pill, which read as a control rather than an
      // indicator. radius.pill instead of a hand-computed half-height, so the shape stays
      // correct if the height is ever tuned again.
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: DOT_INACTIVE,
    },
    paginationDotActive: {
      backgroundColor: colors.surface,
    },
  });
