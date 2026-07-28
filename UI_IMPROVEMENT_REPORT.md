# NoboSole Mobile App — UI Improvement Report

**Date:** 2026-07-28
**Scope:** `apk_frontend/` — Expo SDK 54, RN 0.81.5, React 19, plain JS. 71 files, 7,025 lines in `src/`.
**Method:** Full read of `src/`, cross-checked against `UI_BUG.md`, `UI_UX_AUDIT.md`, and `NoboSole_UI_UX_Design_Guidelines.md`. Every count below is reproducible with the greps in §9.

---

## 1. Executive summary

The app is functionally complete and the i18n architecture is genuinely good. What it lacks is a **design system**. `src/theme/` contains two files — a color palette and a provider. There are no spacing, typography, radius, or elevation tokens, and no shared UI primitives. Every screen re-invents its own buttons, cards, empty states, and error blocks.

The result is not that the app looks bad — it's that it looks like **six different apps**, and that any visual change requires editing dozens of files.

Three findings deserve attention regardless of whether the refactor proceeds:

| # | Finding | Severity |
|---|---|---|
| 1 | **Bangla text is under-leaded across the entire app.** 90% of `Text` elements declare no `lineHeight` at all, falling back to Android's Latin-tuned default; the 14 that do declare one are English-tuned at 1.26–1.54×, where Bangla needs ≥1.6×. Descenders (ু ৃ ্র) clip and the matra crowds on the two most-viewed surfaces. | **Critical** |
| 2 | **A primary CTA is unreadable.** `ShippingScreen.js:132` renders white text on the gold brand color — roughly 1.9:1 contrast. Every other gold button in the app uses navy. | **Critical** |
| 3 | **Zero `hitSlop`, zero `KeyboardAvoidingView` repo-wide.** Eight interactive controls are below the 44dp minimum, and a 9-field form and a 6-field form both let the keyboard cover their submit buttons. | **High** |

---

## 2. Scorecard

Measured before the refactor and again after it. Reproduce with `npm run check:tokens -- --verbose`.

| Debt | Before | After | Fixed in |
|---|---|---|---|
| Hardcoded hex literals outside `src/theme/` | **79** across 20 files | **24** across 4 files | Phases 3–8 |
| `rgba()` / `rgb()` literals | **24** | **17** | Phases 3–8 |
| Raw `fontSize` sites | **166** (21 distinct) | **10** (all in `LaunchScreen`) | Phase 2 + rollout |
| Raw `borderRadius` sites | **79** (18 distinct) | **4** | Phase 2 + rollout |
| Raw `padding`/`margin` values | **304** | **27** | Phase 2 + rollout |
| Unmemoized `getStyles(colors)` factories | **40 files** | **0** | Phase 2 (`useStyles`) |
| Independently-styled primary buttons | **14** | **1** (`Button`) | Phase 3 |
| Card style redefinitions | **12+** | **1** (`Card`) | Phase 3 |
| Empty-state designs | **6** | **1** (`EmptyState`) | Phase 3 |
| Error/retry blocks | **4** | **1** (`ErrorState`) | Phase 3 |
| Chip designs | **4** | **1** (`Chip`) | Phase 3 |
| Screen-title sizes | **3** (30 / 24 / 22) | **2** (h1 28 / h2 24) | Phase 4 |
| Cart badge implementations | **2** (different sizes) | **1** (`Badge`) | Phase 7 |
| Icon families in the tab bar | **4** | **1** (Feather) | Phase 7 |
| `hitSlop` | **0** | via `IconButton` everywhere | Phase 3 |
| `KeyboardAvoidingView` | **0** | both long forms | Phases 3, 7 |
| `returnKeyType` / `onSubmitEditing` / `autoComplete` / `autoCapitalize` | **0 each** | focus chains on both forms | Phases 3, 7 |
| `allowFontScaling` / `maxFontSizeMultiplier` | **0 each** | enforced in `AppText` | Phase 2 |
| Locale-aware `lineHeight` coverage | **2 of 166** text sites | every `AppText` | Phase 2 |
| `fontFamily` declarations | **0** | **0** — deferred, see §6 | — |
| Components with shadow/elevation | **1** (an outlier card) | **2** floating surfaces only | Phase 8 |

