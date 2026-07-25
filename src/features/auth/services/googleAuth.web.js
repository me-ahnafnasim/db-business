import { env } from "../../../config/env";
import { supabase } from "../../../config/supabase";
import i18n from "../../../i18n";

export async function signInWithGoogleProvider() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: env.webUrl },
  });
  if (error) throw error;
  return { redirecting: true };
}

export async function signOutGoogleProvider() {}

export function getGoogleAuthErrorMessage(error) {
  return error?.message || i18n.t("errors.googleFailed");
}
