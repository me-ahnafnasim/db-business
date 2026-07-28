// Top-level destinations only.
//
// Search is deliberately absent: it is an action rather than a place, so it lives in the
// header and opens as a pushed screen (STACK_ROUTES.SEARCH in MainTabs). Four tabs also
// leaves the Bangla labels room to breathe — see the per-locale metrics in i18n/layout.js.
export const TAB_KEYS = {
  HOME: "home",
  CATEGORIES: "categories",
  CART: "cart",
  PROFILE: "profile",
};

export const tabs = [
  { key: TAB_KEYS.HOME, labelKey: "tabs.home" },
  { key: TAB_KEYS.CATEGORIES, labelKey: "tabs.categories" },
  { key: TAB_KEYS.CART, labelKey: "tabs.cart" },
  { key: TAB_KEYS.PROFILE, labelKey: "tabs.profile" },
];
