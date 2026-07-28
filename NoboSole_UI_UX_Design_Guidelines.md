# NoboSole Android App — Bug Resolution & Comprehensive UI/UX Design Guidelines

> **Version:** 1.0  
> **Platform:** Android (API 23+)  
> **Framework:** React Native  
> **Date:** July 2026

---

## PART 1: BUG RESOLUTION MATRIX

The following table provides the **correct option/fix** for every item in the audit log.

| ID | Priority | Issue | Correct Fix |
|---|---|---|---|
| 1 | **P0** | Missing `colors.success` / `colors.warning` | **Add tokens to both palettes.** Define `success: '#22c55e'` (light) / `#4ade80` (dark) and `warning: '#f59e0b'` (light) / `#fbbf24` (dark) in `colors.js`. Never reference undefined theme tokens inline. |
| 2 | **P0** | Hardcoded English in ProductConfiguratorForm | **Full i18n wrap.** Replace every literal string with `t('key')`. Add keys to `en.json`, `bn.json`, and all future locale files. Use interpolation: `t('select_colors', { count: quantity })`. |
| 3 | **P0** | Hardcoded Bangla placeholder in ProfileCompletionScreen | **Replace with `t('company_name_optional')`.** The placeholder must react to locale changes dynamically. |
| 4 | **P1** | Theme toggle not persisted | **Persist to AsyncStorage.** On mount, read `Appearance.getColorScheme()` as default, then override with stored user preference. Save on every toggle. |
| 5 | **P1** | ProfileWelcomeCard hardcoded background | **Use `colors.surfaceSoft` or `colors.cardSecondary`.** All surfaces must derive from theme tokens. |
| 6 | **P1** | Division field is free-text | **Replace with `<Picker>` or searchable bottom-sheet modal.** Populate from Bangladesh's 8 divisions + 64 districts dataset. Validate selection before submit. |
| 7 | **P1** | Hardcoded phone number in ProfileFooter | **Use `t('support_phone')` or remove.** If the number is region-specific, make it locale-dependent or pull from remote config. |
| 8 | **P1** | HomeScreen empty state shows headers | **Conditional section rendering.** Render the entire block (header + FlatList/ScrollView) only when `data.length > 0`. Otherwise show a single EmptyState component. |
| 9 | **P1** | No loading skeleton on HomeScreen | **Implement shimmer skeletons.** Use `react-native-reanimated` or `react-native-shimmer-placeholder` with 3-4 card placeholders matching final card dimensions. |
| 10 | **P1** | Theme Provider hardcodes dark default | **Respect system preference.** Initialize with `Appearance.getColorScheme() || 'dark'`. Allow user override via toggle. |
| 11 | **P2** | Hardcoded gold `#d4af37` scattered | **Create `colors.accent` token.** Map `#d4af37` (dark) and `#7a5a00` (light). Replace every hardcoded instance via global search. Use `StyleSheet.create()` with theme injection. |
| 12 | **P2** | Search screen has no debounce | **Add 300ms debounce.** Use `useDeferredValue` or a custom `useDebounce` hook. Filter only after user pauses typing. Show a "Searching..." micro-indicator. |
| 13 | **P2** | No pull-to-refresh on Orders/Categories | **Add `RefreshControl` to all scrollable data screens.** Standard Android pull-to-refresh pattern with spinner color matching `colors.accent`. |
| 14 | **P2** | Inert "Currency BDT" row in Profile | **Remove chevron if non-interactive.** If currency switching is planned, implement a bottom-sheet picker. If not, render as plain info row with no touch feedback. |
| 15 | **P2** | Product Configurator validation UX unclear | **Inline validation + disabled CTA.** Show red helper text under invalid size fields. Disable "Add to Cart" with opacity 0.5; on press of disabled state, shake the form and show a Snackbar: "Each size needs at least 2 pairs." |
| 16 | **P2** | Division pickers lack search/scroll indicators | **Use a searchable bottom-sheet modal.** Add `showsHorizontalScrollIndicator={true}` for chips. For 64+ items, prefer vertical `SectionList` with alphabet indexing. |
| 17 | **P2** | Cart empty state is plain text | **Rich empty state.** Centered vector illustration (shopping bag icon), title `t('cart_empty_title')`, subtitle `t('cart_empty_subtitle')`, and primary CTA button "Browse Products" navigating to Home. |
| 18 | **P2** | Error banner in MainTabs overlaps stack screens | **Context-aware zIndex.** Use React Navigation's `navigation.getState()` to detect stack depth. Only render banner when `stackIndex === 0`. Alternatively, render error inside each tab screen, not in the tab bar. |
| 19 | **P2** | Double error display in Cart | **Single source of truth.** If MainTabs banner is active, suppress inline cart error. Use a shared error context or check banner visibility before rendering inline error. |
| 20 | **P3** | No gesture back-swipe on stack screens | **Enable gestures in React Navigation.** Set `gestureEnabled: true` and `gestureDirection: 'horizontal'` on stack navigator screen options. Android back button is handled automatically by `@react-navigation/native-stack`. |
| 21 | **P3** | No screen transition animations | **Use default/native stack animations.** React Native's native-stack provides platform-appropriate slide transitions. Do NOT use `animation: 'none'`. |
| 22 | **P3** | LaunchScreen emoji lacks accessibilityLabel | **Add `accessibilityLabel={t('app_logo_description')}`** and `accessibilityRole="image"`. Alternatively, use a proper SVG logo instead of emoji for brand consistency. |
| 23 | **P3** | Icon-only pressables lack accessible names | **Add `accessibilityLabel` and `accessibilityRole="button"` to all icon buttons.** Examples: `accessibilityLabel={t('search')}`, `accessibilityLabel={t('remove_from_cart')}`. |
| 24 | **P3** | Color-only feedback for selected states | **Multi-modal selection cues.** Add checkmark icon, bold text, or increased elevation for selected chips. Never rely on color alone. Follow WCAG 2.1 1.4.1. |
| 25 | **P3** | No haptic feedback on key actions | **Use `react-native-haptic-feedback`.** Trigger `impactLight` on button press, `notificationSuccess` on add-to-cart/order placed, `notificationError` on validation failure. |
| 26 | **P3** | FestivalDiscountBanner timer drift | **Use `requestAnimationFrame` + delta calculation.** Record `Date.now()` on mount and calculate remaining time on each frame. Clear on unmount. Pause when app is backgrounded via `AppState`. |
| 27 | **P3** | All tab screens stay mounted | **Use conditional mounting or React Navigation's lazy loading.** Set `lazy: true` on tab navigator. Unmount inactive tabs to free memory. |
| 28 | **P3** | Animated smoke characters lack accessibility hints | **Add `accessibilityElementsHidden={true}` or `importantForAccessibility="no-hide-descendants"`.** Decorative animations should not be focusable. |
| 29 | **P3** | No keyboardType on tradeLicenseNumber | **Use `keyboardType="default"` with `autoCapitalize="characters"`.** Trade licenses are alphanumeric (e.g., "TRAD/DSL/2024/001"). |
| 30 | **P3** | No auto-capitalization for name fields | **Add `autoCapitalize="words"`** to first name, last name, company name, and address line fields. |

