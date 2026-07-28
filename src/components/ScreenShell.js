import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "./BottomNav";
import Header from "./Header";
import { spacing, useStyles, useTheme } from "../theme";
import { ScreenTitle } from "../ui";

// Layout for the five tab screens: header, optional title block, body, bottom nav.
//
// `showHeader` and the optional `title` exist because Home and Profile each used to
// re-implement this entire component just to opt out of one part of it.

export default function ScreenShell({
  activeTab,
  onTabPress,
  onProfilePress,
  onSearchPress,
  onCartPress,
  cartCount,
  auth,
  title,
  subtitle,
  headerActionLabel,
  onHeaderAction,
  showHeader = true,
  padded = false,
  contentContainerStyle,
  children,
  scrollable = true,
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = useStyles(getStyles);
  const ContentWrapper = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        contentContainerStyle: [styles.scrollContent, padded && styles.padded, contentContainerStyle],
      }
    : { style: [styles.fixedContent, padded && styles.padded] };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={colors.surface} />
      <View style={styles.container}>
        {showHeader ? (
          <Header
            onProfilePress={onProfilePress}
            onSearchPress={onSearchPress}
            onCartPress={onCartPress}
            cartCount={cartCount}
            auth={auth}
          />
        ) : null}
        <ContentWrapper {...contentProps}>
          {title ? (
            <ScreenTitle
              title={title}
              subtitle={subtitle}
              actionLabel={headerActionLabel}
              onAction={onHeaderAction}
            />
          ) : null}
          {children}
        </ContentWrapper>
        <BottomNav activeTab={activeTab} onTabPress={onTabPress} cartCount={cartCount} />
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
    scrollContent: {
      paddingBottom: spacing.xl,
    },
    fixedContent: {
      flex: 1,
    },
    padded: {
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.lg,
    },
  });
