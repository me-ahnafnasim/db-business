import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme/ThemeProvider";

export default function InfoCard({ title, subtitle, badge }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    minHeight: 120,
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
  },
  });
