import { useEffect, useRef, useState } from "react";

import NetInfo from "@react-native-community/netinfo";

// True when the device has no usable internet connection.
//
// The app had no connectivity awareness at all: a request on a dead connection surfaced as
// "Cannot reach the server", which reads as "the shop is broken" rather than "you are
// offline". For a wholesale buyer on patchy mobile data that distinction is the whole
// difference between retrying and giving up.
//
// Two deliberate asymmetries:
//
//   - `isInternetReachable` is null while NetInfo is still probing, and treating null as
//     offline would flash the banner on every cold start. Only an explicit `false` counts.
//   - Going offline waits out a grace period, so a cell handover or a lift ride does not
//     flash the banner. Coming back online clears it immediately — there is no reason to
//     keep telling someone they are offline once they are not.
const OFFLINE_GRACE_MS = 1500;

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const graceTimer = useRef(null);

  useEffect(() => {
    const clearGrace = () => {
      if (graceTimer.current) {
        clearTimeout(graceTimer.current);
        graceTimer.current = null;
      }
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      clearGrace();

      if (!offline) {
        setIsOffline(false);
        return;
      }
      graceTimer.current = setTimeout(() => setIsOffline(true), OFFLINE_GRACE_MS);
    });

    return () => {
      unsubscribe();
      clearGrace();
    };
  }, []);

  return isOffline;
}

export default useNetworkStatus;