---

## PART 2: COMPREHENSIVE UI/UX DESIGN GUIDELINES

### 1. Design System Foundation

#### 1.1 Color Tokens (Theme-Agnostic)
All colors must be referenced via semantic tokens. Never use raw hex values in components.

```
// Light Theme
primary:        '#1a1a1a'      // Main text, icons
secondary:      '#666666'      // Subtitle, helper text
accent:         '#7a5a00'      // CTAs, active states, links (gold-brown for light)
success:        '#16a34a'      // Paid, confirmed, valid
warning:        '#d97706'      // Due, pending, caution
error:          '#dc2626'      // Validation errors, banners
background:     '#ffffff'      // Screen background
surface:        '#f8f9fa'      // Cards, inputs, elevated surfaces
surfaceSoft:    '#f1f3f4'      // Welcome cards, secondary surfaces
border:         '#e5e7eb'      // Dividers, input borders
disabled:       '#d1d5db'      // Disabled buttons, inactive text

// Dark Theme
primary:        '#f5f5f5'
secondary:      '#a1a1aa'
accent:         '#d4af37'      // Brighter gold for dark backgrounds
success:        '#4ade80'
warning:        '#fbbf24'
error:          '#f87171'
background:     '#0f0f0f'
surface:        '#1c1c1c'
surfaceSoft:    '#262626'
border:         '#333333'
disabled:       '#525252'
```

