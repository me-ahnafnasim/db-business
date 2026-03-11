import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileSectionTag({ label }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.tag}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    tag: {
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 14,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
  });
