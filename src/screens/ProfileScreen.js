import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "../components/BottomNav";
import ProfileFooter from "../features/profile/components/ProfileFooter";
import ProfileListCard from "../features/profile/components/ProfileListCard";
import ProfileSectionTag from "../features/profile/components/ProfileSectionTag";
import ProfileSignInCard from "../features/profile/components/ProfileSignInCard";
import ProfileSingleRowCard from "../features/profile/components/ProfileSingleRowCard";
import ProfileWelcomeCard from "../features/profile/components/ProfileWelcomeCard";
import { settingsItems, supportItems } from "../features/profile/data/profileMenu";
import { useTheme } from "../theme/ThemeProvider";

export default function ProfileScreen({ activeTab, onTabPress, cartCount }) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ProfileWelcomeCard />
          <ProfileSignInCard />
          <ProfileSingleRowCard />
          <ProfileSectionTag label="Support" />
          <ProfileListCard items={supportItems} />
          <ProfileSectionTag label="Settings" />
          <ProfileListCard
            items={settingsItems}
            onThemePress={toggleTheme}
            themeValue={isDarkMode ? "Dark" : "Light"}
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
  });
