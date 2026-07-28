# NoboSole Mobile — Performance Optimization Results

**Date:** 2026-07-28
**Scope:** render performance, bundle/APK size, startup latency, perceived responsiveness.
**Constraint:** business rules were not modified. `mapApiProduct`, `mapApiCart`,
`discountedPaisa`, `getCheckoutTotals`, MOQ/pack validation and the order workflow are
byte-for-byte unchanged — every optimization below is about *when* and *how often* they run,
never *what they compute*.

---

## Measured results

Both figures come from `npx expo export --platform android`, before and after.

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| Icon font assets | 1,883,464 B | **186,080 B** | **−1,697,384 B (−90%)** |
| Hermes JS bundle | 2,985,436 B | **2,798,856 B** | −186,580 B |
| **Total JS payload** | **4,868,900 B** | **2,984,936 B** | **−1,883,964 B (−38%)** |

The bundle shrank as a side effect of the icon work: each `@expo/vector-icons` family
carries a large glyph-name map in JS, not just a TTF.

| Metric | Before | After |
|---|---|---|
| Cold-start network round-trips | 4 sequential stages, run **twice** | **1 parallel batch, run once** |
| `getSession()` (AsyncStorage + lock) per load | 5 | **1**, then cached |
| Style objects built at mount | ~6,440 | **~25** (lazy; 528 ceiling) |
| `React.memo` components | 1 (and it was defeated) | **15** (and the original one works) |
| Stable `useCallback` handlers | 1 | **31** |
| Tab screens mounted at rest | **5**, permanently | 1–2, on first visit |
| Always-on background timers | 2 (1 Hz + 0.31 Hz) | **0** when hidden or backgrounded |
| Order history rendering | `ScrollView` + 3-deep `.map()`, unbounded | Virtualized `FlatList` |
| Android hardware back | Exited the app | Pops the stack, then Home |

---

## What changed

### 1. Icon families collapsed — the largest single win

Every import was already deep-path, so Metro only bundled families actually reached. Four
were reached, three of them for a handful of glyphs:

| Family | Was | Glyphs used | Now |
|---|---:|---|---|
| MaterialCommunityIcons | 1,307,660 B | 2 (`shoe-sneaker`, `party-popper`) | **removed** → Feather `image`, `gift` |
| Ionicons | 389,724 B | 1 (`trash-outline`) | **removed** → Feather `trash-2` |
| AntDesign | 130,484 B | 2 (`google`, `user`) | `user` → Feather; **kept for `google`** |
| Feather | 55,596 B | 9 | the single family |

**AntDesign is retained deliberately.** Google's Sign-In branding guidelines require the
official mark, so substituting a generic glyph is not an option. 130 KB for brand
compliance on the sign-in button is the right trade; it is documented at the import site.

### 2. `AppText` — a regression from the UI refactor, fixed

`AppText` built a 23-entry `StyleSheet` **per component instance** and read exactly 2
entries from it. With ~280 instances mounted that was ~6,440 style objects, and every theme
or language toggle rebuilt all of them synchronously on one tap.

The style for a given `(theme, locale, variant, tone)` is identical for every instance, so
it is now composed once at module scope into a lazy two-level cache. `AppText` also dropped
`useTypography()` (it needs the language string, not the object), gained `React.memo`, and
passes the cached style object directly when there is no override — which keeps the `style`
prop referentially identical across renders.

`__styleBuildCount` is exported for verification: after warm-up it should sit at a few dozen,
never in the thousands.

### 3. Startup — one parallel batch instead of eight round-trips

`loadStore` awaited four stages in sequence. Tracing it showed the *network calls* have no
data dependency on each other — the sequencing existed purely so responses could be
**mapped** in order. `getStorefront` supplies one number; `getProfile` is best-effort with
no dependency at all.

Fetching is now separated from mapping (`fetchCatalogRaw` + `buildCatalog`, `fetchCartRaw` +
`mapApiCart`), so all four fire in one `Promise.allSettled` batch and the same mapping
functions run afterwards with identical arguments.

