# API

Base: `/api/v1` (customer) · `/api/admin/v1` (admin) · `GET /api/health` · `POST /api/webhooks/stripe`.

**Headers**: `Authorization: Bearer <token>` (customer), `X-Locale: en|th|my` (content + error language).
**Success**: `{ "data": … }`; paginated lists add `meta { current_page, last_page, per_page, total }` and `links`.
**Error**: `{ "message": "localized text", "code": "MACHINE_CODE", "errors"?: {…} }` — 401 `UNAUTHENTICATED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, 409/422 business codes, 422 `VALIDATION_FAILED`, 429 `TOO_MANY_REQUESTS`, 503 `*_NOT_CONFIGURED`.

## Customer API (`/api/v1`)
| Method | Path | Notes |
|---|---|---|
| GET | /config | Which login + payment methods are configured, loyalty & shipping rules |
| POST | /auth/sms/request | `{phone, country}` → `{phone, expires_in, resend_in}` |
| POST | /auth/sms/verify | `{phone, country, code, referral_code?}` → `{token, is_new_user, user}` |
| POST | /auth/google | `{id_token, referral_code?}` |
| POST | /auth/line | `{code, code_verifier, redirect_uri}` or `{id_token}` |
| POST | /auth/logout | |
| GET/PATCH/DELETE | /me | profile · update (multipart avatar via POST) · delete account |
| POST/DELETE | /me/providers/{google\|line\|sms} | link / unlink sign-in methods |
| POST/DELETE | /me/devices | Expo push token |
| GET/POST/PUT/DELETE | /me/addresses[/{id}] | |
| GET | /home | greeting, hero, new arrivals, Dao's picks, featured collection, from Dao, kitchen, membership |
| GET | /search?q= | `{products, collections, videos, recipes}` |
| GET | /categories · /shop · /collections · /collections/{slug} | |
| GET | /products | filters: category, collection, q, sizes[], colors[], on_sale, in_stock, badge, sort, page |
| GET | /products/{id} · /related · /reviews | detail includes `pricing` for the signed-in member |
| POST | /products/{id}/reviews · /reviews/{id}/report | |
| GET | /me/recently-viewed | |
| GET/POST/DELETE | /me/saved/{type}[/{id}] · POST /me/saved | wishlist: product, video, recipe |
| GET | /cart | items, saved_for_later, issues, quote, can_checkout |
| POST/PATCH/DELETE | /cart/items[/{id}] | |
| POST | /cart/items/{id}/save-for-later · /accept-price | |
| PUT | /cart/options | coupon_code, points |
| GET | /checkout/options | payment + delivery methods |
| POST | /checkout/quote | authoritative totals |
| POST | /orders | `{address_id, delivery_method, payment_method, coupon_code?, points_to_redeem?, expected_total, idempotency_key, notes?}` → `{order, payment}` |
| GET | /orders?tab= · /orders/{id} | |
| POST | /orders/{id}/cancel · /orders/{id}/pay | |
| GET | /me/points · /me/membership · /me/coupons · /me/referral · /rewards | |
| POST | /rewards/{id}/redeem | |
| GET | /videos?type=&category= · /videos/{id} · /related · /comments | |
| POST/DELETE | /videos/{id}/like · POST /videos/{id}/comments · POST /videos/{id}/view | |
| GET | /kitchen · /recipes?category= · /recipes/{id} | |
| GET/POST | /notifications · /notifications/{id}/read · /notifications/read-all | |

## Admin API (`/api/admin/v1`, permission in brackets)
auth/login · auth/me · auth/logout · dashboard [dashboard.view] · products (+ publish/unpublish, variants, images, image order) [products.manage] · categories · collections [products.manage] · inventory, inventory/adjust, inventory/{variant}/movements [inventory.manage] · orders (+ status, mark-paid, refund, shipment) [orders.view / orders.manage] · customers [customers.view] · points/ledger, points/adjust, points/campaigns, membership-tiers, rewards [loyalty.manage] · coupons, banners [marketing.manage] · videos, recipes [content.manage] · uploads · reviews (+ moderate) [reviews.moderate] · notifications (+ broadcast) [notifications.send] · settings [settings.manage] · admin-users, admin-roles [admins.manage] · audit-logs [audit.view].
