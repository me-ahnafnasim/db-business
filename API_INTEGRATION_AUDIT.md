# API integration audit

Checked against the Express routes in `../server/src/modules` on 2026-07-14.

## Mobile customer flow

| Capability | API | UI consumer | Status |
|---|---|---|---|
| Google login metadata | `POST /auth/bootstrap` | `LaunchScreen`, `AuthProvider` | Connected through Supabase Auth |
| Refresh session | Supabase SDK | automatic API retry | Connected |
| Logout | Supabase SDK | profile sign-out | Connected |
| Read profile | `GET /client/profile` | session restore | Connected |
| Create profile | `POST /client/profile` | `ProfileCompletionScreen` | Connected |
| Geography | `GET /divisions` plus manual district/thana input | profile location fields | Connected |
| Product list | `GET /products` | home, categories, search | Connected |
| Cart | all four client cart routes | cart list and mutation controls | Connected |
| Create order | `POST /orders` | checkout review | Connected |
| Order list | `GET /client/orders` | `OrdersScreen` | Connected |
| Cancel order | `PATCH /client/orders/:id/cancel` | pending-order action | Connected |

`PATCH /client/profile`, `GET /products/:id`, and `GET /client/orders/:id` are
available in the API service but do not need a separate request in the current
screens because the list/profile responses already contain the displayed data.

## Staff-only API

The mobile admin card connects the three analytics endpoints. Product CRUD,
staff order management, inventory adjustments, payments, labels, users, and
uploads belong to the separate dashboard workflow described by the server
requirements; they are deliberately not exposed as customer mobile controls.

## Live prerequisites still required

- Supabase Google provider, callback URL, site URL, and redirect allow list are configured.
- Seed or import product data. The live database check found 0 products and
  0 variants. District and thana names can be entered manually during profile completion.
- Deploy the API over HTTPS and set `EXPO_PUBLIC_API_URL` for EAS preview and
  production builds. A local emulator URL cannot work in a distributed APK.