**Rule:** Any new color must be added to both palettes before use.

---

### 2. Typography Scale

Use a strict 6-level type scale with consistent line heights and weights.

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `heading1` | 28sp | Bold (700) | 36sp | Screen titles, empty states |
| `heading2` | 22sp | SemiBold (600) | 30sp | Section headers, card titles |
| `heading3` | 18sp | SemiBold (600) | 26sp | Dialog titles, form sections |
| `body` | 16sp | Regular (400) | 24sp | Primary body text, descriptions |
| `bodySmall` | 14sp | Regular (400) | 20sp | Captions, metadata, timestamps |
| `caption` | 12sp | Medium (500) | 16sp | Badges, labels, overlines |

**Android Rules:**
- Minimum touchable text: 14sp
- Use `Roboto` or `Noto Sans Bengali` for Bangla
- Respect system font scaling (`allowFontScaling: true`)

---

### 3. Spacing & Layout Grid

Base unit: **4dp**

```
xs:   4dp
sm:   8dp
md:   16dp
lg:   24dp
xl:   32dp
xxl:  48dp
```

**Screen Padding:** Horizontal `16dp` on phones, `24dp` on tablets.
**Card Padding:** `16dp` internal.
**Card Gap:** `12dp` between cards.
**Section Gap:** `24dp` between logical sections.

---

### 4. Component Specifications

#### 4.1 Buttons

**Primary Button (CTA)**
- Background: `colors.accent`
- Text: `colors.background` (inverted for contrast)
- Height: 48dp (minimum Android touch target)
- Border radius: 8dp
- Font: `body`, weight SemiBold
- States:
  - Default: elevation 2
  - Pressed: scale 0.98, elevation 4, haptic `impactLight`
  - Disabled: opacity 0.4, no elevation

**Secondary Button**
- Background: transparent
- Border: 1.5dp `colors.accent`
- Text: `colors.accent`
- Same dimensions as primary

**Icon Button**
- Touch target: minimum 48dp × 48dp
- Icon size: 24dp
- Must include `accessibilityLabel`

#### 4.2 Cards

**Product Card**
- Background: `colors.surface`
- Border radius: 12dp
- Elevation: 2 (light), 4 (dark)
- Padding: 12dp
- Image aspect ratio: 1:1 (square) or 4:5
- Shadow: `shadowColor: '#000'`, `shadowOpacity: 0.08`, `shadowRadius: 8`, `elevation: 3`

**Info Card (e.g., Expense Tracker)**
- Background: `colors.surfaceSoft`
- Left accent border: 4dp `colors.accent`
- Border radius: 8dp
- Padding: 16dp

#### 4.3 Inputs

**TextInput**
- Height: 56dp
- Background: `colors.surface`
- Border: 1dp `colors.border`
- Border radius: 8dp
- Padding horizontal: 16dp
- Font: `body`
- Focused state: border color `colors.accent`, elevation 1
- Error state: border color `colors.error`, helper text below in `colors.error`
- Label: floats above on focus (Material Design 3 style)

