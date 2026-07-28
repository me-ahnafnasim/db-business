// Locale-aware type scale.
//
// Reconciles the 21 distinct font sizes the app used into 12 named roles. Line height is
// derived per locale from the multipliers in src/i18n/layout.js, which is why this must
// be a hook rather than a static export — Bangla and English need different leading, and
// the app must re-render when the language toggles.
//
// Both locales are built once at module load and frozen. Building inside a per-consumer
// useMemo would hand every caller a distinct object and defeat the memoisation in
// useStyles, so the cache is the whole point.

import { useLanguage } from "../i18n/LanguageProvider";
import { localeLayout } from "../i18n/layout";

const HEADING = "heading";
const BODY = "body";

const SCALE = {
  display: { fontSize: 32, fontWeight: "800", leading: HEADING },
  h1: { fontSize: 28, fontWeight: "800", leading: HEADING },
  h2: { fontSize: 24, fontWeight: "800", leading: HEADING },
  h3: { fontSize: 20, fontWeight: "700", leading: HEADING },
  h4: { fontSize: 18, fontWeight: "700", leading: HEADING },
  body: { fontSize: 16, fontWeight: "400", leading: BODY },
  bodyStrong: { fontSize: 16, fontWeight: "700", leading: BODY },
  bodySm: { fontSize: 14, fontWeight: "400", leading: BODY },
  label: { fontSize: 13, fontWeight: "600", leading: BODY },
  caption: { fontSize: 12, fontWeight: "500", leading: BODY },
  micro: { fontSize: 11, fontWeight: "700", leading: BODY },
  // Never below 16: smaller input text triggers zoom on iOS and crowds Bangla conjuncts.
  input: { fontSize: 16, fontWeight: "500", leading: BODY },
};

function build(language) {
  const { leading } = localeLayout[language] ?? localeLayout.en;
  const roles = {};
  for (const [role, spec] of Object.entries(SCALE)) {
    roles[role] = Object.freeze({
      fontSize: spec.fontSize,
      fontWeight: spec.fontWeight,
      lineHeight: Math.round(spec.fontSize * leading[spec.leading]),
    });
  }
  return Object.freeze(roles);
}

const CACHE = Object.freeze(
  Object.fromEntries(Object.keys(localeLayout).map((language) => [language, build(language)]))
);

export const TYPOGRAPHY_ROLES = Object.freeze(Object.keys(SCALE));

// Caps how far OS font scaling can stretch text. Without it, a user at "largest" font
// size breaks every fixed-height row and the five-item tab bar.
export const TEXT_SCALING = Object.freeze({
  allowFontScaling: true,
  maxFontSizeMultiplier: 1.4,
});

export function getTypography(language) {
  return CACHE[language] ?? CACHE.en;
}

export function useTypography() {
  const { language } = useLanguage();
  return getTypography(language);
}
