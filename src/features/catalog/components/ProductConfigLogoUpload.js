import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProductConfigLogoUpload({ fileName, onSelect, onRemove }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Custom Logo</Text>
      <View style={styles.card}>
        <View style={styles.info}>
          <Feather name="upload" size={18} color={colors.textPrimary} />
          <View style={styles.textWrap}>
            <Text style={styles.label}>{fileName ? fileName : "Upload logo artwork"}</Text>
            <Text style={styles.helper}>Optional placeholder upload for logo customization</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={onSelect}>
            <Text style={styles.actionText}>{fileName ? "Change" : "Choose File"}</Text>
          </Pressable>
          {fileName ? (
            <Pressable style={styles.removeButton} onPress={onRemove}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    section: {
      marginBottom: 16,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 10,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
      backgroundColor: colors.surfaceSoft,
      gap: 12,
    },
    info: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    textWrap: {
      flex: 1,
    },
    label: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 4,
    },
    helper: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    actionText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    removeButton: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    removeText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
    },
  });
