// Design tokens for everything that is not a colour.
//
// Values were chosen as the mode of what the app already renders, so adopting a token
// moves an existing screen by at most 2dp. See UI_IMPROVEMENT_REPORT.md for the census.
// Tokens govern padding, margin and gap. Absolute positioning offsets stay raw — they
// are optical adjustments, not rhythm.

export const spacing = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  x4: 32,
  x5: 40,
  x6: 48,
  // Horizontal screen gutter. Both shells already use 20; changing it reflows every screen.
  gutter: 20,
});

export const radius = Object.freeze({
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
  // Semantic aliases — components reference these, not the raw steps.
  button: 16,
  card: 20,
  input: 12,
  control: 12,
  pill: 999,
});

export const opacity = Object.freeze({
  disabled: 0.45,
  pressed: 0.85,
  muted: 0.7,
});

// Expands a control's touch area without changing its layout. Applied by IconButton so
// the 36x36 icon buttons across the app reach the 44dp minimum.
export const hitSlop = Object.freeze({
  sm: { top: 6, bottom: 6, left: 6, right: 6 },
  md: { top: 10, bottom: 10, left: 10, right: 10 },
});

// Minimum tappable sizes. `target` is the WCAG 2.5.5 / Material floor.
export const control = Object.freeze({
  target: 44,
  buttonSm: 40,
  buttonMd: 48,
  buttonLg: 52,
  icon: 36,
  input: 48,
});

export const duration = Object.freeze({
  fast: 120,
  base: 200,
  slow: 320,
});

// Elevation is reserved for genuinely floating surfaces (nav bars, sticky footers,
// toasts). Cards stay flat with a 1px border — that is the app's existing identity.
export function elevation(level, shadowColor) {
  const levels = [
    { height: 0, radius: 0, opacity: 0, elevation: 0 },
    { height: 2, radius: 6, opacity: 0.08, elevation: 2 },
    { height: 6, radius: 14, opacity: 0.12, elevation: 4 },
    { height: 10, radius: 22, opacity: 0.16, elevation: 8 },
  ];
  const step = levels[level] ?? levels[0];
  if (!step.elevation) return {};
  return {
    shadowColor,
    shadowOffset: { width: 0, height: step.height },
    shadowRadius: step.radius,
    shadowOpacity: step.opacity,
    elevation: step.elevation,
  };
}
