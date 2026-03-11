import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { darkColors as colors } from "../theme/colors";

export default function SectionHeader({ title, action = "View All", compact = false }) {
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
      <View style={styles.actionWrap}>
        <Text style={styles.action}>{action}</Text>
        <Feather name="chevron-right" size={28} color={colors.textPrimary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactContainer: {
    marginTop: 0,
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
  },
  compactTitle: {
    fontSize: 30,
  },
  actionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  action: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
});
