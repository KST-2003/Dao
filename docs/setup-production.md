# Production setup (DAO-specific)

The full step-by-step server/EAS/Vercel guide is `docs/SETUP_INSTRUCTIONS.md` (Parts 5–8). This repo already contains the result of Parts 2–4 and 9, so skip those. Differences to note:

1. **Backend is already scaffolded** — do not run `composer create-project`. Run `composer install`, commit `composer.lock`.
2. **Queue + scheduler are required**: points expiry (02:00), ledger reconcile (03:00), birthday bonus (08:00), OTP pruning, token pruning, and push notifications all rely on `queue:work` (Supervisor) and `schedule:run` (cron). Configs: `deploy/supervisor-dao-worker.conf`, `deploy/nginx-dao-api.conf`.
3. **First admin**: `php artisan dao:admin:create you@yourdomain.com --name="Dao"` (password prompted, min 12 chars). Roles are seeded by `php artisan db:seed --class=AdminRoleSeeder --force`. In production run `php artisan db:seed --force` (DemoSeeder is skipped automatically).
4. **Admin hosting**: host the dashboard on the same site as the API (e.g. `admin.YOURDOMAIN.com` + `api.YOURDOMAIN.com`) so the SameSite=Strict httpOnly cookie is sent. Set backend `ADMIN_URL=https://admin.YOURDOMAIN.com`, `ADMIN_COOKIE_DOMAIN=.YOURDOMAIN.com`; admin `VITE_API_BASE_URL=https://api.YOURDOMAIN.com`; update the CSP `connect-src` in `dao-admin/vercel.json`.
5. **Stripe** (optional): add `PAYMENT_METHODS=cod,bank_transfer,stripe`, keys, and a webhook to `https://api.YOURDOMAIN.com/api/webhooks/stripe`.
6. **Mobile**: set `EAS_PROJECT_ID`, `EAS_OWNER`, `APP_BUNDLE_ID` (env or edit `app.config.js`) and `EXPO_PUBLIC_*` via `npx eas-cli env:create`. SDK is pinned to 54 as requested (SDK 57 is current; upgrade later with `npx expo install expo@^57 --fix`).
7. **CI**: `.github/workflows/deploy-backend.yml` (Pest on MySQL → SSH deploy as `deploy` user), `check-frontend.yml`, `check-admin.yml`. Secrets: `SSH_PRIVATE_KEY` (base64), `DROPLET_HOST`.
