export const localeLayout = {
  en: {
    tabFontSize: 13,
    tabMinWidth: 58,
    bodyLineHeight: 22,
    buttonPaddingH: 24,
    subtitleLetterSpacing: 2.5,
    dividerLetterSpacing: 1.8,
    // Line-height multipliers, consumed by src/theme/typography.js to build the type
    // scale. Bangla needs more vertical room than Latin for its ascenders, descenders
    // (ু ৃ ্র) and the matra headline stroke, or glyphs clip.
    // Chosen so 16sp body text reproduces bodyLineHeight above exactly: 16 * 1.375 = 22.
    leading: { body: 1.375, heading: 1.25 },
  },
  bn: {
    tabFontSize: 11,
    tabMinWidth: 52,
    bodyLineHeight: 28,
    buttonPaddingH: 16,
    subtitleLetterSpacing: 0.5,
    dividerLetterSpacing: 0.5,
    // 16 * 1.75 = 28, matching bodyLineHeight above.
    leading: { body: 1.75, heading: 1.45 },
  },
};

export function getLocaleLayout(language) {
  return localeLayout[language] ?? localeLayout.en;
}
