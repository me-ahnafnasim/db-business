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
  headerIconPressedBackground: "#1b263b",
  white: "#ffffff",
  black: "#000000",
  border: "#253047",

  brand: "#d4af37",
  brandPressed: "#b8952e",
  brandSoft: "#302a1a",
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
  headerIconPressedBackground: "#f3ead0",
  white: "#ffffff",
  black: "#000000",
  border: "#dbe2ea",

  brand: "#c4950a",
  brandPressed: "#a87f08",
  brandSoft: "#fff2bd",
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
