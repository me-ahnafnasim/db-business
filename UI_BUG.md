# UI/UX Bug & Improvement Log — NoboSole APK

> Production-level audit of all screens, components, theme, localization, navigation, and accessibility issues.
> Prioritised: **P0** (crash/breakage) → **P1** (bad UX) → **P2** (consistency) → **P3** (polish).

---

## P0 — Fix Now (Crash or Broken UX)

### 1. Missing `colors.success` / `colors.warning` — Runtime Crash

**Files:** `src/theme/colors.js`, `src/screens/ExpenseTrackerScreen.js`

`colors.success` and `colors.warning` are referenced inline in `ExpenseTrackerScreen` (paid/due card backgrounds) but **not defined** in either the dark or light color palette. They resolve to `undefined`, which causes a runtime error or invisible UI.

**Fix:** Add `success` and `warning` tokens to both palettes in `colors.js`.

---

### 2. Hardcoded English Strings in ProductConfiguratorForm

**File:** `src/screens/ProductDetailsScreen.js` (or wherever `ProductConfiguratorForm` is inlined)

Lines inside the configurator use literal English text instead of `t()`:

- `"Select " + quantity + " color(s)"`
- `"Each size needs at least 2 pairs"`
- `"Pairs per dozen"`
- `"Minimum 2 pairs per size"`
- `"Add " + quantity + " dozen to cart"`

**Fix:** Wrap every user-facing string in `t()` and add keys to `en.json` / `bn.json`.

---

### 3. Hardcoded Bangla Placeholder in ProfileCompletionScreen

**File:** `src/screens/ProfileCompletionScreen.js`, line ~240

```jsx
placeholder="কোম্পানির নাম (ঐচ্ছিক)"
```

This bypasses the i18n system. If the user switches to English, the placeholder stays Bangla.

**Fix:** Replace with `t('company_name_optional')`.

---

## P1 — High Priority (Bad UX, Consistency)

### 4. Theme Toggle Not Persisted

**Files:** `src/theme/ThemeProvider.js`, `src/screens/ProfileScreen.js`

`toggleTheme` toggles `isDark` state but **never saves to storage**. On app restart, theme always resets to dark. User's preference is lost.

**Fix:** Persist to AsyncStorage and restore on mount.

---

### 5. ProfileWelcomeCard Hardcoded Background

**File:** `src/components/profile/ProfileWelcomeCard.js` (or wherever inline)

Uses `backgroundColor: "#ececec"` instead of a theme token.

**Fix:** Reference `colors.surfaceSoft` or similar.

---

### 6. Division Field is Free-Text in ShippingAddressForm

**File:** `src/components/checkout/ShippingAddressForm.js`

The division/state field is a plain `TextInput`. Users must type the exact division name — error-prone, no validation against known divisions.

**Fix:** Replace with a picker/dropdown populated from a known list of Bangladesh divisions.

---

### 7. Hardcoded Phone Number in ProfileFooter

**File:** `src/components/profile/ProfileFooter.js`

```jsx
<Text>1-800-123-4567</Text>
```

Hardcoded English phone number. Should be translatable or removed.

**Fix:** Use `t('support_phone')` or remove if unused.

---

### 8. HomeScreen Empty State Shows Section Headers

**File:** `src/screens/HomeScreen.js`

When no products are available, the "Featured Picks" and "Popular Right Now" section headers still render above the empty card. The user sees headers with nothing below.

**Fix:** Conditionally render the entire section (header + content) only when products exist.

---

### 9. No Loading Skeleton on HomeScreen

**File:** `src/screens/HomeScreen.js`

While products are loading, the screen shows nothing. A loading skeleton / shimmer would signal activity.

**Fix:** Add skeleton placeholder cards while `isLoading` is true.

---

### 10. Theme Provider Hardcodes Dark Mode Default

**File:** `src/theme/ThemeProvider.js`

`useState(true)` means dark mode is always the default. Should respect system preference via `Appearance.getColorScheme()`.

**Fix:** Default to system preference, fall back to dark.

---

## P2 — Medium Priority (Consistency, UX Polish)

### 11. Hardcoded Gold `#d4af37` Scattered Across 20+ Locations

**Files:** `ShippingScreen`, `PaymentScreen`, `CheckoutReviewScreen`, `OrderConfirmationScreen`, `ProductConfiguratorForm`, `ProfileCompletionScreen`, `LaunchScreen`

The gold accent color is hardcoded as `#d4af37`, `#ffd700`, `#e5bd42` in multiple `StyleSheet.create()` blocks and inline styles. None reference the theme's `tabActive` token (which is `#d4af37` in dark, `#7a5a00` in light). In light mode, gold text on white/light backgrounds will have poor contrast.

**Fix:** Replace all with a single theme token (e.g., `colors.accent` or `colors.gold`).

---

### 12. Search Screen Has No Debounce

**File:** `src/screens/SearchScreen.js`

