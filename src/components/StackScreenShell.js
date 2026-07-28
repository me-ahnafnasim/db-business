import Feather from "@expo/vector-icons/Feather";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { elevation, spacing, useStyles, useTheme } from "../theme";
import { AppText, IconButton } from "../ui";

// Layout for pushed screens: back button, title, body, optional sticky footer.

export default function StackScreenShell({
  title,
  subtitle,
  onBack,
  scrollable = true,
  footer,
  refreshControl,
  children,
}) {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const ContentWrapper = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        contentContainerStyle: styles.scrollContent,
        refreshControl,
      }
    : {
        style: styles.fixedContent,
      };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={colors.surface} />
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton label={t("common.back")} onPress={onBack}>
            <Feather name="chevron-left" size={22} color={colors.textPrimary} />
          </IconButton>
          <View style={styles.headerText}>
            <AppText variant="h2">{title}</AppText>
            {subtitle ? (
              <AppText variant="bodySm" tone="secondary" style={styles.subtitle}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </View>
        <ContentWrapper {...contentProps}>{children}</ContentWrapper>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg - 2,
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.lg - 2,
      paddingBottom: spacing.lg - 2,
      backgroundColor: colors.surface,
    },
    headerText: {
      flex: 1,
    },
    subtitle: {
      marginTop: spacing.xs,
    },
    scrollContent: {
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxxl,
    },
    fixedContent: {
      flex: 1,
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.xl,
    },
    footer: {
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg + 2,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      // A sticky footer floats over the scrolling body, so it earns a shadow.
      ...elevation(1, colors.shadow),
    },
  });
