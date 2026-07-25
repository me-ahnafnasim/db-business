import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeProvider";

export default function ProfileFooter() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.helpText}>{t("profile.needHelp", { phone: "1-800-123-4567" })}</Text>
      <Text style={styles.version}>{t("profile.version", { version: "1.0.0" })}</Text>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      paddingTop: 28,
      paddingBottom: 10,
    },
    helpText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: "center",
      marginBottom: 8,
    },
    phone: {
      color: colors.textPrimary,
      fontWeight: "700",
    },
    version: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
