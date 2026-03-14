import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";

import { useTheme } from "../../../theme/ThemeProvider";

export default function SignInForm({ onSubmit, errorMessage }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [displayName, setDisplayName] = useState("Normal User");
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("user123");
  const [role, setRole] = useState("user");

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Sign in to continue</Text>
      <Text style={styles.subtitle}>Checkout requires a signed-in account in this app flow.</Text>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Display name"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        style={styles.input}
      />
      <View style={styles.roleRow}>
        <Pressable
          style={[styles.roleButton, role === "user" && styles.roleButtonActive]}
          onPress={() => setRole("user")}
        >
          <Text style={[styles.roleButtonText, role === "user" && styles.roleButtonTextActive]}>User</Text>
        </Pressable>
        <Pressable
          style={[styles.roleButton, role === "admin" && styles.roleButtonActive]}
          onPress={() => setRole("admin")}
        >
          <Text style={[styles.roleButtonText, role === "admin" && styles.roleButtonTextActive]}>Admin</Text>
        </Pressable>
      </View>
      <Pressable style={styles.button} onPress={() => onSubmit?.({ displayName, email, password, role })}>
        <Text style={styles.buttonText}>Sign In</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 8,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 18,
    },
    errorText: {
      color: "#ef4444",
      fontSize: 14,
      marginBottom: 12,
      fontWeight: "600",
    },
    input: {
      height: 50,
      borderRadius: 16,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
      paddingHorizontal: 16,
      fontSize: 16,
      marginBottom: 12,
    },
    button: {
      marginTop: 6,
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.white,
    },
    buttonText: {
      color: colors.black,
      fontSize: 16,
      fontWeight: "700",
    },
    roleRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    roleButton: {
      flex: 1,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    roleButtonActive: {
      backgroundColor: colors.white,
      borderColor: colors.white,
    },
    roleButtonText: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    roleButtonTextActive: {
      color: colors.black,
    },
  });
