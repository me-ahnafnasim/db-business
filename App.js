import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  AUTH_STATUS,
  AuthProvider,
  useAuth,
} from "./src/features/auth/AuthProvider";
import { LanguageProvider } from "./src/i18n/LanguageProvider";
import "./src/i18n";
import LaunchScreen from "./src/screens/LaunchScreen";
import MainTabs from "./src/screens/MainTabs";
import ProfileCompletionScreen from "./src/screens/ProfileCompletionScreen";
import { ThemeProvider } from "./src/theme/ThemeProvider";

function AppContent() {
  const { status, user, error, signIn, signOut, completeProfile } = useAuth();

  if (
    status === AUTH_STATUS.RESTORING ||
    status === AUTH_STATUS.SIGNING_OUT
  ) {
    return <LaunchScreen onGoogleLogin={() => {}} loading />;
  }

  if (
    status === AUTH_STATUS.SIGNED_OUT ||
    status === AUTH_STATUS.SIGNING_IN
  ) {
    return (
      <LaunchScreen
        onGoogleLogin={signIn}
        error={error}
        loading={status === AUTH_STATUS.SIGNING_IN}
      />
    );
  }

  if (user?.role === "CLIENT" && user.requiresProfileCompletion) {
    return <ProfileCompletionScreen auth={user} onComplete={completeProfile} />;
  }

  return <MainTabs auth={user} onSignOut={signOut} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
