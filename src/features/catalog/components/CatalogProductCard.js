import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function CatalogProductCard({ product, onAddToCart, compact = false, featured = false }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);

  return (
    <View style={[styles.card, compact && styles.compactCard, featured && styles.featuredCard]}>
      <Image
        source={{ uri: product.image }}
        style={[styles.image, compact && styles.compactImage, featured && styles.featuredImage]}
      />
      <View style={[styles.body, compact && styles.compactBody, featured && styles.featuredBody]}>
        <Text numberOfLines={2} style={[styles.name, compact && styles.compactName, featured && styles.featuredName]}>
          {product.name}
        </Text>
        <Text style={[styles.meta, compact && styles.compactMeta, featured && styles.featuredMeta]}>{product.sku}</Text>
        <Text style={[styles.meta, compact && styles.compactMeta, featured && styles.featuredMeta]}>
          {product.categoryName}
        </Text>
        <View style={[styles.footer, compact && styles.compactFooter, featured && styles.featuredFooter]}>
          <View>
            <Text style={[styles.price, compact && styles.compactPrice, featured && styles.featuredPrice]}>
              ${product.price}
            </Text>
            <Text style={[styles.moq, compact && styles.compactMoq, featured && styles.featuredMoq]}>
              MOQ {product.moq}
            </Text>
          </View>
          <Pressable
            style={[styles.button, compact && styles.compactButton, featured && styles.featuredButton]}
            onPress={() => onAddToCart?.(product)}
          >
            <Text style={[styles.buttonText, compact && styles.compactButtonText, featured && styles.featuredButtonText]}>
              Add to Cart
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    card: {
      width: 236,
      backgroundColor: colors.surface,
      borderRadius: 22,
      overflow: "hidden",
      marginRight: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    compactCard: {
      width: "48%",
      marginRight: 0,
      marginBottom: 14,
    },
    featuredCard: {
      width: "49%",
    },
    image: {
      width: "100%",
      height: 144,
      backgroundColor: isDarkMode ? "#111827" : "#e5e7eb",
    },
    compactImage: {
      height: 98,
    },
    featuredImage: {
      height: 118,
    },
    body: {
      padding: 14,
      gap: 4,
    },
    compactBody: {
      padding: 10,
      gap: 2,
    },
    featuredBody: {
      padding: 12,
      gap: 3,
    },
    name: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      minHeight: 40,
    },
    compactName: {
      fontSize: 14,
      minHeight: 34,
    },
    featuredName: {
      fontSize: 15,
      minHeight: 36,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    compactMeta: {
      fontSize: 11,
    },
    featuredMeta: {
      fontSize: 12,
    },
    footer: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    compactFooter: {
      marginTop: 6,
      gap: 6,
    },
    featuredFooter: {
      marginTop: 7,
      gap: 8,
    },
    price: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },
    compactPrice: {
      fontSize: 15,
    },
    featuredPrice: {
      fontSize: 16,
    },
    moq: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    compactMoq: {
      fontSize: 11,
    },
    featuredMoq: {
      fontSize: 12,
    },
    button: {
      backgroundColor: isDarkMode ? colors.white : colors.tabActive,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
    },
    compactButton: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
    },
    featuredButton: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 12,
    },
    buttonText: {
      color: isDarkMode ? colors.black : colors.white,
      fontSize: 13,
      fontWeight: "700",
    },
    compactButtonText: {
      fontSize: 11,
    },
    featuredButtonText: {
      fontSize: 12,
    },
  });
