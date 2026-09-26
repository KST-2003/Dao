# DAO — Fashion & Lifestyle ✦

*A little world created by Dao.* Fashion-first commerce + vlogs + Thai kitchen + DAO Points & membership.

| App | Path | Stack |
|---|---|---|
| Backend API | `dao-backend/` | Laravel 12 · PHP 8.3 · MySQL 8 · Redis · Sanctum |
| Mobile app | `dao-frontend/` | Expo SDK 54 · React Native 0.81 · Expo Router · TanStack Query · Zustand · i18next |
| Admin dashboard | `dao-admin/` | React 19 · Vite · Tailwind CSS v4 · TanStack Query |

Languages: **English · ไทย · မြန်မာ**. Themes: **DAO Botanical** (default) and **DAO Midnight**.

## Quick start (local)

```bash
# 1. API
cd dao-backend
composer install                       # first run resolves dependencies (no lock file shipped)
cp .env.example .env && php artisan key:generate
# create MySQL databases `dao` and `dao_testing` (utf8mb4), then:
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='a-strong-password-123' php artisan migrate --seed
php artisan storage:link
php artisan serve                      # http://localhost:8000/api/health
php artisan queue:work                 # notifications / broadcasts (separate terminal)
php artisan test                       # Pest suite

# 2. Admin
cd ../dao-admin && npm install && npm run dev      # http://localhost:5173 (proxies /api → :8000)

# 3. Mobile
cd ../dao-frontend && npm install
cp .env.example .env                   # set EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8000
npx expo start                         # Expo Go works for UI; Google/LINE sign-in & push need a dev build
```

In local development `SMS_DRIVER=log` writes OTP codes to `dao-backend/storage/logs/laravel.log` (clearly marked *not sent*). This driver refuses to run outside `APP_ENV=local`.

## Documentation

- [docs/architecture.md](docs/architecture.md) — layers, decisions, security
- [docs/database.md](docs/database.md) — ERD / tables
- [docs/api.md](docs/api.md) — endpoints & response shapes
- [docs/design-system.md](docs/design-system.md) — tokens, typography, components
- [docs/roadmap.md](docs/roadmap.md) — phases, status, known limitations
- [docs/setup-production.md](docs/setup-production.md) — droplet, CI/CD, EAS, Vercel
- [CLAUDE.md](CLAUDE.md) — engineering rules for future AI/dev sessions
# Dao
