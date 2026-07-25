# 🔐 Complete Plan: Secure Production-Ready APK + Backend

## Phase 1: Backend API

| Item | What to Use | Purpose |
|------|-------------|---------|
| API server | Node.js + Express, Supabase, or Firebase | Handle auth, data, business logic |
| Database | PostgreSQL (via Supabase) or MongoDB | Persistent storage |
| Auth system | JWT (access + refresh tokens) or Supabase Auth | Real user login/logout |
| HTTPS | Let's Encrypt + reverse proxy (nginx/Caddy) | Encrypt all traffic |
| Rate limiting | `express-rate-limit` | Prevent brute force / abuse |
| Input validation | `zod` or `joi` | Validate all incoming data |
| Security headers | `helmet` middleware | CSP, HSTS, X-Frame-Options |

**Recommended stack (simplest):** Supabase handles auth, DB, and REST API automatically.

---

## Phase 2: App Security & API Integration

| Item | Package/Technique | Purpose |
|------|------------------|---------|
| HTTP client | `axios` | Make API calls |
| Environment vars | `expo-constants` + `.env` | Store API URL, public config |
| Secure storage | `expo-secure-store` | Store JWT tokens (encrypted) |
| Auth flow | Axios interceptors | Auto-attach token to requests, handle 401 → refresh |
| Token refresh | Axios interceptor + refresh token rotation | Keep user logged in securely |
| Input validation | `zod` on client too | Validate before sending to API |
| SSL pinning | `react-native-ssl-pinning` | Prevent MITM attacks |

---

## Phase 3: Android APK Hardening

| Item | Config | Purpose |
|------|--------|---------|
| ProGuard | `expo-build-properties` plugin | Obfuscate & shrink code |
| Network Security | `network_security_config.xml` via `expo-build-properties` | Allow only your API domain |
| Single arch | `abiFilters: ["arm64-v8a"]` | Smaller APK, covers 95%+ devices |
| APK signing | EAS Build signs automatically | Tamper-proof distribution |
| App permissions | Minimal AndroidManifest | Only request what you need |
| App secrets | EAS Build Secrets (not in code) | Store API keys, signing credentials |

---

## Phase 4: Development Workflow

| Item | What to Do |
|------|------------|
| EAS Profiles | Set up `production`, `staging`, `preview` profiles with different env vars |
| EAS Secrets | Store API keys, DB URLs in `eas secret:create` |
| Expo Updates | Use `expo-updates` for OTA updates |
| Testing | `jest` + `@testing-library/react-native` for unit/integration tests |
| CI/CD | GitHub Actions → EAS Build → EAS Submit |

---

## Secrets & Security Architecture

### What goes where

| Item | Location |
|------|----------|
| JWT signing secret | Backend `.env` (server-side, never exposed) |
| JWT token (after login) | Mobile app `expo-secure-store` |
| API base URL | Mobile app `.env` / EAS Secrets |
| Supabase anon key (public) | Mobile app `.env` / EAS Secrets |
| DB passwords | Backend `.env` (server-side, never in mobile) |

### Environment variable rules
- ✅ **OK in mobile .env:** API base URL, feature flags, public keys (Supabase anon key)
- ❌ **NEVER in mobile .env:** JWT signing secret, DB password, admin API keys, encryption keys

### Auth flow
1. User logs in → app sends email+password to backend
2. Backend verifies credentials, creates JWT using signing secret, returns it
3. App stores JWT in `expo-secure-store`
4. Every API call: app attaches `Authorization: Bearer <token>`
5. Backend verifies JWT using signing secret — secret never leaves server

---

## APK Size Optimization

| Step | Saving |
|------|--------|
| Delete `temp-export-*` directories | ~10 MB |
| Tighten `assetBundlePatterns` | ~3 MB |
| ProGuard + shrinkResources | ~5 MB |
| Single arch (`arm64-v8a` only) | ~10 MB |
| Strip unused icon fonts | ~3 MB |

**Target:** ~30-40 MB (down from ~70 MB)