The residual literals are deliberate and confined to four files: `LaunchScreen` (a fixed dark
brand surface that must render identically in both themes — its palette is now one named
`LAUNCH` block), `BannerCarousel` and `HomeScreen` (image scrims and placeholder banner
gradients, which sit behind white text and are content rather than palette), and
`LanguageProvider` (see §7 item 11).

---

## 3. Inconsistency inventory

### 3.1 Buttons — 14 independent implementations

`ShippingScreen.js:121` · `PaymentScreen.js:47` · `CheckoutReviewScreen.js:105` · `ProductConfiguratorForm.js:213` · `CartSummaryPanel.js:87` · `OrderConfirmationCard.js:116` · `ProfileSignInCard.js:54` · `CartScreen.js:118` · `ProfileCompletionScreen.js:418,421` · `OrdersScreen.js:114,120` · `ExpenseTrackerScreen.js:195` · `MainTabs.js:478`

Heights vary 42 / 44 / 50 / 52. Radii vary 10 / 12 / 14 / 16 / 18 / 21 / 26 / 28. Only one of the fourteen (`ProfileCompletionScreen.js:319`) renders a spinner in its loading state — the rest just swap the label text, so the most important action in the app (Place Order, `CheckoutReviewScreen.js:34`) gives no visual confirmation that it registered.

**Pressed feedback is absent on the entire checkout path.** `ShippingScreen.js:63`, `PaymentScreen.js:22`, `CheckoutReviewScreen.js:33`, `CartSummaryPanel.js:38`, `OrdersScreen.js:60,67,89` all use a static `style={[...]}` with no `({pressed})` callback and no `android_ripple`. Conversely `Header.js:36` and `CatalogProductCard.js:24` explicitly set `android_ripple={{color:'transparent'}}` — ripple is deliberately switched off, which is off-platform for Android.

### 3.2 The missing `onBrand` token

`#0a0e27` is hardcoded as button-text-on-gold in **six** files: `PaymentScreen.js`, `CartScreen.js`, `CheckoutReviewScreen.js`, `CartSummaryPanel.js`, `OrderConfirmationCard.js`, `ProductConfiguratorForm.js`.

A seventh site — `ShippingScreen.js:132` — uses `colors.white` instead. That is finding #2 above: two adjacent checkout steps render the same button with opposite text colors, and one of them is illegible.

Note also that `#0a0e27` is **not** `darkColors.background` (`#070b18`). The app has two competing navies that have never been reconciled.

### 3.3 Empty states — 6 tiers of quality

| Quality | Site |
|---|---|
| Icon + title + subtitle + CTA | `CartScreen.js:66-73` — the best in the app |
| Bordered card + title + body | `HomeScreen.js:80-83` |
| Plain card, one line | `OrdersScreen.js:71`, `ExpenseTrackerScreen.js:81` |
| Bare centered `Text` | `CategoriesScreen.js:87`, `SearchScreen.js:101` |

A user who empties their cart gets a polished, actionable screen. A user whose search returns nothing gets one line of grey text.

### 3.4 Loading states — 4 tiers, zero skeletons

Blocking full-screen overlay (`MainTabs.js:432`) · inline `ActivityIndicator` (`OrdersScreen.js:63`, `ExpenseTrackerScreen.js:69`) · in-button spinner (`ProfileCompletionScreen.js:326`) · text-swap only (`CheckoutReviewScreen.js:34`, `LaunchScreen.js:298`).

There are no skeleton loaders anywhere. Cold start shows **three sequential blank/spinner gates** before any content: `ThemeProvider.js:47` returns `null`, `LanguageProvider.js:68` renders a bare spinner, then `MainTabs.js:432` throws an opaque overlay.

### 3.5 Cards, radii, headers

Card radius is 20 in eight components, 18 in `ShippingOptionCard.js:40` and `PaymentMethodCard.js:34`, 22 in `ProductSummaryCard.js:43`, 28 in `CartLineItem.js:65`. Three header styles exist (`Header` avatar+greeting, `StackScreenShell` back+title, `ProfileCompletionScreen.js:167` centered icon) — and `ProfileScreen` has **no header at all**, so the search and cart icons vanish on that tab.

Three screen-title sizes: 30/800 (`ScreenShell.js:96`), 24/800 (`StackScreenShell.js:84`), 22/700 (`ProfileCompletionScreen.js:355`).

### 3.6 The same sale badge, drawn twice

