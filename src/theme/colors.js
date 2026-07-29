// Colour tokens.
//
//   `brand*`  — the gold CTA identity, and what a control uses to say "active".
//   `error*`  — danger. This replaced the old `accent` token, which was red and whose
//               every call site meant danger despite the name. `accent` was kept as an
//               equal-valued alias during the migration and has now been removed.
//   `on*`     — the foreground drawn on top of the matching surface.

export const darkColors = {
  background: "#070b18",
  surface: "#0f172a",
  surfaceSoft: "#172033",
  textPrimary: "#f8fafc",
  textSecondary: "#a9b5c9",
  muted: "#64748b",
  success: "#4ade80",
  warning: "#fbbf24",
  // Ink for text and icons sitting ON a warning surface. Both palettes use an amber
  // warning, so both take the same dark ink — white on amber fails contrast in either.
  onWarning: "#0a0e27",
  tabInactive: "#94a3b8",
  tabPressedBackground: "#1b263b",
  // Behind the search, cart and back controls, and the profile avatar. Their own role because
  // they sit on the BODY — the header is no longer a raised surface — where surfaceSoft manages
  // only 1.21:1. This is white at 12%, the usual dark-mode lift, and reaches 1.34:1.
  headerControlBackground: "#252834",
  white: "#ffffff",
  black: "#000000",
  border: "#253047",
  // Separates two areas of the SAME fill, where `border` outlines a shape that differs from
  // what is behind it. The bottom nav is the case: it takes the body colour, so the rule above
  // it is the only thing marking where content ends. Dark needs no extra help — #253047 already
  // reaches 1.49:1 against this theme's background, where light manages only 1.21:1.
  divider: "#253047",

  brand: "#d4af37",
  brandPressed: "#b8952e",
  brandSoft: "#302a1a",
  // The bottom nav's active-tab pill. Its own role because it is the one brandSoft fill in the
  // app with no `brand` border beside it — Chip and LanguageToggle both pair the two, so their
  // faint fill is never what identifies the selection, and retuning brandSoft to suit the nav
  // would repaint every chip to fix something that is not broken. This value matches brandSoft
  // today: dark has the headroom, at 1.38:1 against its background.
  tabActiveBackground: "#302a1a",
  // Glyph and label of the selected tab. One role covers both: the glyph sits on the pill at
  // 6.79:1 and the label on the background at 9.33:1, and gold clears both.
  tabActiveForeground: "#d4af37",
  // Text and icons drawn on top of `brand`. Was hardcoded as #0a0e27 in six files, and
  // wrongly set to white in a seventh, which rendered at roughly 1.9:1 contrast.
  onBrand: "#0a0e27",

  error: "#ef4444",
  errorSoft: "#2a1416",
  errorBorder: "#5b2326",
  onError: "#ffffff",

  // Promotional amber, shared by the sale badge and the festival banner. Deliberately
  // identical in both themes: it is a fixed brand accent, not a surface.
  sale: "#f4ca55",
  saleBorder: "#d5a923",
  onSale: "#7a220b",
  onSaleMuted: "#5b450b",

  // Chrome for the fullscreen image viewer. Also theme-independent: a photo lightbox is
  // dark in both themes by design.
  scrim: "rgba(10, 14, 39, 0.74)",
  viewerSurface: "#050814",
  viewerControl: "rgba(255, 255, 255, 0.1)",
  onScrim: "#ffffff",

  textDisabled: "#4b5670",
  overlay: "rgba(7, 11, 24, 0.72)",
  skeleton: "#141d30",
  skeletonHighlight: "#1d2941",
  shadow: "#000000",
};

export const lightColors = {
  background: "#f4f6fa",
  surface: "#ffffff",
  surfaceSoft: "#edf1f7",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  muted: "#94a3b8",
  success: "#22c55e",
  warning: "#f59e0b",
  onWarning: "#0a0e27",
  tabInactive: "#6b7280",
  tabPressedBackground: "#f3ead0",
  // Same role, opposite direction. A lift cannot work on a near-white body: pure white is
  // 1.08:1 here and white at 8% is 1.01:1, both less visible than the surfaceSoft it replaces.
  // Dark ink at 8% instead, 1.18:1 where surfaceSoft on the flat header manages 1.05:1.
  headerControlBackground: "#e2e4e9",
  white: "#ffffff",
  black: "#000000",
  border: "#dbe2ea",
  // A step darker than `border`: 1.36:1 against this theme's background where border manages
  // 1.21:1. Where a divider is the ONLY separation — the bottom nav sits on the body colour —
  // 1.21 reads as a smudge and the bar stops looking like a bar. Still a hairline; the next
  // candidate up, #bcc8d8 at 1.57:1, starts to look drawn on.
  divider: "#ccd6e2",

  brand: "#c4950a",
  brandPressed: "#a87f08",
  brandSoft: "#fff2bd",
  // No pill in this theme. Gold cannot carry the selection here — brand is 2.54:1 against this
  // background and the tab label is 13px at weight 700, where AA wants 4.5:1, so the selected
  // tab was harder to read than the unselected ones beside it at 4.47:1. A gold wash behind it
  // fared worse still at 1.17:1. Filling the pill dark instead fixed the contrast but put a
  // near-black slab in a light bar, so the pill goes and the glyph itself carries the state.
  //
  // `transparent` rather than a colour: BottomNav reads it and skips rendering the pill
  // altogether, so nothing animates a view nobody can see. Dark theme keeps its gold pill,
  // where every figure already worked.
  tabActiveBackground: "transparent",
  // Glyph and label both sit on the background now, so one role serves both. 16.40:1.
  tabActiveForeground: "#111827",
  onBrand: "#0a0e27",

  error: "#dc2626",
  errorSoft: "#fee2e2",
  errorBorder: "#fecaca",
  onError: "#ffffff",

  sale: "#f4ca55",
  saleBorder: "#d5a923",
  onSale: "#7a220b",
  onSaleMuted: "#5b450b",

  scrim: "rgba(10, 14, 39, 0.74)",
  viewerSurface: "#050814",
  viewerControl: "rgba(255, 255, 255, 0.1)",
  onScrim: "#ffffff",

  textDisabled: "#b0b8c4",
  overlay: "rgba(17, 24, 39, 0.55)",
  skeleton: "#e6ebf2",
  skeletonHighlight: "#f2f5f9",
  shadow: "#0f172a",
};

// Fixed palette for the branded storefront loader. It deliberately does not switch with
// the app theme: this short loading state reproduces the supplied NoboSole artwork in both
// modes, while keeping its literals inside the design-token layer.
export const loaderColors = Object.freeze({
  background: "#1a1a2e",
  letterStart: "#ffdd4d",
  letterEnd: "#ffcc00",
  letterText: "#222222",
  shadow: "#000000",
});
