# dao-frontend — DAO mobile app (Expo SDK 54, Expo Router)

```bash
npm install
cp .env.example .env        # EXPO_PUBLIC_API_URL=http://<LAN-IP>:8000
npx expo start
npm run lint && npm run ts:check && npm test && npm run i18n:check
```
Google/LINE sign-in and push notifications need a development build (`npx eas-cli build --profile development`).
Structure: `src/app` (routes) → `src/features/*` (screens, coordinator hooks, API hooks) → `src/shared/*` (theme, i18n, components, stores).
