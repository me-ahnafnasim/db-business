import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { darkColors as colors } from "../theme/colors";

export default function ProductCard({ discount, imageSize }) {
  return (
    <View style={styles.card}>
      <View style={styles.discountBadge}>
        <Text style={styles.discountText}>{discount}</Text>
      </View>

      <View style={styles.favoriteButton}>
        <Ionicons name="heart-outline" size={28} color="#9ca3af" />
      </View>

      <View style={styles.imageWrap}>
        <Text style={styles.imageText}>{imageSize}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 250,
    backgroundColor: "#121212",
    borderRadius: 28,
    padding: 18,
    position: "relative",
  },
  discountBadge: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 2,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  discountText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  favoriteButton: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 2,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrap: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
  },
  imageText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
  },
});
