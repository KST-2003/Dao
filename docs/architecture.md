# Architecture

```
            ┌───────────────────────── DAO ✦ ─────────────────────────┐
 Mobile (Expo) ──HTTPS/Bearer──►                                        │
 Admin (Vite)  ──HTTPS/httpOnly cookie──► Laravel API ──► MySQL 8       │
                                   │            ├──► Redis (cache, queue)
                                   │            ├──► R2/S3 (images, video)
                                   │            └──► Providers: Google, LINE, Twilio, Stripe, Expo Push
            └────────────────────────────────────────────────────────┘
```

## Existing-repo inspection
This is a **new project**. The reference project (Moi Order) described in `SETUP_INSTRUCTIONS.md` lives on the owner's Mac and was **not accessible** from the build environment, so nothing was copied from it. Its documented conventions were followed instead (layer order, `{message, code, errors}` error shape, `/api/health`, FileStorage interface, Sanctum, Redis, Supervisor, EAS channel logic, screen/coordinator-hook/styles split).

Decisions where the two briefs conflicted (confirmed with the owner): **Tailwind** for admin (not MUI), **Expo Router** (not React Navigation), placeholder identifiers (`com.daoapp.customer`, `api.YOURDOMAIN.com`).

## Backend layers (`dao-backend/app`)
| Layer | Folder | Rule |
|---|---|---|
| Enums | `Enums/` | All statuses/types. Mirrored in `dao-frontend/src/types/enums.ts` |
| Validation | `Http/Requests/{Api,Admin}` | Every write validated |
| DTOs | `DTOs/` | Typed hand-off between controller and service |
| Services | `Services/*` | All business logic (Auth, Cart, Pricing, Checkout, Orders, Payments, Loyalty, Membership, Coupons, Inventory, Content, Notifications) |
| Controllers | `Http/Controllers/{Api/V1,Admin}` | Thin |
| Resources | `Http/Resources/Api` | Response shapes, localized fields |
| Events/Listeners | `Events/`, `Listeners/` | Side-effects after commit (points, tiers, notifications) |
| Contracts | `Contracts/` | Provider-independent interfaces: `PaymentGatewayInterface`, `SmsProviderInterface`, `SocialIdentityProviderInterface`, `PushProviderInterface`, `FileStorageInterface` |

### Key flows
- **Auth**: identity = `(provider, provider_user_id)` in `user_auth_providers`. Google ID tokens and LINE codes are verified **server-side** (LINE channel secret never leaves the server). Accounts are **never auto-merged by email/phone** (takeover risk); a signed-in user links more providers explicitly (`POST /me/providers/{provider}`). Phones normalized to E.164 (TH/MM rules).
- **OTP**: HMAC-hashed codes, 5-minute TTL, 5 attempts, 60 s resend cooldown, 5 requests/phone/hour, per-IP rate limiter. If no SMS provider is configured the API returns `503 SMS_NOT_CONFIGURED` — it never pretends.
- **Pricing** (`PricingService`, single source of truth): list price → member price / tier % → coupon → points (capped %) → shipping. The app only displays the quote.
- **Checkout** (`CheckoutService`): one transaction locks cart + variants, re-validates stock, re-prices, compares `expected_total` (rejects `TOTAL_CHANGED` instead of silently charging a different amount), decrements stock (movement ledger), records coupon + points, clears purchased lines. Idempotency key per order. Payment is initiated **after** commit.
- **Payments**: `PaymentManager` + gateways (COD, bank transfer/PromptPay, Stripe Checkout). Unconfigured gateways are hidden. Stripe orders become paid **only** via signed webhook.
- **Loyalty**: append-only `loyalty_transactions` with FIFO lots (`remaining`) for expiry; cached `loyalty_accounts.balance` reconciled nightly (`dao:points:reconcile`). Purchase points awarded on `OrderPaid`; refunds create `refund_reversal` (+ `redemption_reversal` for spent points). Idempotency keys prevent double awards.
- **Membership**: data-driven tiers; qualifies when lifetime points **or** lifetime spend reaches the threshold. Changes write `membership_histories` and notify on upgrade.
- **Referral**: recorded at signup, rewarded only after the referee's first **paid** order ≥ configured minimum.
- **Quantity limits**: products have optional `min_order_qty`/`max_order_qty` (per order, across all sizes/colors; null = none). Max is enforced when adding to the cart, min at checkout (`below_min_quantity` / `above_max_quantity` cart issues).
- **Pre-orders** (`PreorderService`): products with `preorder_enabled` accept pre-orders for any size/color, even at zero stock, within `preorder_min_qty`/`preorder_max_qty` per pre-order and an optional total `preorder_capacity` (rejected/cancelled/refunded pre-orders free their share). Stock is never touched. Destination (Thailand/Myanmar) comes from the address country and picks the path: `submitted → in_review → approved|rejected → waiting_payment → in_process →` Thailand `packaging → on_delivery → completed`, Myanmar `waiting_courier → in_transit → landed_myanmar → on_delivery → completed`. Staff set shipping when moving to `waiting_payment`, which creates a linked payable `orders` row (`orders.preorder_id`); payment (gateways/webhook/staff confirm) reuses the normal path, and `OrderPaid` moves the pre-order to `in_process` — staff can never set that by hand. The linked order's status mirrors the pre-order and can't be driven directly (`ORDER_MANAGED_BY_PREORDER`); points are awarded by the existing `OrderPaid` listener.
- **Content**: one `videos` table with `content_type` (vlog/recipe/fashion/tutorial/short); `product_video` powers "Shop this look".
- **Comments** (`CommentService`): one level of replies (a reply to a reply attaches to the top-level comment), likes via the shared `likes` table, optional image (presigned upload into `comments/{userId}/`). Admins (`comments.moderate`) **ban** (hidden from everyone but the author, who sees it marked banned; masked in `CommentResource`) or **delete** (soft delete incl. replies). `videos.comment_count` and `comments.reply_count` are recomputed from rows, never incremented, and count only publicly visible comments.

## Security
Sanctum tokens with abilities (`customer` vs `admin`; each blocked from the other's API) · admin token in httpOnly SameSite=Strict cookie + `X-Requested-With` CSRF defence + CORS locked to `ADMIN_URL` · role-based permissions (`admin.can:*`) · rate limits (api, auth, otp, admin-login, writes) · FormRequest validation everywhere · Eloquent parameter binding (no raw SQL with input) · upload type/size/dimension validation · audit log for every admin write · no stack traces in API errors · morph map (no class names in DB) · account deletion endpoint (store requirement).

## Mobile (`dao-frontend/src`)
`app/` (Expo Router routes, thin) → `features/<name>/{api.ts, hooks/use*Screen.ts, screens/*Screen.tsx, components}` → `shared/{theme, i18n, api, store, components, services, hooks, utils}`. Server state = TanStack Query (selected queries persisted to AsyncStorage for offline); client state = Zustand (auth, prefs, toasts, optimistic saves); token in SecureStore. Analytics via `AnalyticsService` abstraction. Push via Expo.

## Admin (`dao-admin/src`)
`pages/` + config-driven `ResourcePage` for simple CRUD, `components/ui` (DAO* components), `auth/AuthProvider` (permissions), `lib/api` (cookie auth, error normalization).
