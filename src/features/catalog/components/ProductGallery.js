import Feather from "@expo/vector-icons/Feather";
import { useMemo, useRef, useState } from "react";
import { FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeProvider";
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
  const styles = getStyles(colors);

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
        borderRadius={fullscreen ? 0 : 20}
        style={fullscreen ? styles.fullscreenImage : undefined}
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
          <View style={styles.counter}><Text style={styles.counterText}>{activeIndex + 1}/{galleryImages.length}</Text></View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={galleryImages}
            keyExtractor={(item, index) => `thumb-${item?.id || item?.imageUrl || index}`}
            contentContainerStyle={styles.thumbnails}
            renderItem={({ item, index }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: index === activeIndex }}
                onPress={() => selectImage(index)}
                style={[styles.thumbnail, index === activeIndex && styles.thumbnailActive]}
              >
                <ProductImage uri={item.imageUrl} accessibilityLabel={item.altText || productName} borderRadius={9} />
              </Pressable>
            )}
          />
        </>
      ) : null}

      <Modal visible={viewerOpen} animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <SafeAreaView style={styles.viewer}>
          <View style={styles.viewerHeader}>
            <Text numberOfLines={1} style={styles.viewerTitle}>{t("catalog.galleryTitle", { name: productName })}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t("common.close")} style={styles.closeButton} onPress={() => setViewerOpen(false)}>
              <Feather name="x" size={24} color="#ffffff" />
            </Pressable>
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
          <Text style={styles.viewerCounter}>{activeIndex + 1}/{galleryImages.length}</Text>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    width: "100%",
  },
  page: {
    padding: 4,
  },
  counter: {
    position: "absolute",
    top: 14,
    right: 14,
    borderRadius: 999,
    backgroundColor: "rgba(10,14,39,0.74)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  counterText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  thumbnails: {
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 4,
  },
  thumbnail: {
    width: 62,
    height: 62,
    padding: 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailActive: {
    borderColor: "#d4af37",
  },
  viewer: {
    flex: 1,
    backgroundColor: "#050814",
  },
  viewerHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  viewerTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenPage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  fullscreenImage: {
    maxHeight: "85%",
  },
  viewerCounter: {
    color: "#ffffff",
    textAlign: "center",
    paddingVertical: 16,
    fontWeight: "800",
  },
});
