import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useTheme } from "../theme/ThemeProvider";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function BannerCarousel({ slides }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
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

      return (
        <View style={[styles.slide, { width: slideWidth, height: slideHeight }]}>
          <Animated.View style={[styles.banner, { opacity, transform: [{ scale }] }]}>
            <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
              <Animated.View style={[styles.bannerContent, { transform: [{ translateY }] }]}>
                <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                <Text style={styles.bannerTitle}>{item.title}</Text>
                <Text style={styles.bannerSize}>
                  {`${Math.round(slideWidth)} x ${Math.round(slideHeight)}`}
                </Text>
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        </View>
      );
    },
    [scrollX, slideWidth]
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
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onMomentumScrollEnd={handleMomentumEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      />

      <Pressable
        style={[styles.arrowButton, styles.leftArrow, { top: 20 + slideHeight / 2 - 14 }]}
        onPress={() => goToSlide(activeIndex - 1)}
      >
        <Feather name="chevron-left" size={20} color={colors.white} />
      </Pressable>

      <Pressable
        style={[styles.arrowButton, styles.rightArrow, { top: 20 + slideHeight / 2 - 14 }]}
        onPress={() => goToSlide(activeIndex + 1)}
      >
        <Feather name="chevron-right" size={20} color={colors.white} />
      </Pressable>

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
    paddingHorizontal: 20,
    paddingTop: 20,
    position: "relative",
  },
  slide: {
    overflow: "hidden",
  },
  banner: {
    flex: 1,
    borderRadius: 34,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
  },
  bannerContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 26,
    paddingBottom: 38,
  },
  bannerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    marginBottom: 6,
  },
  bannerTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 10,
  },
  bannerSize: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },
  arrowButton: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  leftArrow: {
    left: 28,
  },
  rightArrow: {
    right: 28,
  },
  pagination: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  paginationDot: {
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  paginationDotActive: {
    backgroundColor: colors.surface,
  },
  });
