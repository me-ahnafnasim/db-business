import { env, assertGoogleAuthConfig } from "../../../config/env";
import { supabase } from "../../../config/supabase";
import i18n from "../../../i18n";

let googleModule;
let configured = false;

function getGoogleModule() {
  if (googleModule) return googleModule;

  try {
    googleModule = require("@react-native-google-signin/google-signin");
    return googleModule;
  } catch (error) {
    const nativeModuleMissing =
      error?.message?.includes("RNGoogleSignin") ||
      error?.message?.includes("TurboModuleRegistry");

    if (nativeModuleMissing) {
      const configurationError = new Error(
        i18n.t("errors.googleOutdated")
      );
      configurationError.code = "NATIVE_MODULE_MISSING";
      throw configurationError;
    }
    throw error;
  }
}

function getConfiguredGoogleModule() {
  assertGoogleAuthConfig();
  const module = getGoogleModule();
  if (!configured) {
    module.GoogleSignin.configure({
      webClientId: env.googleWebClientId,
      offlineAccess: false,
    });
    configured = true;
  }
  return module;
}

export async function signInWithGoogleProvider() {
  const module = getConfiguredGoogleModule();
  await module.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await module.GoogleSignin.signIn();
  if (!module.isSuccessResponse(response)) return null;

  const token = response.data.idToken;
  if (!token) throw new Error(i18n.t("errors.googleToken"));

  const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token });
  if (error) throw error;
  return { session: data.session, user: data.user };
}

export async function signOutGoogleProvider() {
  try {
    await getConfiguredGoogleModule().GoogleSignin.signOut();
  } catch (error) {
    if (error?.code !== "NATIVE_MODULE_MISSING") throw error;
  }
}

export function getGoogleAuthErrorMessage(error) {
  const code = String(error?.code || "");
  if (code === "NATIVE_MODULE_MISSING") return error.message;
  if (code === "10" || code === "DEVELOPER_ERROR") {
    return i18n.t("errors.googleConfiguration");
  }
  if (code.includes("PLAY_SERVICES_NOT_AVAILABLE")) {
    return i18n.t("errors.playServices");
  }
  if (code.includes("IN_PROGRESS")) return i18n.t("errors.signInProgress");
  return error?.message || i18n.t("errors.googleFailed");
}
