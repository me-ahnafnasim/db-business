import { useEffect } from "react";
import { BackHandler } from "react-native";

// Subscribes to the Android hardware back button for as long as the component is mounted.
//
// The handler must return true to say "I consumed this press" and false to let Android take
// it — which closes the app. Every screen in this app returns true, so exiting only ever
// happens through an explicit confirmation.
//
// Pass a stable `handler` (useCallback) or accept that the listener re-subscribes on each
// change; re-subscribing is cheap, but an unstable handler in a hot-rendering component will
// churn. Android runs listeners in reverse registration order, so the most recently mounted
// screen wins — which is what we want when a screen mounts on top of another.
export function useBackHandler(handler) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", handler);
    return () => subscription.remove();
  }, [handler]);
}

export default useBackHandler;
