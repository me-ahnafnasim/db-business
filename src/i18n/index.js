import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import bn from "./locales/bn.json";
import en from "./locales/en.json";

const resources = {
  en: { translation: en },
  bn: { translation: bn },
};

i18n.use(initReactI18next).init({
  resources,
  // Bangla is the default: the customers are Bangladeshi wholesale buyers, so the app
  // should open in their language and English should be the deliberate switch, not the
  // other way round. `fallbackLng` stays English because it is the reference locale that
  // a missing key falls back to — check:i18n enforces parity, so it should never fire.
  lng: "bn",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
