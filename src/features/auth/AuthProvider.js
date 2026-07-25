import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import i18n from "../../i18n";

import { installAuthAutoRefresh, supabase } from "../../config/supabase";
import { ApiError, bootstrapAuth } from "../../services/api";
import {
  getGoogleAuthErrorMessage,
  signInWithGoogleProvider,
  signOutGoogleProvider,
} from "./services/googleAuth";

const AuthContext = createContext(null);

export const AUTH_STATUS = Object.freeze({
  RESTORING: "restoring",
  SIGNED_OUT: "signed-out",
  SIGNING_IN: "signing-in",
  SIGNED_IN: "signed-in",
  SIGNING_OUT: "signing-out",
});

function normalizeRole(role) {
  return role ? String(role).toUpperCase() : "CLIENT";
}

function userFromBootstrap(data, authUser) {
  if (data?.accountType !== "CLIENT") {
    throw new ApiError(
      "This Google account belongs to the staff dashboard and cannot use the customer app.",
      { code: "CLIENT_ACCOUNT_REQUIRED" }
    );
  }
  const metadata = authUser?.user_metadata || {};
  return {
    isSignedIn: true,
    accountType: data.accountType,
    role: normalizeRole(data.role),
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    email: data.client?.email || authUser?.email || "",
    displayName:
      data.client?.displayName ||
      data.fullName ||
      metadata.full_name ||
      metadata.name ||
      "User",
    photoUrl:
      data.client?.profileImageUrl || metadata.avatar_url || metadata.picture || null,
    requiresProfileCompletion: Boolean(data.requiresProfileCompletion),
    redirect: data.redirect || "/app",
  };
}

function getAuthErrorMessage(error) {
  if (["NETWORK_ERROR", "REQUEST_TIMEOUT", "CONFIGURATION_ERROR"].includes(error?.code)) {
    const key = error.code === "NETWORK_ERROR" ? "errors.network" : error.code === "REQUEST_TIMEOUT" ? "errors.timeout" : "errors.configuration";
    return i18n.t(key);
  }
  if (error?.code === "AUTH_MIGRATED") {
    return i18n.t("errors.authMigrated");
  }
  if (error?.code === "CLIENT_ACCOUNT_REQUIRED") {
    return i18n.t("errors.clientOnly");
  }
  return getGoogleAuthErrorMessage(error);
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState(AUTH_STATUS.RESTORING);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const restoreSession = useCallback(async () => {
    setStatus(AUTH_STATUS.RESTORING);
    setError(null);

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) {
        setUser(null);
        setStatus(AUTH_STATUS.SIGNED_OUT);
        return;
      }

      const account = await bootstrapAuth();
      setUser(userFromBootstrap(account, data.session.user));
      setStatus(AUTH_STATUS.SIGNED_IN);
    } catch (restoreError) {
      await supabase.auth.signOut({ scope: "local" });
      setUser(null);
      setError(getAuthErrorMessage(restoreError));
      setStatus(AUTH_STATUS.SIGNED_OUT);
    }
  }, []);

  useEffect(() => {
    const uninstallAutoRefresh = installAuthAutoRefresh();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setStatus(AUTH_STATUS.SIGNED_OUT);
      }
    });

    restoreSession();
    return () => {
      listener.subscription.unsubscribe();
      uninstallAutoRefresh();
    };
  }, [restoreSession]);

  const signIn = useCallback(async () => {
    if (status === AUTH_STATUS.SIGNING_IN) return;

    setStatus(AUTH_STATUS.SIGNING_IN);
    setError(null);

    try {
      const providerResult = await signInWithGoogleProvider();
      if (!providerResult) {
        setStatus(AUTH_STATUS.SIGNED_OUT);
        return;
      }
      if (providerResult.redirecting) return;

      const account = await bootstrapAuth();
      setUser(userFromBootstrap(account, providerResult.user));
      setStatus(AUTH_STATUS.SIGNED_IN);
    } catch (signInError) {
      await supabase.auth.signOut({ scope: "local" });
      setUser(null);
      setError(getAuthErrorMessage(signInError));
      setStatus(AUTH_STATUS.SIGNED_OUT);
    }
  }, [status]);

  const signOut = useCallback(async () => {
    setStatus(AUTH_STATUS.SIGNING_OUT);
    setError(null);

    await Promise.allSettled([
      supabase.auth.signOut({ scope: "local" }),
      signOutGoogleProvider(),
    ]);
    setUser(null);
    setStatus(AUTH_STATUS.SIGNED_OUT);
  }, []);

  const completeProfile = useCallback(async () => {
    setStatus(AUTH_STATUS.RESTORING);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const account = await bootstrapAuth();
      setUser(userFromBootstrap(account, data.session?.user));
      setStatus(AUTH_STATUS.SIGNED_IN);
    } catch (profileError) {
      setError(profileError.message || i18n.t("errors.profileRefresh"));
      setStatus(AUTH_STATUS.SIGNED_IN);
      throw profileError;
    }
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      error,
      isBusy:
        status === AUTH_STATUS.RESTORING ||
        status === AUTH_STATUS.SIGNING_IN ||
        status === AUTH_STATUS.SIGNING_OUT,
      signIn,
      signOut,
      completeProfile,
      clearError: () => setError(null),
      restoreSession,
    }),
    [completeProfile, error, restoreSession, signIn, signOut, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