`CatalogProductCard.js:83` renders `#7a220b` text on `#f4ca55`. `ProductSummaryCard.js:73` renders `#0a0e27` text on the same `#f4ca55`. Same badge, two designs, adjacent surfaces.

### 3.7 Shells re-implemented by their own consumers

`HomeScreen.js:64-109` and `ProfileScreen.js:38-69` each rebuild `ScreenShell` byte-for-byte — `SafeAreaView + StatusBar + Header + ScrollView + BottomNav` — solely to skip the shell's title block. That is ~60 lines of pure duplication, and it is why `ProfileScreen` also drifted into having no `StatusBar` (unlike every other top-level screen).

`OrdersScreen` and `ExpenseTrackerScreen` share character-for-character identical `refreshButton`, `refreshText`, `messageCard`, `emptyText`, `errorText`, `retryButton`, and `retryText` styles, plus a near-identical load/refresh/empty/error block structure.

The order-allocation line — a ~230-character single-line JSX expression with nested ternaries — is duplicated verbatim between `CheckoutReviewScreen.js:46` and `OrdersScreen.js:84`.

### 3.8 Hardcoded hex by file

| File | Count |
|---|---|
| `src/screens/LaunchScreen.js` | 16 |
| `src/screens/ProfileCompletionScreen.js` | 10 |
| `src/components/FestivalDiscountBanner.js` | 9 |
| `src/screens/MainTabs.js` | 7 |
| `src/screens/HomeScreen.js` | 6 |
| `src/features/catalog/components/ProductGallery.js` | 5 |
| `src/components/LanguageToggle.js` | 5 |
| `src/features/catalog/components/ProductConfiguratorForm.js` | 3 |
| 12 more files | 1–2 each |

**All 79 are dark-tuned.** Light mode is reachable today (`ThemeProvider` persists its own toggle independently of `app.json`), which means these 79 pixels are already rendering wrong for any user who has switched themes.

Four files use a module-level `StyleSheet.create` and therefore cannot respond to the theme at all: `MainTabs.js:454`, `LaunchScreen.js:334`, `ProductImage.js:47` (benign — layout only), `LanguageProvider.js:75`.

`LanguageProvider` is the only *structural* case: `App.js:49-50` nests `<LanguageProvider><ThemeProvider>`, so it renders outside the theme and literally cannot consume it. Everything else is just unfinished.

---

## 4. Correctness bugs

Ordered by severity. Items marked **[logic]** are outside the UI-only refactor and are recommendations only — see §6.

| # | Bug | Site | Severity |
|---|---|---|---|
| 1 | Bangla under-leading — see §7 | ~all `Text` | **Critical** |
| 2 | White text on gold, ~1.9:1 contrast | `ShippingScreen.js:132` — **fixed** (`onBrand`); two more instances found and fixed in the Orders and Expense retry buttons | **Critical** |
| 3 | Zero `hitSlop`; 8 controls below 44dp | see §4.1 | **High** |
| 4 | Zero `KeyboardAvoidingView`; keyboard covers the submit button on a 9-field and a 6-field form | `ProfileCompletionScreen`, `ShippingAddressForm` | **High** |
| 5 | **[logic]** Full-screen opaque overlay flashes on *every* app foreground and every realtime event | `MainTabs.js:74` sets `dataStatus("loading")` unconditionally; `loadStore` fires from `:118` and `:130` | **High** |
| 6 | **[logic]** Android hardware back exits the app from any inner screen, including mid-checkout | no `BackHandler` anywhere; nav is a `useState` stack at `MainTabs.js:59` | **High** |
| 7 | **[logic]** Search bar is fake — the real `TextInput` is hidden at 1×1px opacity 0 behind a `Pressable`+`Text` mimic. Kills caret, selection, paste, and **Bangla IME composition** | `SearchScreen.js:74-91`, `:143` | **High** |
| 8 | **[logic]** "Loading more" footer never loads anything — it's a static label over client-side `.slice()` of a `limit: 100` fetch | `CategoriesScreen.js:54` | Medium |
| 9 | Zero `allowFontScaling` / `maxFontSizeMultiplier` — OS font scaling can shatter every fixed-height row and the 5-tab bar | repo-wide | Medium |
| 10 | `@expo/vector-icons` imported **25×** but **not declared in `package.json`** — resolves only as a transitive of `expo`. A minor bump that hoists it differently breaks every icon in the app | `package.json` | Medium |
| 11 | Destructive "Cancel order" has no confirmation, while clear-cart does (`MainTabs.js:213`) | `OrdersScreen.js:89` | Medium |
| 12 | **[logic]** `useNativeDriver: false` for opacity + transform at `scrollEventThrottle={16}` — drives the home carousel from the JS thread | `BannerCarousel.js:131` | Medium |
| 13 | `muted` on `surfaceSoft` ≈ 3.1:1 — fails WCAG AA for the 11–13px text it's paired with | `colors.js` | Medium |
| 14 | Only 1 of ~30 components is memoized, so one cart `+` tap re-renders every row plus its whole `getStyles` object | `CatalogProductCard.js:47` is the only `memo()` | Low |
| 15 | Success has no feedback channel — add-to-cart, quantity change, item removal and order placement produce no toast, no haptic, no animation | repo-wide | Low |
| 16 | Error banner has no `accessibilityLiveRegion`, so screen readers never announce cart failures | `MainTabs.js:448` | Low |
| 17 | Dead code: `ProductConfigOptionGroup.js` (104 lines, 0 importers) and `src/data/profile.js` (0 importers, hardcoded personal data `"Ahnaf Nasim"`) | both **deleted** | Low |
| 18 | **Black text on a dark surface.** `ProfileWelcomeCard` drew its title and icon in `colors.black` on `colors.surfaceSoft` (`#172033` in dark) — unreadable in dark mode | **fixed** — now `textPrimary` | **High** |
| 19 | **White button on a white card.** `ProfileSignInCard`'s logout button used `colors.white` on `colors.surface` (`#ffffff` in light) — the button vanished in light mode | **fixed** — now a `secondary` Button | **High** |
| 20 | The "Currency · BDT" settings row rendered a chevron and a pressed state despite having no handler | **fixed** — rows without a handler are now static | Low |
| 21 | `ProductSummaryCard` rendered an untranslated English `"% OFF"`; the sale badge existed in two different designs | **fixed** — one `SaleBadge`, no untranslated string | Low |

