import { Image, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProductSummaryCard({ product }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <Image source={{ uri: product.image }} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.meta}>{product.sku}</Text>
        <Text style={styles.meta}>{product.categoryName}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        <Text style={styles.moq}>MOQ {product.moq}</Text>
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 18,
    },
    image: {
      width: "100%",
      height: 176,
      backgroundColor: colors.surfaceSoft,
    },
    body: {
      padding: 14,
    },
    name: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 4,
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 2,
    },
    price: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "800",
      marginTop: 8,
    },
    moq: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 4,
    },
  });
