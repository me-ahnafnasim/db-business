import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { getLocaleLayout } from "./layout";
import getStorage from "../utils/storage";

const STORAGE_KEY = "app_language";

// Bangla throughout: it is the default the app opens in, so it is also the default every
// fallback here lands on. A stored preference always wins over it.
const DEFAULT_LANGUAGE = "bn";

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  layout: getLocaleLayout(DEFAULT_LANGUAGE),
  setLanguage: () => {},
  toggleLanguage: () => {},
  languageLabel: "বাংলা",
});

export function LanguageProvider({ children }) {
  const { i18n, t } = useTranslation();
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadLanguage() {
      try {
        const saved = await getStorage().getItem(STORAGE_KEY);
        const initial = saved === "bn" || saved === "en" ? saved : DEFAULT_LANGUAGE;
        await i18n.changeLanguage(initial);
        setLanguageState(initial);
      } catch {
        setLanguageState(DEFAULT_LANGUAGE);
      } finally {
        setReady(true);
      }
    }

    loadLanguage();
  }, [i18n]);

  const setLanguage = useCallback(
    async (nextLanguage) => {
      if (nextLanguage !== "en" && nextLanguage !== "bn") {
        return;
      }

      await i18n.changeLanguage(nextLanguage);
      await getStorage().setItem(STORAGE_KEY, nextLanguage);
      setLanguageState(nextLanguage);
    },
    [i18n]
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "bn" : "en");
  }, [language, setLanguage]);

  const value = useMemo(
    () => ({
      language,
      layout: getLocaleLayout(language),
      setLanguage,
      toggleLanguage,
      languageLabel: language === "bn" ? t("common.bangla") : t("common.english"),
    }),
    [language, setLanguage, t, toggleLanguage]
  );

  if (!ready) {
    return <View style={styles.loading}><ActivityIndicator color="#c4950a" size="large" /></View>;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0e27",
  },
});

export function useLanguage() {
  return useContext(LanguageContext);
}
