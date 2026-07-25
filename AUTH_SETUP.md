# NoboSole Supabase authentication setup

Supabase Auth owns Google login, access/refresh tokens, session persistence,
and logout. The NoboSole API accepts the Supabase access token and resolves the
application role from PostgreSQL.

## 1. Supabase and Google

In Supabase Authentication > Providers, enable Google and enter the Google Web
OAuth client ID and client secret. Add this callback URI to that Google OAuth
client:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Set the Supabase Site URL to the deployed web origin and add local/production
web origins to the redirect allow list. Never put the Google client secret or a
Supabase service-role/secret key in the app.

## 2. App environment

Copy `.env.example` to `.env` and set:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<google-web-client-id>.apps.googleusercontent.com
EXPO_PUBLIC_WEB_URL=http://localhost:8081
```

Set `EXPO_PUBLIC_API_URL` when overriding the production API default. Android
emulators use `http://10.0.2.2:3000/api/v1` for a backend running on the host.

## 3. Android OAuth client

Create or verify an Android OAuth client for package
`com.nobosole.mobile`. Add SHA-1 fingerprints for local debug, EAS
development/preview/production, and Google Play signing keys as applicable.

The native app exchanges Google's ID token directly with
`supabase.auth.signInWithIdToken()`. Web builds use Supabase OAuth redirect
login.

## 4. Development workflow

Rebuild the APK after changing native Google Sign-In configuration:

```bash
npm run build:development
```

Use `npm run start:clear` for JavaScript development and
`npm run build:preview` for a shareable APK.