Search filters on every keystroke via `useMemo` — no debounce or throttle. On large catalogs this causes frame drops.

**Fix:** Add a 300ms debounce before filtering.

---

### 13. No Pull-to-Refresh on OrdersScreen or CategoriesScreen

**Files:** `src/screens/OrdersScreen.js`, `src/screens/CategoriesScreen.js`

Only a manual "Refresh" button exists. Users expect pull-to-refresh on data lists.

**Fix:** Wrap in `RefreshControl` on the FlatList/ScrollView.

---

### 14. Inert "Currency BDT" Row in Profile

**File:** `src/screens/ProfileScreen.js`

The settings list has a row showing "Currency" with value "BDT" and a chevron icon — but the row has no `onPress`. It looks like a broken or missing feature.

**Fix:** Either make it functional (show currency picker) or remove the chevron and make it plain text.

---

### 15. Product Configurator Validation UX is Unclear

**File:** `src/screens/ProductDetailsScreen.js`

The rule "each selected size needs at least 2 pairs per dozen" has no inline explanation or visual cue for which size fields are invalid. Users may tap "Add to cart" and get no feedback.

**Fix:** Show inline validation hints per size field and disable the add button with a reason.

---

### 16. Division Pickers Lack Search / Scroll Indicators

**Files:** `src/screens/ProfileCompletionScreen.js`, `ShippingAddressForm.js`

Division selection uses horizontal chip scroll with no scroll indicator and no search. For 64 divisions, this is unusable.

**Fix:** Add a searchable modal picker or a vertical scroll with section indexing.

---

### 17. Cart Empty State is Plain Text

**File:** `src/screens/CartScreen.js`

Empty cart shows unstyled centered text. Should have an illustration, a heading, and a CTA to shop.

**Fix:** Replace with a proper empty state (icon + title + description + "Browse products" button).

---

### 18. Error Banner in MainTabs Overlaps Stack Screens

**File:** `src/screens/MainTabs.js`

The mutation error banner uses `zIndex: 25`, while stack overlay screens use `zIndex: 10`. The error banner can visually bleed over stack screens.

**Fix:** Tie the error banner to the active context (tab vs stack).

---

### 19. Double Error Display in Cart

**File:** `src/screens/CartScreen.js`

Errors are shown both inline in the cart scroll view AND in the MainTabs mutation error banner. User may see the same error twice.

**Fix:** Render errors in one place only.

---

## P3 — Low Priority (Polish, Accessibility)

### 20. No Gesture Back-Swipe on Stack Screens

Custom stack navigation has no gesture support. Users on Android (back button) and iOS (swipe) cannot navigate back intuitively.

---

### 21. No Screen Transition Animations

Stack screens appear instantly — no slide/ fade animation. Feels abrupt.

---

### 22. LaunchScreen Animated Emoji Has No accessibilityLabel

The shoe emoji (`👟`) in the launch animation is read by screen readers as "running shoe" but has no explicit label.

---

### 23. Icon-Only Pressables May Lack Accessible Names

Several icon-only buttons (e.g., search, cart in header, delete in cart items) use `Pressable` without `accessibilityLabel`.

---

### 24. Color-Only Feedback for Selected States

Radio buttons, chips, and selected states use only color (gold border / gold fill). No additional shape, text, or icon change — inaccessible to color-blind users.

---

### 25. No Haptic Feedback on Key Actions

Button presses (add to cart, place order, etc.) have no haptic feedback on supported devices.

---

### 26. FestivalDiscountBanner Timer May Drift

**File:** `src/components/FestivalDiscountBanner.js`

Uses `setInterval` to update the countdown. `setInterval` can drift over time and doesn't pause when the app is backgrounded.

**Fix:** Use `requestAnimationFrame` with delta calculation, or at minimum clear interval on unmount.

---

### 27. All Tab Screens Stay Mounted When Hidden

The tab implementation uses `display: none` rather than conditional mounting. All tab screens remain in memory.

**Fix:** Only render the active tab screen.

---

### 28. Accessibility: Animated Smoke Characters on LaunchScreen

The smoke/brand-character animation uses `Animated.Text` elements without accessibility hints. Consider `aria-hidden` or `accessibilityElementsHidden`.

---

### 29. ProfileCompletionScreen: No keyboardType on tradeLicenseNumber

The trade license field defaults to the standard keyboard instead of `keyboardType="default"` (at minimum) or alphanumeric.

---

### 30. No Auto-Capitalization for Name Fields

Name fields in `ProfileCompletionScreen` and `ShippingAddressForm` don't use `autoCapitalize="words"`.

---

## Summary

| Priority | Count | Key Areas |
|---|---|---|
| **P0** | 3 | Theme crash, configurator i18n, hardcoded placeholder |
| **P1** | 7 | Theme persist, hardcoded colors, division picker, empty states |
| **P2** | 9 | Gold colors, search debounce, pull-to-refresh, configurator UX |
| **P3** | 11 | Gestures, animations, accessibility, polish |
