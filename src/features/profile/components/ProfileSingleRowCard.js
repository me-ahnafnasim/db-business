import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { radius, spacing, useStyles } from "../../../theme";
import ProfileRow from "./ProfileRow";

export default function ProfileSingleRowCard({ icon = "truck", labelKey = "profile.trackOrder", onPress }) {
  const { t } = useTranslation();
  const styles = useStyles(getStyles);

  return (
    <View style={styles.card}>
      <ProfileRow icon={icon} label={t(labelKey)} onPress={onPress} />
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      overflow: "hidden",
      marginBottom: spacing.lg + 2,
    },
  });
