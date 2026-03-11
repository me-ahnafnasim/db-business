import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "./BottomNav";
import Header from "./Header";
import { useTheme } from "../theme/ThemeProvider";

export default function ScreenShell({
  activeTab,
  onTabPress,
  onProfilePress,
  onSearchPress,
  onCartPress,
  cartCount,
  title,
  subtitle,
  headerActionLabel,
  onHeaderAction,
  children,
  scrollable = true,
}) {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors);
  const ContentWrapper = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        contentContainerStyle: styles.scrollContent,
      }
    : { style: styles.fixedContent };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={colors.surface} />
      <View style={styles.container}>
        <Header
          onProfilePress={onProfilePress}
          onSearchPress={onSearchPress}
          onCartPress={onCartPress}
          cartCount={cartCount}
        />
        <ContentWrapper {...contentProps}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.title}>{title}</Text>
              {headerActionLabel ? (
                <Text style={styles.headerAction} onPress={onHeaderAction}>
                  {headerActionLabel}
                </Text>
              ) : null}
            </View>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
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
    paddingBottom: 18,
  },
  fixedContent: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    flex: 1,
  },
  headerAction: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 18,
    marginTop: 6,
  },
  });