**Picker / Dropdown**
- Use bottom-sheet modal on Android
- Search bar at top for lists > 10 items
- Selected item: checkmark icon + bold text + `colors.accent` background tint

---

### 5. Navigation Patterns

#### 5.1 Bottom Tabs
- Active tab: `colors.accent` icon + label
- Inactive tab: `colors.secondary` icon + label
- Label font: `caption`
- Height: 64dp (includes safe area)
- **Lazy load:** Only mount active tab screen

#### 5.2 Stack Screens
- Header: Back arrow (24dp) + screen title (`heading2`)
- Header background: `colors.surface`
- Header elevation: 4
- Transition: Native Android slide-from-right
- Gesture: Swipe-from-edge to go back (enabled)
- Android back button: Always respected

#### 5.3 Modals / Bottom Sheets
- Use `@gorhom/bottom-sheet` for picker modals
- Handle indicator at top (4dp × 32dp, `colors.border`)
- Backdrop: `rgba(0,0,0,0.5)` with tap-to-dismiss
- Snap points: `['25%', '50%', '90%']` based on content

---

### 6. Empty States

Every list, cart, orders, and search result must have a designed empty state.

**Structure:**
1. **Illustration:** 120dp × 120dp vector icon (Lottie or SVG), color `colors.secondary`
2. **Title:** `heading2`, `colors.primary`, centered
3. **Description:** `body`, `colors.secondary`, centered, max 2 lines
4. **CTA:** Primary or Secondary button (if actionable)

**Examples:**
- **Cart Empty:** Bag icon + "Your cart is empty" + "Browse our latest collection"
- **Search Empty:** Search icon + "No results found" + "Try different keywords"
- **Orders Empty:** Clipboard icon + "No orders yet" + "Start shopping"
- **Home Empty:** Box icon + "New arrivals coming soon" + "Check back later"

---

### 7. Loading States

#### 7.1 Initial Load (Cold Start)
- Full-screen shimmer with 3-4 placeholder cards
- Match final layout dimensions exactly
- Duration: Until data fetch completes
- **Never** show a blank screen or spinner alone

#### 7.2 Pull-to-Refresh
- `RefreshControl` on all `FlatList` / `ScrollView`
- Spinner color: `colors.accent`
- Background: `colors.surface`

#### 7.3 Inline Loading
- Skeleton placeholders for list items
- Pulsing animation: opacity 0.3 → 0.7, duration 1200ms, infinite
- Button loading: Replace text with circular spinner (16dp), disable input

#### 7.4 Action Loading
- Button shows spinner + "Please wait..."
- Overlay on form to prevent double-submit
- Haptic: none (avoid noise during wait)

---

### 8. Error Handling & Feedback

#### 8.1 Error Banner (Top Snackbar)
- Position: Top of screen, below header
- Background: `colors.error`
- Text: `colors.background`, `body`
- Left icon: Alert circle (20dp)
- Right action: "Dismiss" text button or X icon
- Auto-dismiss: 5 seconds
- **Z-index rule:** Only show on tab screens, never on stack overlay screens

#### 8.2 Inline Validation
- Field border turns `colors.error`
- Helper text appears below: `caption`, `colors.error`
- Icon: Alert circle (16dp) at end of input
- Appears on blur (not on every keystroke)

#### 8.3 Dialog / Alert (Critical Errors)
Use for:
- Payment failure
- Session expiry
- Unsaved changes when navigating back

**Structure:**
- Title: `heading3`, centered
- Body: `body`, centered
- Actions: 1-2 buttons stacked vertically
- Backdrop: non-dismissible for critical actions

#### 8.4 Toast (Success Feedback)
- Position: Bottom, 24dp from nav bar
- Background: `colors.success`
- Text: `colors.background`
- Icon: Checkmark circle
- Duration: 2.5 seconds
- Haptic: `notificationSuccess`

#### 8.5 Network Error
- Full-screen error with retry button
- Illustration: WiFi-off icon
- Title: "Connection lost"
- Button: "Retry" (triggers reload)
- Auto-retry: 3 attempts with exponential backoff

