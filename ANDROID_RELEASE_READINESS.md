# Android release readiness

**As of 2026-07-28.** Every claim here was verified against the code at the time of writing;
`file:line` references are given so each can be re-checked rather than taken on trust.

The app is close to submittable. What is left is three items that need an account or a
decision you own, and a short list of resilience gaps that will not block review but will be
felt by customers.

---

## Blockers

### 1. No crash reporting — you would ship blind

`ErrorBoundary` is mounted outermost at `App.js:48`, above every provider, so a render throw
now shows a recovery screen instead of a blank one. But `componentDidCatch` only calls
`console.error`, which in a release build reaches nobody. No Sentry, Bugsnag or Crashlytics is
installed.

You will not know a crash happened, how often, or on which device.

`ErrorBoundary` already takes an `onError` prop for exactly this — wiring an SDK is a small
change. **It needs a DSN from your account, which is why it is still open.**

### 2. `EXPO_PUBLIC_WEB_URL` is localhost, and it ships inside the APK

`.env` sets `EXPO_PUBLIC_WEB_URL=http://localhost:8081`, and Expo inlines `EXPO_PUBLIC_*` at
bundle time. So a device build made on a developer machine carries localhost, and the
Privacy, Terms, Returns and Delete Account rows in Profile all open a dead address — the
exact four links a Play reviewer taps to approve the Data Safety declaration.

**This value cannot simply be changed.** It is also the Supabase OAuth `redirectTo` for the
web target (`googleAuth.web.js:8`). Pinning it to production was tried and broke local
sign-in: the redirect went to the deployed site instead of back to the dev server.

Three ways out, in order of preference:

1. **Set it in the EAS `production` environment and leave `.env` alone.** EAS does not upload
   `.env` (see `.easignore`), so a cloud build already takes the value from there. This costs
   nothing locally and is almost certainly the right answer.
2. **Delete the variable from `.env` entirely.** `env.js:20-23` already falls back to
   `window.location.origin` in a browser and to the `WEB_URL` constant otherwise — so web dev
   would auto-detect localhost and native would take the https constant. Cleaner, but the
   `typeof window` guard is unsafe on native: React Native defines a global `window` with no
   `location`, so that branch would need a `Platform.OS === "web"` check first.
3. Keep `.env` as-is and remember to override before every device build. Fragile.

Whichever you pick, the pages must also actually be served: they exist only in the web export,
copied by `scripts/copy-public-pages.js`, so the deployment has to come from
`npm run export:web`. Verify `https://nobosole-app.vercel.app/privacy/` loads in a browser
before submitting.

### 3. The Firebase service-account key is still in the working tree

`nobosole-web-ba3c2-firebase-adminsdk-fbsvc-a0f9dc0fc5.json` at the project root is a real
private key — world-readable, and matched by **no** `.gitignore`. It is untracked today only
because the project root happens not to be a git repository; a single `git init` there would
commit it.

**Rotate it in Google Cloud IAM, then delete the file.** I will not delete it for you.

---

## Resolved since the first audit

| | Evidence |
|---|---|
| App icon, adaptive icon, monochrome, splash | `assets/`, wired in `app.json`. Adaptive layer was overflowing the 66/108 safe zone by 108px and being cropped by circular masks; `scripts/fit-adaptive-icon.js` now measures the artwork and fits it |
| Version codes | EAS `appVersionSource: "remote"` + `autoIncrement`, enforced by `check-release-config.js` |
| Error boundary | `App.js:48`, outermost, bilingual, with a working retry |
| Offline detection | `useNetworkStatus.js` + `OfflineBanner`, above the checkout overlay |
| In-app account deletion | `DELETE /client/profile` anonymises the profile, drops the cart, deactivates the account; orders retained per the published policy |
| Session tokens | SecureStore, with byte-aware chunking — a real session is ~3.5 KB against a 2048-byte cap, so writes were silently failing |
| Cart data loss | `cart.service.js` rescales allocations and replaces packs in one transaction; the non-atomic delete-then-add is gone |
| Legal pages + Profile section | `public/{privacy,terms,returns,account-deletion}` |
| Release gate | `npm run check:release` |
| Untranslated errors | `INVALID_RESPONSE` was the only unmapped code; `SESSION_REVOKED` is now actually thrown |

---

## Ship-critical, not blocking

