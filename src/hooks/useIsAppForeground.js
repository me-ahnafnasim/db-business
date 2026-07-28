import { useEffect, useState } from "react";
import { AppState } from "react-native";

// True while the app is in the foreground.
//
// Components that drive a repeating timer combine this with their own visibility, so a
// countdown or an auto-advancing carousel stops burning renders once nobody can see it.

export function useIsAppForeground() {
  const [foreground, setForeground] = useState(() => AppState.currentState === "active");

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
    });
    return () => subscription.remove();
  }, []);

  return foreground;
}

export default useIsAppForeground;
