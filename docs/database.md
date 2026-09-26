# Database (MySQL 8, utf8mb4)

All money columns are **unsigned integers in minor units** (satang). Translatable entities use `<entity>_translations(locale, …)` with a unique `(entity_id, locale)`; recipe ingredients/steps use JSON maps `{"en","th","my"}`.

```
users ─┬─< user_auth_providers (provider, provider_user_id) UNIQUE
       ├─< addresses (TH: region/district/subdistrict/postal · MM: region/district/township/city)
       ├─< device_tokens
       ├── carts ─< cart_items >── product_variants
       ├─< orders ─┬─< order_items (snapshot: name, sku, price, image)
       │           ├─< order_status_histories
       │           ├─< payments
       │           ├─< shipments
       │           └─< coupon_redemptions >── coupons ─< coupon_product / category_coupon
       ├── loyalty_accounts (cached balance, lifetime_points)
       ├─< loyalty_transactions (append-only ledger, idempotency_key UNIQUE, FIFO remaining/expires_at)
       ├── user_memberships >── membership_tiers ─< membership_tier_translations
       ├─< membership_histories
       ├─< referrals (referrer/referee, status)
       ├─< reward_redemptions >── rewards ─< reward_translations
       ├─< saved_items (product | video | recipe)
       ├─< reviews ─< review_reports
       ├─< comments / likes (polymorphic)
       ├─< recently_viewed_products
       └─< app_notifications

categories ─< category_translations      collections ─< collection_translations, collection_product
products ─┬─< product_translations       videos ─< video_translations, product_video (shop this look)
          ├─< product_images             recipes ─< recipe_translations, recipe_ingredients, recipe_steps
          └─< product_variants ─< inventory_movements (append-only stock ledger)
banners ─< banner_translations           settings (key → json, admin-editable business rules)
admin_users >── admin_roles (permissions json)     audit_logs (append-only)
otp_challenges · personal_access_tokens · jobs · cache
```

## Notable constraints / indexes
- `user_auth_providers`: unique `(provider, provider_user_id)` and `(user_id, provider)`.
- `orders`: unique `(user_id, idempotency_key)`; indexes `(user_id, placed_at)`, `(status, placed_at)`.
- `loyalty_transactions`: unique `idempotency_key`; indexes `(user_id, created_at)`, `(user_id, remaining, expires_at)`.
- `product_variants.sku` unique; stock on variant; `inventory_movements` explains every change.
- `saved_items`: unique `(user_id, saveable_type, saveable_id)`.
- Soft deletes: users, products, variants, videos, recipes (order history keeps snapshots).

Migrations: `dao-backend/database/migrations`. Seeders: roles, settings, tiers (Member / VIP / DAO STAR — placeholders), fashion categories, and `DemoSeeder` (local only).
