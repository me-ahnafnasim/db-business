# NoboSole — Android app

Bangladeshi B2B wholesale footwear ordering. Buyers configure 12-pair packs by colour and
size, order by the dozen, and pay by Cash on Delivery or bank transfer.

Expo SDK 54 · React Native 0.81.5 · React 19 · plain JavaScript · managed (CNG) workflow —
there is no `android/` directory; the native project is generated on the EAS build worker.

---

## Setup

```bash
npm install
cp .env.example .env      # then fill in the Supabase values
npm start                 # dev client; this app cannot run in Expo Go
```

`expo-dev-client` and native Google Sign-In mean **Expo Go will not work**. Install a
development build first:

```bash
npm run build:development
```

### Environment

Four `EXPO_PUBLIC_*` variables, all public by design — see `.env.example`. Two things about
them that have bitten before:

- **They are inlined at bundle time.** Whatever is in `.env` when you build is baked into the
  APK. `EXPO_PUBLIC_WEB_URL` is `http://localhost:8081` because local web sign-in needs it as
  the Supabase OAuth redirect — but that same value becomes the base for the Privacy, Terms,
  Returns and Delete Account links, so a device build made locally ships four dead links.
  Set it in the EAS `production` environment; see `ANDROID_RELEASE_READINESS.md`.
- **`.env` is not uploaded to EAS** (see `.easignore`). Cloud builds read the EAS
  *environment variables* attached to the `production` environment. If they are missing, the
  app throws at launch from `assertSupabaseConfig()`.

`.env.local` is loaded *ahead of* `.env`, so a local override reaches device builds too. The
release check reads it first for that reason.

---

## Checks

```bash
npm run check          # syntax · i18n parity · design-token regression · web bundle
npm run check:release  # the above + release config + a cache-cleared Android export
```

There is **no test suite for the app** — `npm run check` is the whole safety net, and it is a
smoke gate, not a test. It catches syntax errors parsed from disk, missing or untranslated
i18n keys, drift away from the design tokens, and a bundle that will not build. It cannot
catch a wrong price or a broken cart rule. The server (`../server`) has 19 Jest suites.

| Script | What it guards |
|---|---|
| `check:syntax` | Parses every file with Babel **from disk** — Metro's cache has served stale modules and hidden a real syntax error before |
| `check:i18n` | English/Bangla key parity, untranslated values, unreferenced keys |
| `check:tokens` | Counts hardcoded hex, `rgba(`, `fontSize`, `borderRadius`, spacing, and unmemoised `getStyles` against `scripts/token-baseline.json`; fails on any increase |
| `check-release-config` | Icon dimensions (parsed from the PNG header), EAS version source, submit track, legal pages, and that the web URL is a real https origin |

---

## Building

```bash
npm run build:preview      # installable .apk, internal distribution
npm run build:production   # .aab for Play (runs check:release first)
npm run submit:internal    # eas submit -> internal track, as draft
```

Version codes come from EAS (`appVersionSource: "remote"` with `autoIncrement`), so nothing
in `app.json` needs bumping between builds. `version` is the user-facing name only.

### Icons

`assets/icon.png` is the source of truth. The adaptive and monochrome layers are derived:

```bash
npm run fit:icons
```

Android only guarantees the centre 66/108 of an adaptive icon is visible. The script measures
how far the artwork actually reaches from centre and scales it to fit — the original filled
the canvas and was being cropped by circular launcher masks.

---

## Before you ship

- **Let R8 soak.** Minification and resource shrinking are on. A missing keep rule fails
  *only* in a release build. Build `preview`, run sign-in → browse → configure a pack → cart
  → checkout → place order, and let it sit. Do not enable R8 and promote to production the
  same day.
- **Measure the APK.** Every size figure in this repo is an estimate; no build has ever been
  measured. `unzip -l` the preview APK and record real bytes by directory in
  `PERFORMANCE_REPORT.md`.
- **Check the legal links on device.** Privacy, Terms, Returns and Delete Account must open
  the live site. A Play reviewer taps all four.

See `PLAY_STORE_RELEASE.md` for the Play Console runbook and listing copy, and
`ANDROID_RELEASE_READINESS.md` for what is still outstanding.

---

## Layout

```
src/
  theme/       design tokens, palettes, locale-aware type scale, useStyles
  ui/          17 presentational primitives — props in, JSX out
  components/  app-level shells, nav, banners
  features/    auth · catalog · cart · checkout · order · profile · support
  screens/     one file per screen; MainTabs.js is the navigator and data layer
  services/    api.js — fetch wrapper with timeout, 401 refresh-retry, error codes
  i18n/        en/bn resources, locale layout metrics, error-code mapping
```

**Navigation is hand-rolled.** `MainTabs.js` holds tab state plus a pushed-screen stack
rendered as an absolute overlay. There is no `react-navigation`, so `useFocusEffect` and
friends are not available. Android back is handled explicitly by `handleHardwareBack`, which
unwinds the stack, then tab history, then asks before exiting.