---

### 9. Pop-ups, Modals & Dialogs

#### 9.1 Confirmation Dialog
```
┌─────────────────────────────┐
│                             │
│      [Alert Icon 48dp]      │
│                             │
│   Remove from cart?         │
│   heading3                  │
│                             │
│   This item will be removed │
│   from your cart.           │
│   body, secondary           │
│                             │
│   ┌─────────────────────┐   │
│   │    Cancel           │   │
│   │    Secondary btn    │   │
│   └─────────────────────┘   │
│   ┌─────────────────────┐   │
│   │    Remove           │   │
│   │    Destructive btn  │   │
│   └─────────────────────┘   │
└─────────────────────────────┘
```
- Destructive action: Red background or red text
- Cancel action: Secondary style

#### 9.2 Bottom Sheet Picker (Division/District)
```
┌─────────────────────────────┐
│         ━━━ (handle)        │
│  [Search icon] Search...    │
│  ─────────────────────────  │
│  ○ Dhaka                    │
│  ○ Chittagong               │
│  ● Rajshahi          ✓      │
│  ○ Khulna                   │
│  ○ Barisal                  │
│  ○ Sylhet                   │
│  ○ Rangpur                  │
│  ○ Mymensingh               │
└─────────────────────────────┘
```
- Search filters in real-time (local)
- Selected item highlighted with `colors.accent` tint
- Section headers for alphabetical grouping if >20 items

#### 9.3 Currency Picker (If Implemented)
- Same bottom-sheet pattern
- Show flag emoji + currency code + name
- Selected currency marked with checkmark

---

### 10. Forms & Input Validation

#### 10.1 Form Layout
- One column layout (mobile)
- Label above input (not inline)
- Gap between fields: 20dp
- Section dividers: 1dp `colors.border`, 24dp vertical margin

#### 10.2 Validation Rules
| Field | Rules | Error Message Key |
|---|---|---|
| Name | Required, min 2 chars | `error_name_required` |
| Phone | BD format (+880/01XXXXXXXXX) | `error_phone_invalid` |
| Email | Optional, valid format | `error_email_invalid` |
| Address | Required, min 10 chars | `error_address_short` |
| Division | Must select from list | `error_division_required` |
| Trade License | Alphanumeric, min 5 chars | `error_license_invalid` |
| Configurator Size | Min 2 pairs per selected size | `error_min_pairs` |

#### 10.3 Validation Timing
- **On blur:** Check field validity
- **On submit:** Check all fields, scroll to first error
- **Real-time:** Only for password strength or character counting

#### 10.4 Submit Behavior
- Disable submit button if form invalid
- On valid submit: show button loader, disable form, haptic `impactLight`
- On success: Toast + navigate + haptic `notificationSuccess`
- On error: Inline field errors OR banner if server error

---

### 11. Accessibility (A11y)

#### 11.1 Minimum Requirements
- All interactive elements: minimum 48dp × 48dp touch target
- All images/icons: `accessibilityLabel` or `accessibilityElementsHidden`
- Color contrast: Minimum 4.5:1 for normal text, 3:1 for large text
- Selected states: Never color-only (add icon/shape/weight change)

#### 11.2 Screen Reader Support
```jsx
// Good
<Pressable 
  accessibilityLabel={t('add_to_cart')}
  accessibilityRole="button"
  accessibilityState={{ disabled: !isValid }}
>
  <Text>Add to Cart</Text>
</Pressable>

// Bad
<TouchableOpacity onPress={addToCart}>
  <Icon name="cart" />
</TouchableOpacity>
```

#### 11.3 Focus Management
- Auto-focus first invalid field on submit error
- Trap focus inside modals
- Return focus to trigger element on modal close

---

### 12. Animation & Motion

