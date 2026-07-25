import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../components/BottomNav";
import LanguageToggle from "../components/LanguageToggle";
import ProfileFooter from "../features/profile/components/ProfileFooter";
import ProfileListCard from "../features/profile/components/ProfileListCard";
import ProfileSectionTag from "../features/profile/components/ProfileSectionTag";
import ProfileSignInCard from "../features/profile/components/ProfileSignInCard";
import ProfileSingleRowCard from "../features/profile/components/ProfileSingleRowCard";
import ProfileWelcomeCard from "../features/profile/components/ProfileWelcomeCard";
import { settingsItems, supportItems } from "../features/profile/data/profileMenu";
import { useLanguage } from "../i18n/LanguageProvider";
import { useTheme } from "../theme/ThemeProvider";

export default function ProfileScreen({
  activeTab,
  onTabPress,
  cartCount,
  auth,
  onSignOut,
  onOrdersPress,
  onExpenseTrackerPress,
}) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const { toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.languageRow}>
            <LanguageToggle variant="light" />
          </View>
          <ProfileWelcomeCard auth={auth} />
          <ProfileSignInCard
            auth={auth}
            onSignOut={onSignOut}
          />
          {auth?.role === "CLIENT" ? (
            <>
              <ProfileSingleRowCard icon="truck" labelKey="profile.trackOrder" onPress={onOrdersPress} />
              <ProfileSingleRowCard icon="credit-card" labelKey="profile.expenseTracker" onPress={onExpenseTrackerPress} />
            </>
          ) : null}
          <ProfileSectionTag label={t("profile.support")} />
          <ProfileListCard items={supportItems} />
          <ProfileSectionTag label={t("profile.settings")} />
          <ProfileListCard
            items={settingsItems}
            onThemePress={toggleTheme}
            onLanguagePress={toggleLanguage}
            themeValue={isDarkMode ? t("profile.dark") : t("profile.light")}
          />
          <ProfileFooter />
        </ScrollView>

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
    content: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 18,
    },
    languageRow: {
      alignItems: "flex-end",
      marginBottom: 12,
    },
  });
