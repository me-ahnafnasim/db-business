# NoboSole Google Play release runbook

This runbook assumes a new personal Play developer account, a free app, package
`com.nobosole.mobile`, and an initial Bangladesh-only launch.

## 1. One-time Play Console setup

1. Create and verify the personal Play developer account, enable two-step
   verification, and pay Google's registration fee.
2. Create **NoboSole** as an **App**, **Free**, with **English** as the default
   language. Accept Play App Signing.
3. Use a durable developer-support email. Do not use a personal address that may
   be lost when staff changes.
4. Limit the first release to Bangladesh.
5. Upload `assets/store/play-icon-512.png` and
   `assets/store/feature-graphic.png`.
6. Capture phone screenshots from the internal-test build in both English and
   Bangla. Cover sign-in, catalog, product configuration, cart, checkout and
   order tracking.

The package name is permanent after the first Play app is created.

## 2. Store listing copy

### English short description

Wholesale footwear ordering with flexible size and color packs.

### English full description

NoboSole helps wholesale footwear customers browse products, configure
size-and-color packs, manage a cart and place business orders from Android.

Use NoboSole to:

- browse the current catalog and promotional collections;
- inspect product images, colors, sizes and wholesale pricing;
- build valid packs for the quantity you need;
- review delivery and payment choices before placing an order;
- follow order status and payment history; and
- use the app in English or Bangla, with light and dark themes.

Product availability, pack rules, delivery and payment options are confirmed
when an order is reviewed.

### Bangla short description

সাইজ ও রঙের প্যাক সাজিয়ে সহজে পাইকারি জুতার অর্ডার করুন।

### Bangla full description

NoboSole পাইকারি জুতা ক্রেতাদের পণ্য দেখা, সাইজ ও রঙ অনুযায়ী প্যাক তৈরি,
কার্ট পরিচালনা এবং Android থেকে ব্যবসায়িক অর্ডার করতে সাহায্য করে।

NoboSole দিয়ে আপনি:

- বর্তমান ক্যাটালগ ও প্রচারণার পণ্য দেখতে পারবেন;
- পণ্যের ছবি, রঙ, সাইজ ও পাইকারি মূল্য যাচাই করতে পারবেন;
- প্রয়োজনীয় পরিমাণ অনুযায়ী সঠিক প্যাক তৈরি করতে পারবেন;
- অর্ডারের আগে ডেলিভারি ও পেমেন্ট পদ্ধতি পর্যালোচনা করতে পারবেন;
- অর্ডারের অবস্থা ও পেমেন্ট ইতিহাস দেখতে পারবেন; এবং
- বাংলা বা ইংরেজিতে লাইট ও ডার্ক থিম ব্যবহার করতে পারবেন।

পণ্যের প্রাপ্যতা, প্যাকের নিয়ম, ডেলিভারি ও পেমেন্ট পদ্ধতি অর্ডার পর্যালোচনার
সময় নিশ্চিত করা হয়।

## 3. Policy declarations

Use the deployed URLs, not local files:

- Privacy policy: `https://nobosole-app.vercel.app/privacy/`
- Terms: `https://nobosole-app.vercel.app/terms/`
- Delivery, returns and refunds: `https://nobosole-app.vercel.app/returns/`
- Account deletion: `https://nobosole-app.vercel.app/account-deletion/`

Before submitting, deploy the web export and verify all four URLs in a private
browser window and on a phone.

Data Safety must be reconciled with the backend and every included SDK. At
minimum, review these categories:

- name, email address and profile image from Google sign-in;
- phone number, business name, trade-license information and delivery address;
- cart, orders, payment status and support messages;
- authentication, security and diagnostic request information.

Declare **no ads** unless an advertising SDK is later added. The app sells
physical goods, so COD and bank transfer do not use Google Play Billing.

Provide app-review access instructions explaining that sign-in uses Google and
that only customer accounts can use the mobile app. Supply a dedicated review
account if Google cannot create an eligible customer profile itself.

## 4. Production environment and build

Verify the EAS `production` environment contains:

```text
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_WEB_URL
```

All `EXPO_PUBLIC_*` values are embedded in the client and must not contain
private keys.

```bash
npm run check:release
npm run build:production
```

The production profile produces an Android App Bundle (`.aab`). The preview
profile produces an APK for direct device testing and is not the Play artifact.

## 5. Internal and closed testing

1. Submit the AAB as a draft internal release:

   ```bash
   npm run submit:internal
   ```

2. In Play Console, open **App integrity** and copy the Play App Signing SHA-1
   and SHA-256 certificate fingerprints. Register them with the Android Google
   OAuth/Firebase configuration for `com.nobosole.mobile`.
3. Install from Play's internal-testing link. Verify Google sign-in and place an
   order against the production API.
4. Complete the real-device checklist below before promoting the same approved
   build to closed testing.
5. For a new personal account, keep at least 12 testers opted in continuously
   for 14 days. Record feedback and the fixes made so the production-access
   questionnaire can be answered with evidence.

## 6. Device acceptance checklist

- Clean install, update install, sign-in, sign-out and expired-session recovery.
- English and Bangla, light and dark theme, increased Android font size.
- Catalog, search, images, product pack validation and sale prices.
- Add, edit and remove cart lines, including rapid repeated quantity taps.
- Shipping, COD, bank transfer, review and a real test order.
- Order confirmation, history, cancellation rules and expense tracker.
- Hardware back and predictive back from every checkout step.
- Background/foreground, airplane mode, slow connection and API timeout.
- Privacy, terms, returns, WhatsApp support and deletion links.
- R8/minified build soak with no release-only crash.

## 7. Production

Resolve Play pre-launch report failures and all policy warnings. Apply for
production access after the closed-test requirement is satisfied. Start with a
staged rollout when Play Console offers it, watch sign-in/API/order failures,
then expand to 100%.

Every later AAB needs a higher version code. EAS remote versioning and
`autoIncrement` are configured to enforce this.