#### 12.1 Principles
- Purposeful: Guide attention, show relationships, provide feedback
- Fast: Most transitions 200-300ms
- Consistent: Same animation pattern for same action type

#### 12.2 Standard Durations
| Animation | Duration | Easing |
|---|---|---|
| Button press | 100ms | ease-out |
| Screen transition | 300ms | native default |
| Modal slide-up | 250ms | ease-in-out |
| Skeleton pulse | 1200ms | ease-in-out (infinite) |
| Toast enter/exit | 200ms | ease-out |
| Error shake | 400ms | linear |

#### 12.3 Haptic Mapping
| Action | Haptic |
|---|---|
| Button tap | `impactLight` |
| Toggle switch | `impactLight` |
| Add to cart | `notificationSuccess` |
| Place order | `notificationSuccess` |
| Validation error | `notificationError` |
| Delete/Remove | `impactMedium` |
| Pull-to-refresh trigger | `impactLight` |

---

### 13. Dark/Light Theme Implementation

#### 13.1 Theme Architecture
```
ThemeProvider (Context)
├── Reads AsyncStorage on mount
├── Reads Appearance API for default
├── Exposes: theme, colors, isDark, toggleTheme()
└── Wraps entire app
```

#### 13.2 Theme Switching Rules
- Toggle in ProfileScreen updates context + AsyncStorage
- App restart: Read storage → fallback to Appearance → fallback to dark
- No flash of wrong theme on launch

#### 13.3 Image Handling
- Product images: Same for both themes (photography)
- Icons: Use `currentColor` or theme-aware tint
- Illustrations: Provide dark variants if they contain light backgrounds

---

### 14. Android-Specific Guidelines

#### 14.1 System Integration
- Status bar: `translucent` with `background` color
- Navigation bar: Match `background` color (Android 8.1+)
- Edge-to-edge: Use `react-native-edge-toast` or `SystemBars` from `react-native-bars`
- Notch / Dynamic Island: Respect `SafeAreaView`

#### 14.2 Hardware Back Button
- Must navigate back in stack
- Must dismiss modal/bottom-sheet if open
- Must show exit confirmation on home screen (double-tap to exit)
- Must not exit app from inner screens

#### 14.3 Keyboard Handling
- Use `android:windowSoftInputMode="adjustResize"` in `AndroidManifest.xml`
- Scroll to focused input when keyboard opens
- Dismiss keyboard on scroll (tap outside)

#### 14.4 Performance
- Use `FlatList` for all lists > 10 items
- Use `React.memo` for list items
- Use `getItemLayout` for fixed-height lists
- Image loading: Use `react-native-fast-image` with placeholder
- Avoid re-renders: Use `useCallback` for event handlers passed to children

---

### 15. Localization (i18n)

#### 15.1 String Management
- All user-facing strings in `t('key')`
- Keys: `screen_component_element` format
- Example: `home_search_placeholder`, `cart_empty_title`, `error_phone_invalid`

#### 15.2 Bangla (bn) Specifics
- Font: `Noto Sans Bengali` or system default
- Numbers: Use Bengali numerals (০-৯) if culturally appropriate, else standard
- Text direction: LTR (Bengali is LTR)
- Date format: `DD MMM YYYY` (e.g., "২৬ জুলাই ২০২৬")

#### 15.3 Placeholders
- Must translate: `placeholder={t('company_name_optional')}`
- Never hardcode Bangla or English directly in JSX

---

### 16. Festival / Promotional UI

#### 16.1 Discount Banner
- Position: Top of HomeScreen, below header
- Height: 56dp
- Background: Gradient `colors.accent` to darker shade
- Countdown timer: Monospace font, `caption` size
- Dismissible: X icon on right
- **Timer accuracy:** Use delta-based calculation, not `setInterval`

#### 16.2 Badge / Tag
- Background: `colors.accent` at 15% opacity
- Text: `colors.accent`
- Border radius: 4dp
- Padding: 4dp horizontal, 2dp vertical
- Font: `caption`

