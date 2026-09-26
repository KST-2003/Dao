# dao-admin — DAO dashboard (React + Vite + Tailwind)

```bash
npm install
npm run dev     # http://localhost:5173 — /api is proxied to the Laravel API (VITE_DEV_API_PROXY)
npm run build && npm test
```
Sign in with an admin created via `php artisan dao:admin:create`. Auth uses an httpOnly cookie set by the API.