### 4.1 Touch targets below 44dp

| Control | Size | Site |
|---|---|---|
| Carousel prev/next | 28×28 | `BannerCarousel.js:222-227` |
| Search clear "×" | 28×28 | `SearchScreen.js:144-149` |
| Cart delete | 36×36 | `CartLineItem.js:140-147` |
| Header search + cart | 36×36 | `Header.js:110-117` |
| Back button (all 7 stack screens) | 36×36 | `StackScreenShell.js:71-78` |
| Configurator size cells | 38h | `ProductConfiguratorForm.js:210` |
| Cart qty +/− | 42×42 | `CartLineItem.js:112-131` |
| Configurator qty steppers | 42×42 | `ProductConfigQuantityControl.js:50-59` |

Only two controls in the app explicitly meet 44dp (`OrdersScreen.js:105`, `ExpenseTrackerScreen.js:168`). **Every one of the above is fixable with a single `hitSlop` prop and zero visual change** — which is exactly what the `IconButton` primitive will bake in.

Also missing: `accessibilityLabel` on the Google sign-in button, every checkout footer button, every `TextInput` in both forms, the "Clear all" text-button (`ScreenShell.js:50` — a bare `Text` with `onPress`, not a `Pressable`), and the cart empty-state CTA.

---

## 5. Bangla typography — the critical finding

`src/i18n/layout.js` already does the right thing. It defines per-locale metrics including `bodyLineHeight: 22` (en) vs **`28`** (bn) — a +27% increase, correctly reflecting that Bangla needs more vertical room for its ascenders, descenders, and the matra (মাত্রা) headline stroke.

**It is consumed in exactly one file.** `LaunchScreen.js:318` and `:322`. Nowhere else.

Across the whole app there are only **16 `lineHeight` declarations against 166 `fontSize` sites** — so roughly **90% of all text has no `lineHeight` at all** and falls back to Android's platform default, which is tuned for Latin and clips Bangla conjuncts.

The 14 hardcoded ones are English-tuned:

| Site | lineHeight / fontSize | Ratio | Surface |
|---|---|---|---|
| `CartLineItem.js:89` | 24 / 19 | **1.26** | product name in cart |
| `CatalogProductCard.js:72` | 20 / 14 | **1.43** | product name in every grid card |
| `CartLineItem.js:95` | 18 / 14 | 1.29 | |
| `CartLineItem.js:97` | 16 / 11 | 1.45 | |
| `ProductSummaryCard.js:56` | 31 / 26 | 1.19 | product title |
| `CatalogSectionHeader.js:38` | 29 / 24 | 1.21 | |
| `CartScreen.js:113` | 20 / ~14 | 1.43 | |
| `CategoryFilterBar.js:69` | 20 / ~13 | 1.54 | |
| `PaymentMethodCard.js:57` | 20 / 13 | 1.54 | |
| `OrderConfirmationCard.js:84` | 22 / ~14 | 1.57 | |
| `HomeScreen.js:142` | 21 / 14 | 1.50 | |
| `ProductSummaryCard.js:63` | 23 / ~15 | 1.53 | |

Bangla needs **≥1.6–1.7×**. The two worst ratios (1.26 and 1.43) are on the two most-viewed surfaces in the app — the cart line item and the product grid card.

Additionally, **no font family is loaded anywhere** (`fontFamily`: 0 occurrences; `expo-font` is not a dependency). Bangla renders in whatever Bengali fallback the OEM ships, so glyph metrics vary by device and Android version.

**Recommendation:** fix the line-height first — it is free, it is the actual cause of clipping, and Android does ship a Bengali face. Only if clipping persists after that, on a real device, consider bundling Noto Sans Bengali. See §6 for why the font is deferred.

Related, minor: five strings bypass `t()` via manual `bangla ? "…" : "…"` ternaries in `FestivalDiscountBanner.js:37-44` (দিন/ঘণ্টা/মিনিট/সেকেন্ড/ছাড়), and `ProductConfiguratorForm.js:168` renders untranslated English `Size {size}` in the core ordering flow. `shippingOptions.js` and `paymentOptions.js` carry dead untranslated `label`/`eta`/`description` fields shadowed by their `*Key` siblings — harmless today, a trap for the next developer.

Credit where due: `en.json` and `bn.json` are at full key parity, enforced by `npm run check:i18n`, and `src/utils/money.js` correctly uses `Intl.NumberFormat("bn-BD")` for Bengali numerals. The i18n layer is the best-engineered part of the app.

---

## 6. Deliberately deferred, with reasoning

| Item | Decision | Why |
|---|---|---|
| **react-navigation** | Defer | It would fix Android back and screen transitions, but `MainTabs.js` is 482 lines of navigator + data layer + cart/checkout controller fused together; adopting a navigator forces extracting the data layer first. It also collides file-for-file with the token migration, and adds ~1.5–2.5 MB against the active 70 → 35 MB size-reduction effort. Revisit once `MainTabs.js` is under 150 lines. |
| **Bangla webfont (`expo-font` + Noto Sans Bengali)** | Defer | Largest asset add (~0.5–1.2 MB) *and* largest visual-regression surface — it changes glyph shapes on every screen. The measured defect is clipping, and clipping is caused by insufficient `lineHeight`, not by the font. Fix leading first, measure, then reconsider. |
| **`expo-image`** | Defer | Genuinely attractive — `ProductImage.js` is a single 61-line chokepoint for all product imagery (3 importers) currently using uncached RN core `Image`, so photos re-download on every grid scroll. But it is a dependency add, and this pass is UI-only. Recommend as a standalone follow-up; pay for its size by running the existing `npm run clean:icons` (~2.7 MB of unused icon fonts). |
| **`expo-haptics`** | No | A native module for polish on a B2B wholesale app whose actual pain is legibility and keyboards. RN core `Vibration` covers a single confirmation buzz at zero size. |
| **`react-native-reanimated`** | No | +2–3 MB, a babel plugin, and worklet debugging. Every animation needed here is native-drivable with core `Animated`; `BannerCarousel.js:131` is simply a one-word bug fix. |
| **Card shadows** | No | The flat-surface + 1px-border look *is* the current visual identity. Adding card elevation would be a rebrand, not a consistency fix. Elevation is defined as a token and applied only to genuinely floating surfaces. |
| **Server-side pagination** | Defer | Fixing `CategoriesScreen.js:54` properly requires backend cursor support; the catalog currently arrives as a single `limit: 100` fetch. |
| **Splash color unification** | Defer | `app.json` splash is `#0a0e27` while `darkColors.background` is `#070b18`. Changing it produces a visible flash on cold start for a purely cosmetic gain. |
| **`@expo/vector-icons` explicit dependency** | Awaiting decision | One line in `package.json`, zero runtime effect, removes a real fragility. Not done because it is outside "UI only" — say the word. |