Two more startup fixes:
- The realtime channel's `SUBSCRIBED` callback re-ran the whole waterfall ~500 ms after
  every cold start. It is now gated on staleness, so the duplicate load is gone.
- `api.js` awaited `supabase.auth.getSession()` on **every** request — an AsyncStorage read
  behind the client's session lock, so concurrent requests serialized against each other.
  The token is now cached and kept fresh by `onAuthStateChange`; the existing
  401 → refresh → retry path remains the safety net, and now adopts the refreshed token
  immediately rather than waiting for the listener.
- `res.text()` + `JSON.parse` became `res.json()`, removing a full string copy of a payload
  that can reach a megabyte.

### 4. The refetch storm and the blocking overlay

`setDataStatus("loading")` was unconditional, and the overlay is opaque and full-screen. It
fired on mount, on realtime events, on **every** foreground (notification shade, permission
dialogs, returning from Google sign-in, unlocking), on festival expiry — and on a language
toggle, because `t` was a dependency of `loadStore`.

Now there are three modes:

| Mode | Trigger | UI |
|---|---|---|
| `initial` | first load, no data yet | Overlay, and only while `!hasData` |
| `silent` | realtime, foreground, festival expiry | Nothing; existing content stays put |
| `user` | explicit retry | Overlay |

Plus: `t` moved to a ref; the foreground listener requires both a real absence (>5 s) *and*
stale data (>60 s); the `catalog_revision` payload is now read so unchanged revisions are
ignored instead of triggering a full re-download; and the debounce is jittered 500–5000 ms
so N clients stop hitting `/products` in the same window after an admin edit.

### 5. Render performance

- **The only `memo` in the codebase was defeated.** `CatalogProductCard` received
  `onOpenProduct`, recreated on every `MainTabs` render, so the shallow compare always
  failed — and that cascaded into `renderProduct`'s `useCallback` churning and the grid
  re-rendering every visible row. `pushScreen` and `handleOpenProduct` are now stable.
- **Cart handlers stabilized** via a latest-value `stateRef`, so they read volatile state
  instead of closing over it and can hold empty dependency arrays. This is the same
  mechanism react-redux and zustand use internally — no new dependency needed.
- **15 components memoized**, and `CartLineItem` now receives unbound handlers and binds its
  own line id, so its props are stable enough for the memo to hold.
- **Lazy tab mounting.** Tabs mount on first visit and stay mounted. Previously all five
  mounted on first render and never unmounted.
- **Two always-on timers stopped.** The festival countdown re-rendered twelve text nodes
  once a second forever, including while the Home tab was hidden and while the app was
  backgrounded; the carousel scrolled an invisible list every 3.2 s. Both now gate on
  visibility and foreground via `useIsAppForeground`.
- **`BannerCarousel` moved onto the native driver.** The whole carousel was pinned to the JS
  thread at 60 callbacks/second by exactly one interpolation — the pagination dots'
  `width`, a layout property that can never be native-driven. The dots now ride a separate
  discretely-stepped value, so `scrollX` is fully native with no visual change.
- **`catalogProductFor` was O(lines × products)** per cart mutation — a linear scan over
  ~100 products for every cart line. Replaced with a `WeakMap` index keyed on the catalog
  object, which self-invalidates because the catalog is replaced wholesale on every load.
- **Clear-cart** was a sequential `await` loop: ten lines meant ten serial round-trips
  (~3 s), each re-mapping the whole cart only for it to be discarded. Now parallel.
- **Order history virtualized.** `OrdersScreen` and `ExpenseTrackerScreen` rendered an
  unpaginated history through a `ScrollView` and three nested `.map()` calls — fifty orders
  mounted a four-figure number of text nodes at once. Both are now `FlatList`s over
  extracted, memoized row components (`OrderHistoryCard`, `ExpenseOrderCard`).

### 6. Build and tooling

- **R8 + `shrinkResources` enabled** via `expo-build-properties`, with keep rules for React
  Native, Hermes, OkHttp/Okio and Google Play Services Auth.
