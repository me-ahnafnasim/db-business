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
import ErrorBoundary from "./src/ui/ErrorBoundary";

function AppContent() {
  const { status, user, error, signIn, enterGuest, signOut, completeProfile } = useAuth();

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
        onContinueAsGuest={enterGuest}
        error={error}
        loading={status === AUTH_STATUS.SIGNING_IN}
      />
    );
  }

  if (user?.role === "CLIENT" && user.requiresProfileCompletion) {
    return <ProfileCompletionScreen auth={user} onComplete={completeProfile} />;
  }

  const guestAuth = {
    isSignedIn: false,
    isGuest: true,
    role: "GUEST",
    displayName: "Guest",
  };
  const auth = status === AUTH_STATUS.GUEST ? guestAuth : user;
  const identityKey = auth?.isGuest ? "guest" : `client:${auth?.authUserId || "unknown"}`;
  return (
    <MainTabs
      key={identityKey}
      auth={auth}
      onSignIn={signIn}
      onSignOut={signOut}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <AppContent />
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
