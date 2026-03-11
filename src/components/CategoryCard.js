import { StyleSheet, Text, View } from "react-native";

import { darkColors as colors } from "../theme/colors";

export default function CategoryCard({ title, color, size }) {
  return (
    <View style={[styles.card, { backgroundColor: color }]}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imageText}>{size}</Text>
      </View>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginRight: 18,
  },
  imagePlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  imageText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
});
