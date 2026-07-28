import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// True when the user has asked the system to remove animations.
//
// Components should still render the END state — a reduced-motion user gets the same UI,
// it just arrives instantly rather than transitioning.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (!cancelled) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return reduced;
}

export default useReducedMotion;
