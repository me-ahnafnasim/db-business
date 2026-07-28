import { useCallback, useRef } from "react";
import { Alert, BackHandler } from "react-native";
import { useTranslation } from "react-i18next";

// Confirms before closing the app.
//
// Returned as a back-press handler: it always reports the press as consumed, so Android
// never closes the app on its own. The ref guards against a rapid double-press stacking two
// dialogs. Follows the same Alert shape as the clear-cart confirmation.
export function useExitConfirm() {
  const { t } = useTranslation();
  const openRef = useRef(false);

  return useCallback(() => {
    if (openRef.current) return true;
    openRef.current = true;
    const close = () => { openRef.current = false; };

    Alert.alert(
      t("app.exitTitle"),
      t("app.exitMessage"),
      [
        { text: t("common.cancel"), style: "cancel", onPress: close },
        {
          text: t("common.exit"),
          style: "destructive",
          onPress: () => { close(); BackHandler.exitApp(); },
        },
      ],
      { onDismiss: close }
    );
    return true;
  }, [t]);
}

export default useExitConfirm;
