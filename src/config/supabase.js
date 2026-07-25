import "react-native-url-polyfill/auto";

import { createClient, processLock } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

import { assertSupabaseConfig, env } from "./env";
import getStorage from "../utils/storage";

assertSupabaseConfig();

const storageAdapter = getStorage();

export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
    lock: processLock,
  },
});

export function installAuthAutoRefresh() {
  if (Platform.OS === "web") return () => {};

  if (AppState.currentState === "active") supabase.auth.startAutoRefresh();
  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });

  return () => {
    subscription.remove();
    supabase.auth.stopAutoRefresh();
  };
}