---

## 7. Out of scope for the UI refactor

Per the UI-only constraint, the following were found but **not** changed, because each alters state transitions, network calls, or navigation behavior rather than presentation. They are listed here so nothing gets lost.

1. `MainTabs.js:74` — gate `setDataStatus("loading")` on `!catalog.categories.length` so the overlay stops flashing on every foreground. **~3 lines, highest value-per-line fix in the codebase.**
2. `BackHandler` in `MainTabs` — pop the stack, else return to the Home tab, else exit. ~15 lines. Fixes back-exits-mid-checkout without needing react-navigation.
3. `ProfileCompletionScreen.js:77-97` — replace the submit-only, one-error-at-a-time, short-circuiting validation cascade with per-field errors. Currently a user can need six submit round-trips, and the error renders in a box at `:310-314` far from the offending field, potentially off-screen.
4. `CategoriesScreen.js` — real pagination behind the "loading more" footer.
5. `SearchScreen.js:74-91` — replace the fake input with a real `TextInput`.
6. Cold-start boot sequence — unify the three blank gates (`ThemeProvider.js:47`, `LanguageProvider.js:68`, `MainTabs.js:432`) behind one branded splash.
7. `MainTabs.js` — extract the data/controller half into a `StoreProvider`, leaving a navigator of manageable size.
8. `BannerCarousel.js:131` — `useNativeDriver: false → true`.
9. `OrdersScreen.js:89` — add a confirmation dialog to Cancel order.
10. Memoize list rows (`CartLineItem`, `ProfileListCard`, `ShippingOptionCard`, `PaymentMethodCard`); add `getItemLayout` to the two product grids.
11. **`App.js:49-50` provider order.** `<LanguageProvider>` wraps `<ThemeProvider>`, so `LanguageProvider`'s own loading spinner renders outside the theme and *cannot* consume it — it is the last theme-blind surface in the app and the reason two hex literals remain in that file. Swapping the two lines fixes it with no logic delta (ThemeProvider consumes nothing from LanguageProvider, and i18n is provider-free). Left undone because reordering providers is a structural change rather than a UI one; it needs a deliberate decision.

---

## 8. Not UI, but flagged

**A Firebase admin service-account private key is sitting in plaintext at the workspace root:**

```
/home/ahnafnasim/Desktop/nobosole/nobosole-web-ba3c2-firebase-adminsdk-fbsvc-a0f9dc0fc5.json
```

It is outside all three sub-repos and therefore outside any `.gitignore` protection. A service-account key grants full admin access to the Firebase project. Recommend rotating it and moving it to a secret manager or an untracked location.

---

## 9. Reproducing these numbers

Run from `apk_frontend/`:

```bash
# hex literals outside the theme
grep -rIoE '#[0-9a-fA-F]{6}\b' src --include=*.js | grep -v '^src/theme/' | wc -l

# distinct font sizes
grep -rIohE 'fontSize: *[0-9]+' src --include=*.js | grep -oE '[0-9]+$' | sort -nu

# distinct radii
grep -rIohE 'borderRadius: *[0-9]+' src --include=*.js | grep -oE '[0-9]+$' | sort -nu

# raw spacing values
grep -rIoE '(padding|margin)(Top|Bottom|Left|Right|Horizontal|Vertical)?: *[0-9]+' src --include=*.js | wc -l

# props that should exist but don't
for p in hitSlop KeyboardAvoidingView returnKeyType autoComplete allowFontScaling fontFamily; do
  printf "%-24s %s\n" "$p" "$(grep -rIo "$p" src --include=*.js | wc -l)"
done
```

`scripts/check-tokens.js` (added in Phase 1 of the refactor) automates these as a regression gate, with the baseline **79 / 166 / 79 / 304 / 40**.

---

## 10. Reconciling the existing docs

**`NoboSole_UI_UX_Design_Guidelines.md`** (657 lines) is a well-written spec that does not match the shipped app:

