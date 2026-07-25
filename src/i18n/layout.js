export const localeLayout = {
  en: {
    tabFontSize: 13,
    tabMinWidth: 58,
    bodyLineHeight: 22,
    buttonPaddingH: 24,
    subtitleLetterSpacing: 2.5,
    dividerLetterSpacing: 1.8,
  },
  bn: {
    tabFontSize: 11,
    tabMinWidth: 52,
    bodyLineHeight: 28,
    buttonPaddingH: 16,
    subtitleLetterSpacing: 0.5,
    dividerLetterSpacing: 0.5,
  },
};

export function getLocaleLayout(language) {
  return localeLayout[language] ?? localeLayout.en;
}
