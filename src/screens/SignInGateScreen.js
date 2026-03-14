import { Pressable, StyleSheet, Text } from "react-native";

import StackScreenShell from "../components/StackScreenShell";
import SignInForm from "../features/auth/components/SignInForm";
import { useTheme } from "../theme/ThemeProvider";

export default function SignInGateScreen({ onBack, onSignIn, errorMessage }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <StackScreenShell
      title="Sign In"
      subtitle="Sign in to continue to checkout"
      onBack={onBack}
    >
      <SignInForm onSubmit={onSignIn} errorMessage={errorMessage} />
      <Text style={styles.helper}>Admin: `admin@example.com` / `admin123` / role `admin` · User: `user@example.com` / `user123` / role `user`</Text>
      <Pressable style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryText}>Back to Cart</Text>
      </Pressable>
    </StackScreenShell>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    helper: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 22,
      marginTop: 14,
    },
    secondaryButton: {
      marginTop: 18,
      height: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    secondaryText: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
