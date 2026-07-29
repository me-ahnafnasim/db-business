// The bottom bar: four destinations and one action.
//
// Search is still absent, and for the reason that used to keep actions out of here entirely —
// it is a thing you do, not a place you go, so it lives in the header (STACK_ROUTES.SEARCH).
// Support breaks that rule deliberately: it opens WhatsApp rather than navigating anywhere, and
// it is here because reaching a person is worth a permanent slot in a wholesale app. `action`
// marks it so BottomNav can announce it as a button rather than a tab, and MainTabs can run it
// instead of switching screens.
//
// This was four tabs, chosen partly so the Bangla labels had room to breathe. Support is a
// fifth, added with that cost understood: at 320dp each cell falls from 80dp to 64dp and the
// label from 64dp to 48dp, which is under what "Categories" (~68dp at 13px) and Bangla
// "প্রোফাইল" (~58dp at 11px) need. Both ellipsise there — BottomNav sets numberOfLines={1}, so
// they truncate rather than wrapping and pushing the bar taller. See the per-locale metrics in
// i18n/layout.js. A sixth is not available: there is nothing left to give.
export const TAB_KEYS = {
  HOME: "home",
  CATEGORIES: "categories",
  CART: "cart",
  SUPPORT: "support",
  PROFILE: "profile",
};

export const tabs = [
  { key: TAB_KEYS.HOME, labelKey: "tabs.home" },
  { key: TAB_KEYS.CATEGORIES, labelKey: "tabs.categories" },
  { key: TAB_KEYS.CART, labelKey: "tabs.cart" },
  // Before Profile rather than after it: Profile is conventionally the last slot, and moving it
  // would cost existing users their muscle memory for the sake of a newer destination.
  //
  // `action` is the whole difference: this entry never becomes the active tab, never renders a
  // selection indicator, and hands off to WhatsApp instead. The FAQ is a separate thing and
  // stays where it was, reachable from Profile.
  { key: TAB_KEYS.SUPPORT, labelKey: "tabs.support", action: true },
  { key: TAB_KEYS.PROFILE, labelKey: "tabs.profile" },
];
