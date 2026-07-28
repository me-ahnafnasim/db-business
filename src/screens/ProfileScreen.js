import { useState } from "react";

import { Alert, Linking, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import LanguageToggle from "../components/LanguageToggle";
import ScreenShell from "../components/ScreenShell";
import { env } from "../config/env";
import ProfileFooter from "../features/profile/components/ProfileFooter";
import ProfileListCard from "../features/profile/components/ProfileListCard";
import ProfileSectionTag from "../features/profile/components/ProfileSectionTag";
import ProfileSignInCard from "../features/profile/components/ProfileSignInCard";
import ProfileSingleRowCard from "../features/profile/components/ProfileSingleRowCard";
import ProfileWelcomeCard from "../features/profile/components/ProfileWelcomeCard";
import { legalItems, settingsItems, supportItems } from "../features/profile/data/profileMenu";
import { useLanguage } from "../i18n/LanguageProvider";
import { spacing, useStyles, useTheme } from "../theme";
import { AppText, Button, Dialog } from "../ui";

export default function ProfileScreen({
  activeTab,
  onTabPress,
  cartCount,
  auth,
  onSignOut,
  onOrdersPress,
  onExpenseTrackerPress,
  onHelpCenterPress,
}) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const openExternalUrl = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t("profile.linkErrorTitle"), t("profile.linkErrorMessage"));
    }
  };

  const handleSupportItemPress = (key) => {
    const routes = {
      privacy: "/privacy/",
      terms: "/terms/",
      returns: "/returns/",
    };

    if (key === "help-center") {
      onHelpCenterPress?.();
      return;
    }

    if (key === "customer-service") {
      openExternalUrl(
        `https://wa.me/393202935579?text=${encodeURIComponent(
          t("profile.supportMessage")
        )}`
      );
      return;
    }

    if (routes[key]) {
      openExternalUrl(`${env.webUrl}${routes[key]}`);
      return;
    }

    if (key === "delete-account") {
      setDeleteDialogVisible(true);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogVisible(false);
  };

  const contactAdminForDeletion = () => {
    setDeleteDialogVisible(false);
    openExternalUrl(
      `https://wa.me/393202935579?text=${encodeURIComponent(
        t("profile.deleteAccountWhatsAppMessage")
      )}`
    );
  };

  const deleteDialogTitle = t("profile.deleteAccountTitle");
  const deleteDialogMessage = t("profile.deleteAccountMessage");

  return (
    <>
      <ScreenShell
        activeTab={activeTab}
        onTabPress={onTabPress}
        cartCount={cartCount}
        showHeader={false}
        padded
      >
        <View style={styles.languageRow}>
          <LanguageToggle variant="light" />
        </View>
        <ProfileWelcomeCard auth={auth} />
        <ProfileSignInCard auth={auth} onSignOut={onSignOut} />
        {auth?.role === "CLIENT" ? (
          <>
            <ProfileSingleRowCard icon="truck" labelKey="profile.trackOrder" onPress={onOrdersPress} />
            <ProfileSingleRowCard icon="credit-card" labelKey="profile.expenseTracker" onPress={onExpenseTrackerPress} />
          </>
        ) : null}
        <ProfileSectionTag label={t("profile.support")} />
        <ProfileListCard items={supportItems} onSupportItemPress={handleSupportItemPress} />
        <ProfileSectionTag label={t("profile.legal")} />
        <ProfileListCard items={legalItems} onSupportItemPress={handleSupportItemPress} />
        <ProfileSectionTag label={t("profile.settings")} />
        <ProfileListCard
          items={settingsItems}
          onThemePress={toggleTheme}
          onLanguagePress={toggleLanguage}
          themeValue={isDarkMode ? t("profile.dark") : t("profile.light")}
        />
        <ProfileFooter />
      </ScreenShell>

      <Dialog
        visible={deleteDialogVisible}
        onDismiss={closeDeleteDialog}
        accessibilityLabel={`${deleteDialogTitle} ${deleteDialogMessage}`}
      >
        <AppText variant="h2" style={styles.dialogTitle}>
          {deleteDialogTitle}
        </AppText>
        <AppText variant="body" tone="secondary" style={styles.dialogBody}>
          {deleteDialogMessage}
        </AppText>

        <View style={styles.dialogActions}>
          <Button
            title={t("common.cancel")}
            onPress={closeDeleteDialog}
            variant="secondary"
            size="lg"
          />
          <Button
            title={t("profile.deleteAccountContactAdmin")}
            onPress={contactAdminForDeletion}
            variant="danger"
            size="lg"
          />
        </View>
      </Dialog>
    </>
  );
}

const getStyles = () =>
  StyleSheet.create({
    languageRow: {
      alignItems: "flex-end",
      marginBottom: spacing.md,
    },
    dialogTitle: {
      marginBottom: spacing.md,
    },
    dialogBody: {
      marginBottom: spacing.xxl,
    },
    dialogActions: {
      gap: spacing.md,
    },
  });