- Its color values contradict `src/theme/colors.js` on 3 of 5 core tokens — spec light `background: #ffffff` vs shipped `#f4f6fa`; spec `surface: #f8f9fa` vs shipped `#ffffff`; spec `accent: #7a5a00` (ochre) vs shipped `#ef4444` (red).
- It instructs "Create `colors.accent` token. Map `#d4af37`". **Following that instruction today would silently recolor 21 existing consumers** — every error message and both cart badges — from red to gold. The refactor instead adds separate `error` and `brand` token families and retires `accent` gradually.
- It prescribes 8 files that do not exist: `theme/typography.js`, `theme/spacing.js`, `hooks/useDebounce.js`, `hooks/useHaptic.js`, `utils/validation.js`, `utils/formatters.js`, `components/ui/`, `components/empty-states/`.
- Its 6-level type scale is too coarse for the 21 sizes actually in use; the refactor uses 11 roles.

**Recommendation:** amend the doc to shipped reality rather than treat it as a target. Its structural guidance (4dp grid, 48dp targets, 4.5:1 contrast, animation and haptic tables) is sound and worth keeping.

**`UI_UX_AUDIT.md`** is written in past tense as though everything in it were done. Most of it is — the responsive grid (`useResponsiveGrid.js:6-8`), reduced-motion support (`LaunchScreen.js:234`), and the i18n parity checker are all real. But line 39's claim that colors follow "one NoboSole visual system" is contradicted by the 79 stray hex literals, line 46's claim of "accessible labels for icon-only controls" is contradicted by 9 of 44 files having any, and its claim that admin UI was removed is contradicted by `src/features/admin/` still existing on disk.

**`UI_BUG.md`** — re-scored against current code: **11 fixed, 4 partial, 15 still open.** Still open and worth noting: #6 and #16 (division picker is free-text with no search), #9 (no loading skeleton), #14 (the inert "Currency BDT" row still renders a chevron implying it's tappable — `profileMenu.js` + `ProfileListCard.js:30,45`), #20/21 (no gesture back, no transitions), #25 (no haptics), #26 (timer drift in `FestivalDiscountBanner.js:28` and `BannerCarousel.js:55`), #27 (all tabs stay mounted).

---

## 11. What was built

`src/theme/` — the token layer:

| File | Contents |
|---|---|
| `colors.js` | Palette, now with `brand*`, `onBrand`, `error*`, `sale*`, scrim and skeleton families. `accent` retired. |
| `tokens.js` | `spacing`, `radius`, `opacity`, `hitSlop`, `control`, `duration`, `elevation()` |
| `typography.js` | 12 roles built per locale once at module load; `useTypography()`; font-scaling cap |
| `useStyles.js` | Memoises a `getStyles` factory against theme + locale |
| `index.js` | One import surface |

`src/ui/` — 15 presentational primitives: `AppText`, `AsyncStateView`, `Badge`, `Button`,
`Card`, `Chip`, `EmptyState`, `ErrorState`, `FormField`, `IconButton`, `Input`,
`KeyboardAwareScreen`, `ScreenTitle`, `SelectionCard`, `SummaryRows`.

Feature-level extractions: `AllocationLine` (was written out four times), `SaleBadge` (two
designs), `ProfileRow` (two copies).

Line-height, resolved per locale rather than hardcoded:

| Role | size | English | Bangla |
|---|---|---|---|
| `body` | 16 | 22 (1.38×) | 28 (1.75×) |
| `bodySm` | 14 | 19 (1.36×) | 25 (1.79×) |
| `micro` | 11 | 15 (1.36×) | 19 (1.73×) |

English reproduces the `bodyLineHeight: 22` the app already declared; Bangla now clears the
1.6× floor everywhere instead of at the 1.26–1.43× that was clipping descenders.

## 12. Verifying

```bash
npm run check          # i18n key parity + token regression gate + web bundle
npm run check:tokens -- --verbose   # per-file breakdown of remaining literals
npm run android        # run against a dev client
```

`npm run check` is a compile-and-count gate, not a visual one. Before shipping, walk each
screen on a real Android device across **dark×en, dark×bn, light×en, light×bn**, checking:
both themes render with no stranded colour; the longest Bangla string is not clipped and
`ু ৃ ্র` are fully visible; tap targets pass the Accessibility Scanner; buttons show their
disabled and loading states without resizing; empty and error states appear when the network
is down; the keyboard never covers a focused field or the submit button; and add-to-cart,
place-order and refresh-orders all behave exactly as before.

None of this changed what the app *does*. Every state transition, network call, and business
rule is byte-for-byte as it was — `src/services/`, `src/utils/`, `src/hooks/` and every
`features/*/data` and `features/*/services` file are untouched.
