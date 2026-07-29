import { useSyncExternalStore } from "react";
import { AppState } from "react-native";

// True while the app is in the foreground.
//
// Components that drive a repeating timer combine this with their own visibility, so a
// countdown or an auto-advancing carousel stops burning renders once nobody can see it.
//
// One module-level AppState subscription shared by every caller, instead of one native
// listener per component instance.
let foreground = AppState.currentState === "active";
const listeners = new Set();
let started = false;

function ensureStarted() {
  if (started) return;
  started = true;
  AppState.addEventListener("change", (state) => {
    const next = state === "active";
    if (next === foreground) return;
    foreground = next;
    listeners.forEach((listener) => listener());
  });
}

function subscribe(listener) {
  ensureStarted();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return foreground;
}

export function useIsAppForeground() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export default useIsAppForeground;
