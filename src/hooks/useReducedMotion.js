import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

// True when the user has asked the system to remove animations.
//
// Components should still render the END state — a reduced-motion user gets the same UI,
// it just arrives instantly rather than transitioning.
//
// One module-level native subscription shared by every caller. The carousel, the festival
// banner and others use this at once, and each instance used to register its own
// AccessibilityInfo listener and fire its own initial async read.
let reduced = false;
const listeners = new Set();
let started = false;

function publish(value) {
  if (Boolean(value) === reduced) return;
  reduced = Boolean(value);
  listeners.forEach((listener) => listener());
}

function ensureStarted() {
  if (started) return;
  started = true;
  AccessibilityInfo.isReduceMotionEnabled().then(publish).catch(() => {});
  // Never removed: the setting can change at any point in the app's life, and one listener
  // for the whole process is the entire point of sharing it.
  AccessibilityInfo.addEventListener("reduceMotionChanged", publish);
}

function subscribe(listener) {
  ensureStarted();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return reduced;
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export default useReducedMotion;
