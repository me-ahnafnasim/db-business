import Feather from "@expo/vector-icons/Feather";
import { useMemo, useRef, useState } from "react";
import { FlatList, Modal, Pressable, SafeAreaView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";

import { radius, spacing, useStyles, useTheme } from "../../../theme";
import { AppText, IconButton } from "../../../ui";
import ProductImage from "./ProductImage";

export default function ProductGallery({ productName, images = [], fallbackImage, initialIndex = 0, style }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const [frameWidth, setFrameWidth] = useState(Math.max(1, windowWidth - 40));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [viewerOpen, setViewerOpen] = useState(false);
  const listRef = useRef(null);
  const viewerRef = useRef(null);
  const styles = useStyles(getStyles);

  const galleryImages = useMemo(() => {
    if (images.length) return images;
    return fallbackImage ? [{ id: "fallback", imageUrl: fallbackImage, altText: productName }] : [];
  }, [fallbackImage, images, productName]);

  const selectImage = (index) => {
    setActiveIndex(index);
    listRef.current?.scrollToOffset({ offset: index * frameWidth, animated: true });
  };

  const openViewer = () => {
    setViewerOpen(true);
    requestAnimationFrame(() => viewerRef.current?.scrollToIndex({ index: activeIndex, animated: false }));
  };

  const renderImage = ({ item, index }, fullscreen = false) => (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={t("catalog.imageOf", { current: index + 1, total: galleryImages.length, name: productName })}
      accessibilityHint={fullscreen ? undefined : t("catalog.openGallery")}
      onPress={fullscreen ? undefined : openViewer}
      style={[fullscreen ? styles.fullscreenPage : styles.page, { width: fullscreen ? windowWidth : frameWidth }]}
    >
      <ProductImage
        uri={item.imageUrl}
        accessibilityLabel={item.altText || productName}
        borderRadius={fullscreen ? 0 : radius.card}
        style={fullscreen ? styles.fullscreenImage : undefined}
        // Both the details frame and the fullscreen viewer exist so the buyer can inspect the
        // product, so they must never crop it. ProductImage now defaults to "cover" for the
        // grid and cart thumbnails, where a crop reads better than letterbox bars.
        resizeMode="contain"
      />
    </Pressable>
  );

  return (
    <View style={[styles.container, style]} onLayout={(event) => setFrameWidth(Math.max(1, event.nativeEvent.layout.width))}>
      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        data={galleryImages}
        keyExtractor={(item, index) => String(item?.id || item?.imageUrl || index)}
        renderItem={(info) => renderImage(info)}
        onMomentumScrollEnd={(event) => setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / frameWidth))}
        getItemLayout={(_, index) => ({ length: frameWidth, offset: frameWidth * index, index })}
      />

      {galleryImages.length > 1 ? (
        <>
          <View style={styles.counter}>
            <AppText variant="caption" style={styles.onScrim}>
              {activeIndex + 1}/{galleryImages.length}
            </AppText>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={galleryImages}
            keyExtractor={(item, index) => `thumb-${item?.id || item?.imageUrl || index}`}
            contentContainerStyle={styles.thumbnails}
            renderItem={({ item, index }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("catalog.imageOf", { current: index + 1, total: galleryImages.length, name: productName })}
                accessibilityState={{ selected: index === activeIndex }}
                onPress={() => selectImage(index)}
                style={[styles.thumbnail, index === activeIndex && styles.thumbnailActive]}
              >
                <ProductImage uri={item.imageUrl} accessibilityLabel={item.altText || productName} borderRadius={radius.xs} />
              </Pressable>
            )}
          />
        </>
      ) : null}

      <Modal visible={viewerOpen} animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <SafeAreaView style={styles.viewer}>
          <View style={styles.viewerHeader}>
            <AppText numberOfLines={1} variant="h4" style={[styles.onScrim, styles.viewerTitle]}>
              {t("catalog.galleryTitle", { name: productName })}
            </AppText>
            <IconButton
              label={t("common.close")}
              size="lg"
              onPress={() => setViewerOpen(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={colors.onScrim} />
            </IconButton>
          </View>
          <FlatList
            ref={viewerRef}
            horizontal
            pagingEnabled
            data={galleryImages}
            initialScrollIndex={activeIndex}
            keyExtractor={(item, index) => `viewer-${item?.id || item?.imageUrl || index}`}
            renderItem={(info) => renderImage(info, true)}
            getItemLayout={(_, index) => ({ length: windowWidth, offset: windowWidth * index, index })}
            onMomentumScrollEnd={(event) => setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / windowWidth))}
            showsHorizontalScrollIndicator={false}
          />
          <AppText variant="bodyStrong" style={[styles.onScrim, styles.viewerCounter]}>
            {activeIndex + 1}/{galleryImages.length}
          </AppText>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },
    page: {
      padding: spacing.xs,
    },
    // The lightbox keeps its own dark chrome in both themes — inverting it in light mode
    // would wash out the photo it exists to show.
    onScrim: {
      color: colors.onScrim,
    },
    counter: {
      position: "absolute",
      top: spacing.lg - 2,
      right: spacing.lg - 2,
      borderRadius: radius.pill,
      backgroundColor: colors.scrim,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 1,
    },
    thumbnails: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
      paddingTop: spacing.sm + 2,
      paddingBottom: spacing.xs,
    },
    thumbnail: {
      width: 62,
      height: 62,
      padding: 3,
      borderRadius: radius.sm,
      borderWidth: 2,
      borderColor: "transparent",
    },
    thumbnailActive: {
      borderColor: colors.brand,
    },
    viewer: {
      flex: 1,
      backgroundColor: colors.viewerSurface,
    },
    viewerHeader: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    viewerTitle: {
      flex: 1,
    },
    closeButton: {
      backgroundColor: colors.viewerControl,
    },
    fullscreenPage: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.md,
    },
    fullscreenImage: {
      maxHeight: "85%",
    },
    viewerCounter: {
      textAlign: "center",
      paddingVertical: spacing.lg,
    },
  });
