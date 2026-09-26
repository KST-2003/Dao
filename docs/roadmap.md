# Roadmap & status

| Phase | Scope | Status |
|---|---|---|
| 1 Foundation | monorepo, design system, navigation, i18n EN/TH/MY, auth (Google/LINE/SMS + linking), accounts, API, admin auth/RBAC, DB | ✅ built |
| 2 Fashion shop | home, categories, listing/filters/search, product detail, variants, inventory, wishlist, cart, checkout, payments abstraction, orders | ✅ built |
| 3 Loyalty | points ledger, earning/redemption rules, expiry, reconciliation, tiers, rewards, coupons, referral qualification | ✅ built |
| 4 Content | videos/vlogs, recipes, kitchen, comments, likes, saves | ✅ core built (API + mobile + admin); next: HLS transcoding pipeline, comment moderation UI |
| 5 Advanced commerce | shop-the-look ✅, collections ✅, referral ✅, campaigns ✅; next: recommendations engine, scheduled drops/early access gating, segmented campaigns by behaviour, external commerce APIs (TikTok Shop) | partial |

## Phase report (this delivery)
**Environment variables**: see `dao-backend/.env.example`, `dao-frontend/.env.example`, `dao-admin/.env.example`.

**Configuration required before launch (never faked)**
- SMS: `SMS_DRIVER=twilio` + Twilio credentials (or add a Thai/Myanmar provider class implementing `SmsProviderInterface`). Without it SMS login returns 503.
- Google: OAuth client IDs (iOS/Android/Web) in backend `GOOGLE_CLIENT_IDS` and app `EXPO_PUBLIC_GOOGLE_*`.
- LINE: channel ID in the app, channel ID + secret in the backend.
- Payments: bank details in Admin → Settings (enables bank transfer), and/or Stripe keys + webhook (`/api/webhooks/stripe`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded`). COD works out of the box.
- Push: `eas init` → `EAS_PROJECT_ID`.
- Storage: R2/S3 bucket for production uploads.

## Known limitations (honest list)
- Backend tests were **written but not executed** in the build sandbox (Packagist was blocked, so `vendor/` could not be installed). Run `composer install && php artisan test` first; fix anything the suite reports before deploying. Mobile (tsc, ESLint, Jest, Android bundle export) and admin (tsc, build, Vitest) were verified.
- No `composer.lock` is shipped — the first `composer install` resolves versions; commit the generated lock.
- Myanmar translations were machine-authored — have a native speaker review (`src/shared/i18n/locales/my.ts`, `dao-backend/lang/my`).
- Video: files are stored and streamed as uploaded (MP4 progressive / HLS URLs). A transcoding pipeline (e.g. Cloudflare Stream/Mux) is a future step.
- Search uses indexed `LIKE`; move to Meilisearch/Scout as the catalog grows.
- Saved cards are not stored (Stripe Checkout collects card details per order).
- Size guide is a generic DAO chart; per-product charts can be added as variant attributes.
- Demo images are placeholder photos (picsum.photos) and are local-only (`DemoSeeder`).
