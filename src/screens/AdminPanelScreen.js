import { Pressable, StyleSheet, Text, View } from "react-native";

import StackScreenShell from "../components/StackScreenShell";
import AdminStatCard from "../features/admin/components/AdminStatCard";
import { adminLinks, adminStats } from "../features/admin/data/adminDashboard";
import { useTheme } from "../theme/ThemeProvider";

export default function AdminPanelScreen({ auth, onBack, onSignOut }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <StackScreenShell
      title="Admin Panel"
      subtitle={`Signed in as ${auth?.displayName ?? "Admin"}`}
      onBack={onBack}
    >
      <View style={styles.statsRow}>
        {adminStats.map((item) => (
          <AdminStatCard key={item.id} item={item} />
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Admin Identity</Text>
        <Text style={styles.cardMeta}>{auth?.email}</Text>
        <Text style={styles.cardMeta}>Role: {auth?.role}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Quick Links</Text>
        {adminLinks.map((link) => (
          <View key={link.id} style={styles.linkRow}>
            <Text style={styles.linkTitle}>{link.title}</Text>
            <Text style={styles.linkSubtitle}>{link.subtitle}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.button} onPress={onSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </StackScreenShell>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    statsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 18,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 16,
      marginBottom: 18,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 10,
    },
    cardMeta: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 4,
    },
    linkRow: {
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    linkTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 2,
    },
    linkSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    button: {
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.white,
      marginBottom: 20,
    },
    buttonText: {
      color: colors.black,
      fontSize: 16,
      fontWeight: "700",
    },
  });
