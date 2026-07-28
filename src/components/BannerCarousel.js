import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  ImageBackground,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import { radius, spacing, useStyles, useTheme } from "../theme";
import { AppText, IconButton } from "../ui";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// Scrims and gradient stops sit on top of photography, so they are fixed rather than
// theme-derived: the text above them must stay legible whichever theme is active.
const IMAGE_SCRIM = ["rgba(5, 9, 24, 0.12)", "rgba(5, 9, 24, 0.88)"];
const FALLBACK_GRADIENT = ["#0a0e27", "#7c5d12"];
const SUBTITLE_ON_IMAGE = "rgba(255, 255, 255, 0.8)";
const ICON_ON_IMAGE = "rgba(255, 255, 255, 0.9)";
const ARROW_BACKGROUND = "rgba(0, 0, 0, 0.45)";
const DOT_INACTIVE = "rgba(0, 0, 0, 0.28)";

export default function BannerCarousel({ slides }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const { width } = useWindowDimensions();
  const slideWidth = width - 40;
  const slideHeight = slideWidth / (920 / 520);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);
  const currentIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

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

  useEffect(() => {
    if (safeSlides.length <= 1) {
      return undefined;
    }

    const interval = setInterval(() => {
      goToSlide(currentIndexRef.current + 1);
    }, 3200);

    return () => clearInterval(interval);
  }, [goToSlide, safeSlides.length]);

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

      const content = (showIcon) => (
        <Animated.View style={[styles.bannerContent, { transform: [{ translateY }] }]}>
          {showIcon ? (
            <MaterialCommunityIcons name="shoe-sneaker" size={42} color={ICON_ON_IMAGE} style={styles.bannerIcon} />
          ) : null}
          <AppText variant="body" style={styles.bannerSubtitle}>
            {item.subtitle}
          </AppText>
          <AppText variant="display" tone="inverse" style={styles.bannerTitle}>
            {item.title}
          </AppText>
        </Animated.View>
      );

      return (
        <View style={[styles.slide, { width: slideWidth, height: slideHeight }]}>
          <Animated.View style={[styles.banner, { opacity, transform: [{ scale }] }]}>
            {item.imageUrl ? (
              <ImageBackground source={{ uri: item.imageUrl }} resizeMode="cover" style={styles.gradient}>
                <LinearGradient colors={IMAGE_SCRIM} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.gradient}>
                  {content(false)}
                </LinearGradient>
              </ImageBackground>
            ) : (
              <LinearGradient colors={item.colors || FALLBACK_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
                {content(true)}
              </LinearGradient>
            )}
          </Animated.View>
        </View>
      );
    },
    [scrollX, slideHeight, slideWidth, styles]
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
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      />

      <IconButton
        label={t("common.previous")}
        size="sm"
        onPress={() => goToSlide(activeIndex - 1)}
        style={[styles.arrowButton, styles.leftArrow, { top: 20 + slideHeight / 2 - 14 }]}
      >
        <Feather name="chevron-left" size={20} color={colors.white} />
      </IconButton>

      <IconButton
        label={t("common.next")}
        size="sm"
        onPress={() => goToSlide(activeIndex + 1)}
        style={[styles.arrowButton, styles.rightArrow, { top: 20 + slideHeight / 2 - 14 }]}
      >
        <Feather name="chevron-right" size={20} color={colors.white} />
      </IconButton>

      <View style={styles.pagination}>
        {safeSlides.map((slide, index) => {
          const inputRange = [
            (index - 1) * slideWidth,
            index * slideWidth,
            (index + 1) * slideWidth,
          ];
          const widthAnim = scrollX.interpolate({
            inputRange,
            outputRange: [18, 58, 18],
            extrapolate: "clamp",
          });
          const opacityAnim = scrollX.interpolate({
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
      borderRadius: radius.xl,
      overflow: "hidden",
    },
    gradient: {
      flex: 1,
    },
    bannerContent: {
      flex: 1,
      justifyContent: "flex-end",
      paddingHorizontal: spacing.xxl + 2,
      paddingBottom: spacing.x5 - 2,
    },
    bannerSubtitle: {
      color: SUBTITLE_ON_IMAGE,
      marginBottom: spacing.xs + 2,
    },
    bannerIcon: {
      marginBottom: spacing.sm,
    },
    bannerTitle: {
      marginBottom: spacing.sm + 2,
    },
    arrowButton: {
      position: "absolute",
      backgroundColor: ARROW_BACKGROUND,
      borderRadius: radius.pill,
      zIndex: 2,
    },
    leftArrow: {
      left: spacing.xxxl,
    },
    rightArrow: {
      right: spacing.xxxl,
    },
    pagination: {
      position: "absolute",
      bottom: spacing.gutter,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg - 2,
    },
    paginationDot: {
      height: 18,
      borderRadius: 9,
      backgroundColor: DOT_INACTIVE,
    },
    paginationDotActive: {
      backgroundColor: colors.surface,
    },
  });
