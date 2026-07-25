
const GOOGLE_WEB_CLIENT_ID =
  "1029591703083-h56ftm0r97ni2g9cj1a7od95n86o8aqb.apps.googleusercontent.com";

const API_URL = "https://nobosole-backend.vercel.app/api/v1";

function trimTrailingSlash(value) {
  return value?.replace(/\/+$/, "");
}

export const env = Object.freeze({
  apiUrl: trimTrailingSlash(
    process.env.EXPO_PUBLIC_API_URL || API_URL
  ),
  googleWebClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
  supabaseUrl: trimTrailingSlash(process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  webUrl: trimTrailingSlash(
    process.env.EXPO_PUBLIC_WEB_URL ||
      (typeof window !== "undefined" ? window.location.origin : "")
  ),
});

export function assertGoogleAuthConfig() {
  if (env.googleWebClientId !== GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      "Google Sign-In is configured with a client ID from the wrong Google project. Check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID."
    );
  }
}

export function assertSupabaseConfig() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then rebuild."
    );
  }
}