- **`metro.config.js` added** with a `blockList` for `dist/` and `temp-export-*`. Metro's
  default watch root made it crawl ~14 MB of committed build output on every start.
  The patterns are anchored to the project root on purpose — an unanchored `/dist/` also
  matches `node_modules` packages that ship a `dist/` directory and silently breaks module
  resolution.
- **`@expo/vector-icons` is now a declared dependency.** It was imported by 14 files while
  being only an unpinned transitive of `expo`.
- **`react-dom`, `react-native-web` and `expo-dev-client` moved to `devDependencies`.** They
  contribute 0 APK bytes but are genuinely used by `npm run check` and `npm run web`, so
  they are moved rather than removed.
- **Android hardware back now works.** There was no `BackHandler` anywhere, so back exited
  the app outright from a product page or mid-checkout.

---

## Still outstanding

### Needs a real device or an EAS build

The APK-level numbers in this report are **projections, not measurements**. Before trusting
them, run:

```bash
eas build --profile preview        # then: unzip -l the .apk, compare bytes by directory
adb shell am start -W -n com.nobosole.mobile/.MainActivity   # x5 cold, force-stop between
```

**R8 must soak before it ships.** It is the one change here that can produce a
*release-only* crash — if a keep rule is missing, the failure appears in the release APK and
nowhere else. Build `preview`, run a full end-to-end pass (sign in → browse → add to cart →
place order), and let it sit. Do not enable R8 and ship production the same day.

### Deliberately not done

- **Optimistic cart updates.** `MainTabs.js`'s `if (mutationBusy) return;` still silently
  swallows rapid taps — five fast taps on `+` yields quantity 2, with no error and no
  feedback. That is a correctness bug wearing a performance costume, and the fix is a
  per-line coalescing queue with optimistic state. It is contained but touches the cart
  mutation path, so it deserves its own change and its own testing pass.
- **The `MainTabs` context split.** Handlers are stable now, but `MainTabs` still re-renders
  and rebuilds all mounted screen trees on every state change. Splitting it into
  `StoreProvider` + `NavigationProvider` with separate catalog/cart/status contexts is what
  takes renders-per-cart-tap from ~15 down to only the affected subtree. ~2 weeks, and the
  riskiest item on a codebase with no test suite.
- **`expo-image`.** Product images still use RN core `Image` with no cache policy and no CDN
  resizing, so full-resolution originals are decoded for ~170dp thumbnails, and
  `ProductGallery` decodes the same image up to three times concurrently.
- **Catalog payload.** `limit: 100` with `pagination` returned and never read; ~100 products
  × ~48 variants ≈ 1–3 MB of JS heap, re-downloaded whole on every refresh. The biggest
  remaining win, and it needs a backend list projection.
- **Offline.** The app is still unusable without a network; nothing is cached but theme,
  language and auth tokens.
- **Launcher icon.** `app.json` still declares no `icon`, `splash.image` or `adaptiveIcon`,
  so the app ships Expo's default placeholder. Fixing this *adds* ~250 KB — budget it.

---

## Verifying

```bash
npm run check      # i18n parity + token regression gate + web bundle
npx expo export --platform android --output-dir /tmp/x   # then compare asset + .hbc bytes
```

Because there is no test suite, the behavioural checks are manual. The ones that matter most
for this change set:

1. Cold start reaches content without a blank frame.
2. Background the app for 10 s and return — **no full-screen spinner**, no lost scroll
   position.
3. Toggle language — the catalog must **not** re-download.
4. Android back from a product page pops to the grid; from a tab, returns Home; from Home,
   exits.
5. Visit every tab once, then return to Home — the banner carousel and festival countdown
   resume correctly.
6. Cart: increment, decrement, remove, clear. Clear should be visibly faster than before.
7. Orders and Expense Tracker scroll smoothly with a long history.
8. Both themes and both languages, since `AppText`'s style cache is now keyed on both.
