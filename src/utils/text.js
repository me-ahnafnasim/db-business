// U+200B. Invisible, zero-width, and a legal line-break opportunity — so the text engine may
// break between the two characters it sits between.
const ZERO_WIDTH_SPACE = "​";

// Lets a line break fall between any two characters, so a line fills to the edge instead of
// pushing a whole word down and leaving a ragged gap behind it.
//
// Why this and not something simpler:
//
//   - React Native has no `word-break: break-all`. There is no style for this.
//   - `textAlign: "justify"` solves a different problem. It stretches the spaces BETWEEN
//     words to reach the margin, which on a narrow column moves the gap into the middle of
//     the line rather than removing it — and Android only honours it from API 26 anyway.
//   - `android_hyphenationFrequency` works, but only on Android and only where the hyphen
//     dictionary has an opinion. It does nothing at all on web.
//
// A zero-width space is the one mechanism that behaves identically on native and on web.
//
// ONLY between ASCII word characters, and that restriction is load-bearing. Bengali builds
// glyphs from clusters — a consonant plus a dependent vowel sign, or a conjunct joined by
// virama — and dropping a break opportunity inside one splits the cluster and renders it as
// separate broken glyphs. Bangla is the app's default language, so mangling it to tidy a
// margin would be a bad trade. Bengali text keeps normal word wrapping.
//
// The returned string carries invisible characters, so pass the ORIGINAL text as
// `accessibilityLabel` — otherwise a screen reader may spell the name out character by
// character.
export function breakAnywhere(text) {
  const value = String(text ?? "");
  if (!value) return value;
  return value.replace(/([A-Za-z0-9])(?=[A-Za-z0-9])/g, `$1${ZERO_WIDTH_SPACE}`);
}

export default breakAnywhere;
