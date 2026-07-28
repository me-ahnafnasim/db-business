import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { spacing, useStyles } from "../../../theme";
import { AppText } from "../../../ui";
import appPackage from "../../../../package.json";

export default function ProfileFooter() {
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  return (
    <View style={styles.container}>
      <AppText variant="bodySm" tone="secondary" style={styles.helpText}>
        {t("profile.needHelp")}
      </AppText>
      <AppText variant="label" tone="secondary" style={styles.version}>
        {t("profile.version", { version: appPackage.version })}
      </AppText>
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.sm + 2,
    },
    helpText: {
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    version: {
      fontWeight: "400",
    },
  });