**No push notifications.** No `expo-notifications`, no FCM. An order moves Pending →
Confirmed → Shipped and the customer only finds out by opening the app. For a wholesale buyer
waiting on stock, that is the single most valuable thing still missing.

**No tests for the app.** `npm run check` is a smoke gate: syntax, i18n parity, token drift,
and whether the bundle builds. It cannot catch a wrong price or a broken pack rule. The server
has 19 Jest suites; the app has none, and no ESLint config or typecheck either.

**Checkout state is lost on an OS kill.** Shipping method, address, payment method and coupon
are `useState` in `MainTabs` and reset to Home. Annoying, not dangerous — an earlier note
called this a duplicate-order risk and that was wrong: `order.service.js:303` clears the cart
inside the same transaction that creates the order, so a retry finds an empty cart and cannot
double-order.

**No OTA updates.** `expo-updates` is absent, so every fix — including a wrong price — is a
full store release with review latency.

---

## Known open defects

Both were found earlier and deliberately left alone.

**`cart.controller.js:33` — `configurationValid` picks its multiplier from allocation count.**
```js
item.allocations.length > 1 ? item.quantity_dozen : 1
```
Not a real rule. A single-allocation line with `quantity_dozen > 1` is validated against 12
while its stored pairs sum to `12 × quantity`, so it reports invalid. The flag feeds
`checkoutReady` (`:79-80`), so it can block checkout on a perfectly good cart.

**`order.service.js:185` — `total_pairs` is double-multiplied.**
```js
Math.floor(allocation.pairs_per_dozen * item.quantity_dozen / Math.max(numColors, 1))
```
`pairs_per_dozen` is already scaled by quantity — that is what `packPolicy.js:25` enforces —
so multiplying again double-counts, and `/ numColors` is an ad-hoc correction that only
cancels when `numColors === quantity_dozen`. **This is the number your warehouse
manufactures against.**

Two tests in `cart-pack.test.js` also fail today, asserting colour/size-count enforcement that
`validatePackRecipe` never implemented. Four failures total, all pre-existing.

---

## Nice to have

- **Deep links.** `scheme: "nobosole"` is declared with no `intentFilters` and no `Linking`
  listener — dead config. Also blocks "share this product".
- **State restoration.** Active tab, pushed screen and scroll position all reset after an OS
  kill.
- **`expo-image`.** Weaker than it sounds: only two remote-image sites, RN's `Image` already
  disk-caches, and URLs are plain stored columns rather than signed URLs, so there is no
  cache-key churn to fix.
- **The catalog payload.** `PERFORMANCE_REPORT.md` calls this the biggest remaining
  performance win — ~100 products × ~48 variants re-downloaded whole on every refresh, with
  `pagination` returned and never read. Needs a backend list projection.

---

## Hand-off — things only you can do

1. Rotate the Firebase key and delete the file.
2. Confirm `https://nobosole-app.vercel.app` serves the four legal pages.
3. Supply a crash-reporting DSN.
4. Play Console: create the app, complete Data Safety, set up App Signing, and provide a
   service-account JSON for `eas submit`.
5. Rename the EAS project slug from `react-native-starter`, then update `app.json`. Not done
   here because renaming it locally without renaming it on the `nasimx` account orphans the
   project.
6. Confirm `supabase-auth-cutover.sql` actually ran in production — it enables RLS on every
   `public` table and revokes `anon`/`authenticated` grants, but it is a manual one-shot
   script, not a tracked migration.
7. Verify Google Sign-In on a real production build. `google-services.json` has never existed
   in this repo despite `.gitignore` claiming it is kept here, and the signing SHA-1
   registered in Google Cloud is unverifiable from source.
8. **Let R8 soak** before promoting. A missing keep rule fails only in release.

---

## Measured, not estimated

JS payload from a cache-cleared `expo export --platform android`:

| | Committed `dist/` (2026-07-26) | Fresh export | Delta |
|---|---|---|---|
| Hermes bundle | 2,959,208 B | 2,879,372 B | −79,836 B |
| Icon fonts | 1,937,520 B | 186,080 B | −1,751,440 B |
| **Total** | **4,896,728 B** | **3,077,468 B** | **−37%** |

**No APK or AAB has ever been built.** Every install-size figure in this repository — the
"~70 MB" baseline included — is an estimate with no artifact behind it. Run
`npm run build:preview`, `unzip -l` the result, and record real bytes before quoting a number
to anyone.
