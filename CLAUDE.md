# DAO — engineering rules

Monorepo: `dao-backend` (Laravel 12 API), `dao-frontend` (Expo mobile), `dao-admin` (React/Vite admin).
Read `docs/architecture.md` before changing structure.

## Backend (Laravel)
1. Write order for a feature: **Enum → FormRequest → DTO → Service → Controller → Resource → Event → Listener → Migration → Test**.
2. Controllers are thin: validate (FormRequest) → call one service → return a Resource. No business logic in controllers or models.
3. Business-rule failures throw `App\Exceptions\DomainException::of('CODE', status)`. Every API error is `{ message, code, errors? }`. Add the code to `lang/{en,th,my}/errors.php`.
4. Money is **integer minor units** (satang). Never floats.
5. Loyalty: never write `loyalty_accounts.balance` directly — only through `LoyaltyService::credit/debit`. Ledger rows are never updated/deleted (except `remaining`). Automatic awards need an idempotency key.
6. Points are awarded only on `OrderPaid` (backend-confirmed payment). Never from client input.
7. Inventory changes go through `InventoryService` (movement rows). Stock lives on variants.
8. Tier names are data. Never branch on a tier code in code.
9. Every admin write calls `$this->audit(...)`. Manual point adjustments require a reason.
10. Do not fake integrations: an unconfigured provider throws `*_NOT_CONFIGURED` (503) or is hidden.
11. Translatable content uses `*_translations` tables + `HasTranslations`; EN is the controlled fallback.
12. Keep `dao-frontend/src/types/models.ts` + `enums.ts` in sync with Resources/Enums.

## Mobile (Expo)
1. Routes live in `src/app/` and only re-export screens from `src/features/<feature>/screens`.
2. `*Screen.tsx` renders only — no `useState/useEffect/useRef` (ESLint enforced). Logic lives in `use*Screen.ts` (≤100 lines, enforced).
3. No hex colors outside `src/shared/theme` (ESLint enforced). Use `useTheme()`, `makeStyles()`, or `media` tokens.
4. No user-facing string literals. Add keys to `src/shared/i18n/locales/{en,th,my}.ts` (TypeScript enforces key parity; `npm test` checks placeholders).
5. The app never computes totals — it displays the server `quote`.
6. After adding a native dependency: `rm -rf android/build android/app/build` before the next Android build.
7. Run `npm run lint && npm run ts:check && npm test` before pushing.

## Admin
1. Token is in an httpOnly cookie; never store tokens in JS. Always send `X-Requested-With`.
2. UI permission guards mirror the API; the API is the enforcement.
3. `npm run build && npm test` before pushing.
