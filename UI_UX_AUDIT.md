# NoboSole APK UI/UX Audit and Implementation Record

## Scope

This review covers the customer-facing Expo application: launch and authentication, catalog discovery, product cards, product details, cart, checkout, orders, profile completion, profile settings, responsive behavior, accessibility, and English/Bangla localization.

## Problems identified

### Product discovery

- Product cards used dimensions that could hide or compress the product action on narrow screens.
- Product imagery did not have one reusable loading, fallback, and sizing policy.
- Catalog grids did not adapt consistently to phone, large-font, tablet, and wide-screen layouts.
- Product names and descriptions were not consistently switched to their Bangla fields.
- Empty catalog states depended on mock presentation content.

### Product details

- Only the primary product image was exposed to the customer.
- There was no thumbnail selector, current-image indicator, or full-screen viewer.
- Product configuration labels, validation, quantity, pricing, and CTA text were partly hard-coded.

### Launch and authentication

- The language control was positioned independently from the page layout.
- Short phone screens could place content outside the visible/safe area.
- Continuous animation did not respect the operating system's reduced-motion preference.
- Google authentication and profile-refresh fallback errors remained in English.

### Cart, checkout, orders, and profile

- Product Bangla names were returned by the API but discarded by the cart mapper.
- Currency and date formatting did not consistently follow the selected language.
- Several labels, errors, shipping/payment descriptions, and accessibility labels remained in English.
- Dead admin and mock UI remained inside the customer application even though staff accounts are rejected by the customer authentication bootstrap.

### Consistency and accessibility

- Surface, border, CTA, and navigation colors did not consistently follow one NoboSole visual system.
- Some icon-only actions lacked an accessible name or selected/disabled state.
- There was no automated parity check for English and Bangla resources.

## Implemented design system

- Premium NoboSole visual direction using deep navy surfaces, gold actions, cyan highlights, and high-contrast typography.
- Shared theme colors across headers, bottom navigation, cards, forms, and primary actions.
- Minimum 44-point interactive controls where practical, visible pressed/disabled states, and accessible labels for icon-only controls.
- Safe-area-aware launch, stack, tab, and bottom-navigation layouts.
- Language-aware BDT number formatting and order date formatting.

## Implemented responsive behavior

The shared product grid uses:

- Two columns on ordinary phones.
- One column on very narrow devices when large system text is enabled.
- Three columns at 600 points and above.
- Four columns at 900 points and above.

Card width is calculated from current viewport width, horizontal padding, and grid gap. Product images use a square frame with `contain`, so source images of different dimensions remain fully visible without distortion.

The launch screen now uses all safe-area edges, a scrollable content container, a compact layout below 700 points in height, and reduced-motion support.

## Implemented product experience

- The complete card is clickable and has a full-width, always-visible product action.
- Images have shared loading, failure, and fallback rendering.
- Product details use all sorted product images from the API.
- The gallery provides horizontal paging, thumbnails, an image counter, and a full-screen viewer.
- Product title, description, options, price, MOQ, stock validation, and cart CTA are localized.
- Cart mapping retains `nameBn`, allowing the selected language to remain consistent after adding a product.

## Implemented localization

- Customer-visible static copy is stored in matching English and Bangla resource trees.
- Catalog products use `nameBn` and `descriptionBn` when available, with API text as a data fallback.
- Geography names, price values, dates, statuses, authentication errors, cart, checkout, confirmation, orders, and profile-completion messages follow the selected language.
- `npm run check:i18n` validates resource parity, statically referenced keys, and accidental English duplication in Bangla resources.

## Cleanup

- Removed obsolete mock catalog data and unused legacy product/configuration components.
- Removed the unreachable staff/admin panel from the customer APK. Staff administration remains the responsibility of the separate dashboard.
- Removed unreachable mock logo-upload presentation from the customer cart flow.

## Verification

- `npm run check:i18n`: passes with 242 matching localization keys.
- `npm run check`: passes the localization audit and a production-style Expo web export.
- Launch screen visually checked at 320×568 and 390×844; language controls, login action, and footer remain visible.

## Remaining content responsibility

For a product to be fully translated and visually complete, administrators should maintain:

- English and Bangla product names.
- English and Bangla product descriptions.
- A primary product image and optional additional images.
- Active variants with price, color, size, and available stock.

If Bangla product content is not entered in the dashboard, the APK intentionally falls back to the available API product text instead of hiding the product.