---

### 17. Checkout Flow UX

#### 17.1 Step Indicator
```
[Shipping] ──→ [Payment] ──→ [Review] ──→ [Confirm]
   ●             ○            ○            ○
  active      inactive     inactive     inactive
```
- Active step: `colors.accent` circle + bold label
- Completed step: Checkmark icon + `colors.success`
- Inactive step: `colors.border` circle + `colors.secondary` label

#### 17.2 Form Progress
- Show summary card at top of each step
- Allow editing previous steps via "Change" link
- Final Review: Full order summary with product thumbnails

#### 17.3 Order Confirmation
- Success animation (checkmark Lottie)
- Order ID prominently displayed
- Estimated delivery date
- Buttons: "Track Order" (primary) + "Continue Shopping" (secondary)

---

### 18. Cart & Product Configurator

#### 18.1 Cart Item Card
- Thumbnail: 80dp × 80dp, border radius 8dp
- Product name: `heading3`, 1 line, ellipsis
- Variant info: `bodySmall`, `colors.secondary`
- Quantity stepper: - [ 3 ] + (min 1, max 99)
- Price: `heading3`, right aligned
- Swipe to delete: Red background, trash icon, haptic `impactMedium`

#### 18.2 Product Configurator
- Size grid: 3 columns, chip style
- Selected size: `colors.accent` border, checkmark, bold text
- Quantity per size: Stepper below selected size
- Validation: Real-time pair counting, inline error if < 2
- Summary: "Total: X dozen (Y pairs)"
- CTA: "Add X dozen to cart" — disabled with reason if invalid

---

### 19. Order History

#### 19.1 Order Card
- Status badge top-right: `colors.success` (delivered), `colors.warning` (shipped), `colors.accent` (processing)
- Order ID: `bodySmall`, monospace
- Date + Total: `body`
- Product thumbnails: Horizontal scroll, 40dp × 40dp, overlap -8dp
- Chevron right: Indicates tappable

#### 19.2 Order Detail
- Timeline vertical line: `colors.border`, 2dp width
- Timeline dots: `colors.accent` for current, `colors.success` for completed
- Timeline labels: `bodySmall`
- Action buttons: "Track" / "Reorder" / "Invoice"

---

### 20. File Structure & Naming

```
src/
├── components/
│   ├── ui/               # Reusable primitives (Button, Input, Card)
│   ├── profile/            # Profile-specific
│   ├── checkout/           # Checkout-specific
│   └── empty-states/       # EmptyState component variants
├── screens/
│   ├── HomeScreen.js
│   ├── CartScreen.js
│   └── ...
├── theme/
│   ├── colors.js           # Both palettes
│   ├── typography.js       # Type scale
│   ├── spacing.js          # 4dp grid
│   └── ThemeProvider.js    # Context + persistence
├── hooks/
│   ├── useDebounce.js
│   ├── useTheme.js
│   └── useHaptic.js
├── utils/
│   ├── validation.js       # Form rules
│   └── formatters.js       # Currency, date
└── i18n/
    ├── en.json
    └── bn.json
```

---

## Appendix: Quick Reference Checklist

**Before every release, verify:**
- [ ] No hardcoded strings (search for `"` and `'` in JSX text nodes)
- [ ] No hardcoded colors (search for `#` in style objects)
- [ ] All images have `accessibilityLabel`
- [ ] All buttons have minimum 48dp touch target
- [ ] Dark mode tested on all screens
- [ ] Bangla locale tested on all screens
- [ ] Loading skeletons present on all data screens
- [ ] Empty states present on all lists
- [ ] Pull-to-refresh on all data lists
- [ ] Error handling covers network, server, and validation cases
- [ ] Haptics active on all primary CTAs
- [ ] Back button behavior correct on all screens
- [ ] Keyboard doesn't obscure inputs
- [ ] No runtime crashes from undefined theme tokens

---

*End of Document*
