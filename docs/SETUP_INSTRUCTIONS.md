# Dao – Fashion & Lifestyle — Setup Instructions

## Note to the Claude session reading this

This file is the **infrastructure/setup** half of the brief. The user will give you a
second document with the **app flow** (screens, features, business rules) — that is the
product half; this file does not define it.

How to use both:

1. Read this file fully, then the app-flow document. If they conflict on anything
   (names, features, platforms), ask the user instead of guessing.
2. **Part 0 has open decisions** (domain, bundle ID, droplet region/size, Expo owner).
   Get the user's answers before running any command that uses them.
3. The reference project is on this Mac at `/Applications/moi-order` (`$MOI` below). Read
   its `CLAUDE.md` first — Dao follows the same architecture rules (layer order, SOLID,
   security, MySQL, RN screen/coordinator-hook/styles-file rules). Copy Moi's *generic
   infrastructure* only, never its business code or its production identifiers
   (Google client IDs, EAS project ID, LINE URLs, domains).
4. Safe to run yourself: Parts 1–4 (local scaffolding). **Ask the user first** before
   anything with cost, credentials or outward effect: creating the droplet or DNS
   (Part 5), GitHub secrets / pushing to `main` (Part 6), `eas build` / `eas submit` /
   `eas update` (Part 7), Vercel deploys (Part 8).
5. Do one part at a time and run its **Verify** step before moving on.
6. After setup, build the app-flow features as new domain modules using the write order
   `Enum → FormRequest → DTO → Service → Controller → Resource → Event → Listener →
   Migration → Test`, keeping `dao-frontend/src/types/models.ts` and `enums.ts` in sync
   with every Laravel Resource/Enum.

---

Step-by-step commands to create a second app with the **same architecture and
setup as Moi Order**: Laravel 12 API on a DigitalOcean droplet, an Expo
(React Native) mobile app, and later an admin dashboard.

Everything here was derived from the real Moi Order repo (`/Applications/moi-order`):

| Layer | Moi Order (reference) | Dao |
|---|---|---|
| Backend | Laravel 12, PHP 8.3, MySQL 8, Redis, Sanctum | same |
| Mobile | Expo SDK ~54, RN 0.81, React 19, TS ~5.9, TanStack Query, Zustand, Axios | same |
| Admin | React + Vite + MUI, deployed on Vercel | same (Part 8) |
| Hosting | DigitalOcean droplet: Nginx + PHP-FPM + MySQL + Redis + Supervisor | same |
| Deploy | GitHub Actions → SSH → `git reset --hard` + composer + migrate | same |
| Mobile release | EAS Build + EAS Update, `runtimeVersion: appVersion`, channel `production` | same |

> **Nothing in this file has been executed yet.** Each part ends with a **Verify** step.
> Do the parts in order. Stop at the first failing Verify.

---

## Part 0 — Decisions to make first

Fill these in and keep them handy. Every command below uses them.

| Item | Suggested value | Your value |
|---|---|---|
| Display name | `Dao - Fashion & Lifestyle` | |
| Short name (home screen) | `Dao` (the long name truncates under the icon) | |
| Slug / repo name | `dao` | |
| Domain | `YOURDOMAIN.com` (API at `api.YOURDOMAIN.com`) | |
| iOS bundle ID / Android package | `com.daoapp.customer` (**check it is free** in App Store Connect / Play Console) | |
| Deep-link scheme | `dao` | |
| Expo account that owns the app | `simonzarni` (Moi's owner) or your own | |
| Droplet region | `sgp1` (Singapore) — pick nearest to your users | |
| Droplet size | `s-2vcpu-4gb` (~$24/mo) to start; resize later | |

Accounts you need (a new app needs its **own** of each, do not reuse Moi's identifiers):
- GitHub repo (new, private)
- DigitalOcean account (can be the same one as Moi)
- Expo / EAS project (new)
- Apple Developer: new App ID + App Store Connect app record
- Google Play Console: new app
- Domain registrar / DNS access
- Later: Cloudflare R2 (or S3) bucket, Resend (email), Stripe (payments), Pusher (chat), Firebase (analytics/crashlytics)

---

## Part 1 — Local machine prerequisites (macOS)

```bash
# Homebrew packages (skip what you already have)
brew install php@8.3 composer node@22 mysql@8.0 redis gh doctl
brew link php@8.3 --force --overwrite

# Start services
brew services start mysql@8.0
brew services start redis

# EAS CLI (Moi uses eas-cli >= 16)
npm install -g eas-cli

# Log in to everything you will use
gh auth login
eas login
doctl auth init          # paste a DigitalOcean API token (Control Panel → API → Generate)
```

**Verify**

```bash
php -v            # 8.3.x
composer -V
node -v           # 22.x (LTS)
mysql --version   # 8.0.x
redis-cli ping    # PONG
gh auth status
eas whoami
doctl account get
```

---

## Part 2 — Create the monorepo + GitHub repo

Same layout as Moi Order: one repo, one folder per app, `develop` + `main` branches.

```bash
export ROOT=/Applications/dao
export MOI=/Applications/moi-order
cd $ROOT

git init -b main
mkdir -p .github/workflows
```

Create the root `.gitignore` (adapted from Moi's):

```bash
sed -e 's/moi-order-/dao-/g' $MOI/.gitignore > .gitignore
# Remove Moi-only lines (system-manual, apkpure, business proposal, merchant app)
sed -i '' -e '/system-manual/d' -e '/apkpure/d' -e '/BUSINESS_PROPOSAL/d' -e '/dao-merchant/d' .gitignore
grep -n "^\.env" .gitignore || printf '\n.env\n.env.*\n!.env.example\n' >> .gitignore
```

Create the GitHub repo and both branches:

```bash
git add -A && git commit -m "chore: initial commit"
gh repo create dao --private --source=. --remote=origin --push
git checkout -b develop && git push -u origin develop
```

**Verify:** `gh repo view --web` opens the new private repo with `main` and `develop`.

---

## Part 3 — Backend (Laravel 12)

### 3.1 Create the project

```bash
cd $ROOT
composer create-project laravel/laravel:^12.0 dao-backend
cd dao-backend

# Sanctum + routes/api.php (Laravel 12's skeleton has no API routes by default)
php artisan install:api

# Core packages (same as Moi Order's baseline)
composer require predis/predis league/flysystem-aws-s3-v3 resend/resend-laravel

# Add these only when the feature is needed (all are in Moi Order):
#   composer require stripe/stripe-php            # card payments
#   composer require pusher/pusher-php-server     # realtime / chat
#   composer require maatwebsite/excel            # admin exports/imports
#   composer require minishlink/web-push          # web push (PWA)

# Test + style tooling (Moi uses Pest + Pint)
composer require --dev pestphp/pest pestphp/pest-plugin-laravel laravel/pint -W
./vendor/bin/pest --init
```

### 3.2 Copy Moi's generic infrastructure (not its business code)

These files are domain-agnostic and encode the architecture rules from `CLAUDE.md`
(DomainException, file storage behind an interface, UUID trait):

```bash
mkdir -p app/Contracts app/Exceptions app/Traits app/Services

cp $MOI/moi-order-backend/app/Exceptions/DomainException.php          app/Exceptions/
cp $MOI/moi-order-backend/app/Contracts/FileStorageInterface.php      app/Contracts/
cp $MOI/moi-order-backend/app/Services/FileStorageService.php         app/Services/
cp $MOI/moi-order-backend/app/Traits/HasUuid.php                      app/Traits/
```

Then two manual edits (open both files side by side):

1. **`bootstrap/app.php`** — from Moi's file, copy everything from the
   `->withExceptions(function (Exceptions $exceptions): void {` line (line 69) to the end
   into Dao's file, plus its `use` lines at the top. That block maps
   `DomainException → 409`, `ModelNotFoundException → 404`, uncaught → 500 with the
   `{message, code, errors?}` shape and no leaked stack traces. Also keep `health: '/up'`
   and `$middleware->trustProxies(at: '*')`.
   **Do not copy** Moi's `AdminTokenFromCookie`, `PreventRequestsDuringMaintenance`
   or alias entries — those depend on Moi's admin stack.
2. **`app/Providers/AppServiceProvider.php`** — copy the `FileStorageInterface`
   binding from Moi (`$this->app->bind(FileStorageInterface::class, …)`, ~lines 86–98)
   into `register()`, and add the imports (`FileStorageInterface`, `FileStorageService`,
   `Illuminate\Support\Facades\Storage`).

Add the public health route Moi's deploy checks rely on to `routes/api.php`:

```php
// Health check — intentionally public, no throttle
Route::get('/health', static fn () => response()->json([
    'status' => 'ok',
    'time'   => now()->toIso8601String(),
]));
```

Add the R2/S3 public-URL key that `AppServiceProvider` reads, in `config/filesystems.php`
(top level, next to `'disks'`):

```php
'r2_public_url' => env('R2_PUBLIC_URL', ''),
```

### 3.3 Local database + `.env`

```bash
mysql -uroot -e "
  CREATE DATABASE dao            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE DATABASE dao_testing    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Edit `.env` (created by `composer create-project`):

```dotenv
APP_NAME="Dao"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
BCRYPT_ROUNDS=12

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dao
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=redis
CACHE_STORE=redis
SESSION_DRIVER=redis
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

FILESYSTEM_DISK=local
```

Point tests at the testing DB — in `phpunit.xml`, inside `<php>`:

```xml
<env name="DB_CONNECTION" value="mysql"/>
<env name="DB_DATABASE" value="dao_testing"/>
```

> If your local MySQL root has a password, put it in `.env` **and** add
> `<env name="DB_PASSWORD" value="..."/>` locally only (never commit real passwords).

Create `.env.example` for the team/CI (same keys, no secrets):

```bash
cp .env .env.example
sed -i '' -E 's/^(APP_KEY=).*/\1/; s/^(DB_PASSWORD=).*/\1/' .env.example
```

### 3.4 Run it

```bash
php artisan key:generate      # only if APP_KEY is empty
php artisan migrate
php artisan serve
```

**Verify** (in another terminal):

```bash
curl -s http://localhost:8000/api/health        # {"status":"ok","time":"…"}
php artisan test                                # example tests pass
./vendor/bin/pint --test                        # style check
```

Commit:

```bash
cd $ROOT && git add -A && git commit -m "feat(backend): scaffold Laravel 12 API" && git push
```

---

## Part 4 — Mobile app (Expo SDK 54)

### 4.1 Create the project

```bash
cd $ROOT
npx create-expo-app@latest dao-frontend --template blank-typescript@sdk-54
cd dao-frontend
```

**Check the SDK before going further:** `grep '"expo"' package.json` must show `~54.x`.
If it shows a newer SDK, the `@sdk-54` template tag did not apply — delete the folder and
create the project from the latest template, then run
`npx expo install expo@~54.0.36 --fix` so it matches Moi's SDK.

### 4.2 Install the same core dependencies as Moi

```bash
npx expo install \
  @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context react-native-gesture-handler \
  react-native-reanimated react-native-worklets react-native-keyboard-controller \
  @tanstack/react-query zustand axios \
  expo-secure-store expo-updates expo-constants expo-font expo-image expo-linear-gradient \
  expo-splash-screen expo-status-bar expo-dev-client expo-build-properties \
  expo-notifications expo-device expo-application expo-crypto \
  @expo/vector-icons react-native-svg @react-native-async-storage/async-storage \
  babel-plugin-module-resolver

# Add later, per feature (all are in Moi Order):
#   expo-image-picker expo-image-manipulator expo-location expo-sharing
#   @gorhom/bottom-sheet pusher-js
#   @react-native-firebase/app analytics crashlytics   (needs GoogleService-Info.plist / google-services.json)
#   @react-native-google-signin/google-signin expo-apple-authentication
```

Copy Moi's dev tooling and Jest setup (versions stay identical):

```bash
node -e '
const fs = require("fs");
const moi = require(process.env.MOI + "/moi-order-frontend/package.json");
const pkg = require("./package.json");
const keep = ["@eslint/js","@testing-library/react-native","@types/jest","@types/react",
  "babel-plugin-transform-remove-console","eslint","eslint-plugin-react-hooks",
  "eslint-plugin-security","globals","jest","jest-expo","react-test-renderer",
  "typescript","typescript-eslint"];
pkg.devDependencies = { ...pkg.devDependencies };
for (const k of keep) pkg.devDependencies[k] = moi.devDependencies[k];
pkg.name = "dao-frontend";
pkg.main = "index.ts";
pkg.scripts = { ...pkg.scripts,
  "ts:check": "tsc --noEmit", "lint": "eslint .", "test": "jest", "test:watch": "jest --watch" };
pkg.jest = moi.jest;
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
'
npm install
```

### 4.3 Copy config + the architecture-enforcing lint rules

```bash
cp $MOI/moi-order-frontend/tsconfig.json         .
cp $MOI/moi-order-frontend/babel.config.js        .
cp $MOI/moi-order-frontend/eslint.config.mjs      .
cp $MOI/moi-order-frontend/eas.json               .
cp $MOI/moi-order-frontend/.gitignore             .
```

`eslint.config.mjs` is the important one: it **fails lint** if a `*Screen.tsx` uses
`useState/useEffect/...` directly or a `use*Screen.ts` coordinator exceeds 100 lines — the
same rules Moi enforces.

Remove Moi-only pieces from what you copied:

- `tsconfig.json`: delete the `"expo-file-system/legacy"` entry under `paths` (keep `"@/*"`).
- `babel.config.js`: keep as is (the `@` alias, reanimated plugin, console stripping in prod).
- `eas.json`: keep as is (profiles `development`, `preview`, `production`, `production-apk`
  and their channels).

`jest.setup.ts` — write a minimal one (Moi's mocks native modules Dao doesn't have yet):

```bash
cat > jest.setup.ts <<'EOF'
// Add native-module mocks here as Dao adopts native dependencies.
EOF
```

### 4.4 Folder structure (from CLAUDE.md)

```bash
mkdir -p src/features src/types \
  src/shared/{api,components,constants,hooks,i18n,navigation,store,theme,utils}
touch src/types/models.ts src/types/enums.ts src/types/navigation.ts
```

Copy the **generic** shared pieces (review each; they must not mention Moi):

```bash
S=$MOI/moi-order-frontend/src/shared
cp $S/utils/formatCurrency.ts $S/utils/formatDate.ts $S/utils/validation.ts src/shared/utils/
cp $S/constants/queryKeys.ts $S/constants/errorCodes.ts $S/constants/messages.ts src/shared/constants/
cp $S/theme/spacing.ts $S/theme/radius.ts $S/theme/shadows.ts src/shared/theme/
cp -R $S/components/ErrorBoundary $S/components/ErrorBanner $S/components/FormField \
      $S/components/SkeletonBox $S/components/AsyncStateSection src/shared/components/
```

> **Do NOT copy `src/shared/constants/config.ts` as is.** It contains Moi's
> **production identifiers** (LINE OA URL, Google client IDs, the EAS project ID
> `299e73b6-…`). Write Dao's own (see 4.6). Also review `queryKeys.ts` / `errorCodes.ts` /
> `messages.ts` and delete Moi domains (food, tickets, restaurants…). Design Dao's own
> `colours.ts`, `typography.ts`, `fonts.ts` — do not reuse Moi's dark-editorial palette.

`ErrorBoundary` imports `@/shared/utils/crashlytics`. Until Firebase is added, create a stub:

```bash
cat > src/shared/utils/crashlytics.ts <<'EOF'
// No-op until Firebase Crashlytics is wired up for Dao.
export async function recordError(_error: Error, _context: string): Promise<void> {}
export async function logBreadcrumb(_message: string): Promise<void> {}
EOF
```

### 4.5 `app.config.js` (minimal, mirrors Moi's OTA/channel logic)

Replace the generated `app.json` with `app.config.js`. Fill `EAS_OWNER` and the project ID after 4.6.

```bash
rm -f app.json
cat > app.config.js <<'EOF'
// EAS Build injects the "expo-channel-name" header from eas.json's per-profile
// `channel`, but a raw local `expo prebuild` + gradle build skips that step and
// the binary can never receive OTA updates. Declaring it here bakes it in for
// every build method (same fix as Moi Order 2.1.1). Defaults to "production".
const UPDATES_CHANNEL_BY_PROFILE = new Map([
  ['production', 'production'],
  ['production-apk', 'production'],
  ['preview', 'preview'],
  ['emulator', 'preview'],
]);
const updatesChannel =
  UPDATES_CHANNEL_BY_PROFILE.get(process.env.EAS_BUILD_PROFILE ?? '') ?? 'production';

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'Dao',
    slug: 'dao-frontend',
    owner: 'EAS_OWNER',
    scheme: 'dao',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    // OTA updates only reach binaries whose app version matches this.
    runtimeVersion: { policy: 'appVersion' },
    updates: {
      enabled: true,
      checkOnLaunch: 'ALWAYS',
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/EAS_PROJECT_ID',
      requestHeaders: { 'expo-channel-name': updatesChannel },
    },
    assetBundlePatterns: ['assets/**/*'],
    ios: {
      bundleIdentifier: 'com.daoapp.customer',
      buildNumber: '1',
      supportsTablet: false,
    },
    android: {
      package: 'com.daoapp.customer',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
    },
    plugins: ['expo-secure-store', 'expo-updates', 'expo-font'],
  },
};
EOF
```

> `checkOnLaunch` is `'ALWAYS'` here. Moi's is `'NEVER'` (its devices only
> update through explicit app-code checks). `'ALWAYS'` is the safer default for a new app —
> otherwise OTA hotfixes will not arrive by themselves.

### 4.6 Register with EAS + env + config

```bash
eas init            # creates the EAS project; prints its project ID
```

Put the printed ID into `app.config.js` (replace `EAS_PROJECT_ID` in `updates.url`, and add):

```js
extra: { eas: { projectId: 'THE-ID-FROM-EAS-INIT' } },
```

Replace `EAS_OWNER` with your Expo account name (`eas whoami`).

```bash
cat > .env.example <<'EOF'
# Copy to .env for local development. Never commit .env.
# For EAS builds set these with: eas env:create
EXPO_PUBLIC_API_URL=
EOF
cp .env.example .env
echo 'EXPO_PUBLIC_API_URL=http://YOUR-LAN-IP:8000' > .env    # phone can't reach "localhost"

cat > src/shared/constants/config.ts <<'EOF'
export const TOKEN_KEY = 'auth_token' as const;
export const LOCALE_KEY = 'app_locale' as const;

// Filled from `eas init` — required by getExpoPushTokenAsync.
export const EXPO_PROJECT_ID = 'THE-ID-FROM-EAS-INIT' as const;
EOF
```

Add a first `src/shared/api/client.ts` following CLAUDE.md's token lifecycle (single Axios
instance, in-memory token ref populated at login, 401 → logout, errors normalised to
`ApiError`). Use `$MOI/moi-order-frontend/src/shared/api/client.ts` as the reference,
but drop its refresh-token, device-token and Pusher parts unless Dao needs them from day one.

### 4.7 Run it

`App.tsx` from the template is enough for a first boot. Then:

```bash
npm run lint && npm run ts:check && npm test
npx expo start --dev-client --scheme dao --host lan --clear
```

(`--dev-client` needs a development build first — see Part 7. For a very first sanity
check you can run `npx expo start --lan` and open it in Expo Go.)

**Verify:** lint, type-check and tests all pass; the app boots and shows the template screen.

Commit:

```bash
cd $ROOT && git add -A && git commit -m "feat(frontend): scaffold Expo SDK 54 app" && git push
```

---

## Part 5 — Droplet (DigitalOcean)

Same stack as Moi's production server: Ubuntu, Nginx, PHP 8.3-FPM, MySQL 8, Redis,
Supervisor. **One difference on purpose:** Moi deploys as `root`; Dao uses a
non-root `deploy` user with a narrow sudo allowance.

### 5.1 Create the droplet (from your Mac)

```bash
# Add your SSH public key to DigitalOcean once (skip if already there)
doctl compute ssh-key import mac-key --public-key-file ~/.ssh/id_ed25519.pub
doctl compute ssh-key list          # note the ID / fingerprint

doctl compute droplet create dao-api \
  --region sgp1 --size s-2vcpu-4gb --image ubuntu-24-04-x64 \
  --ssh-keys <KEY_ID_OR_FINGERPRINT> --enable-monitoring --tag-name dao --wait

doctl compute droplet list          # note the public IPv4  →  DROPLET_IP
```

Optional but recommended: a reserved IP (survives droplet rebuilds) and weekly backups:

```bash
doctl compute reserved-ip create --region sgp1
doctl compute reserved-ip-action assign <RESERVED_IP> <DROPLET_ID>
doctl compute droplet-action enable-backups <DROPLET_ID>
```

### 5.2 DNS

At your DNS provider create an **A record**: `api.YOURDOMAIN.com → DROPLET_IP`.

**Verify:** `dig +short api.YOURDOMAIN.com` returns the IP (can take a few minutes).

### 5.3 Base hardening (SSH in as root once)

```bash
ssh root@DROPLET_IP

apt update && apt upgrade -y
adduser --disabled-password --gecos "" deploy
usermod -aG www-data deploy
mkdir -p /home/deploy/.ssh && cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh && chmod 700 /home/deploy/.ssh

# Firewall
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
```

### 5.4 Install the stack

```bash
apt install -y nginx mysql-server redis-server supervisor git unzip curl \
  certbot python3-certbot-nginx \
  php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl \
  php8.3-zip php8.3-gd php8.3-bcmath php8.3-intl

# Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
```

Let `deploy` restart only what a deploy needs (no full root):

```bash
cat > /etc/sudoers.d/deploy <<'EOF'
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl reload php8.3-fpm, /usr/bin/supervisorctl
EOF
chmod 440 /etc/sudoers.d/deploy && visudo -c
```

### 5.5 MySQL + Redis

```bash
# Generate strong secrets and save them in your password manager
openssl rand -base64 24     # → DB_PASSWORD
openssl rand -base64 24     # → REDIS_PASSWORD

mysql -e "
  CREATE DATABASE dao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'dao_user'@'localhost' IDENTIFIED BY 'PASTE_DB_PASSWORD';
  GRANT ALL PRIVILEGES ON dao.* TO 'dao_user'@'localhost';
  FLUSH PRIVILEGES;"

# Redis: require a password, listen on localhost only
sed -i 's/^# *requirepass .*/requirepass PASTE_REDIS_PASSWORD/' /etc/redis/redis.conf
grep -E '^(bind|requirepass)' /etc/redis/redis.conf     # bind 127.0.0.1 -::1 + requirepass set
systemctl restart redis-server
```

### 5.6 Get the code onto the server (private repo → deploy key)

```bash
su - deploy
ssh-keygen -t ed25519 -f ~/.ssh/dao_github -N "" -C "dao-droplet"
cat ~/.ssh/dao_github.pub          # copy this
```

On your **Mac**, register it read-only on the repo:

```bash
gh repo deploy-key add ~/dao_github.pub --repo <OWNER>/dao --title "dao-droplet"
# (save the pasted public key to ~/dao_github.pub first)
```

Back on the droplet as `deploy`:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/dao_github
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

sudo mkdir -p /var/www/dao && sudo chown deploy:www-data /var/www/dao
git clone git@github.com:<OWNER>/dao.git /var/www/dao
cd /var/www/dao && git checkout main
```

### 5.7 Production `.env` and first deploy

```bash
cd /var/www/dao/dao-backend
cp .env.example .env
nano .env
```

Set at least:

```dotenv
APP_NAME="Dao"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.YOURDOMAIN.com
BCRYPT_ROUNDS=12

DB_HOST=127.0.0.1
DB_DATABASE=dao
DB_USERNAME=dao_user
DB_PASSWORD=PASTE_DB_PASSWORD

QUEUE_CONNECTION=redis
CACHE_STORE=redis
SESSION_DRIVER=redis
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=PASTE_REDIS_PASSWORD
REDIS_PORT=6379

FILESYSTEM_DISK=local     # switch to s3 + R2 vars when the bucket exists
```

```bash
composer install --no-dev --optimize-autoloader --no-interaction
php artisan key:generate
php artisan migrate --force

# storage + cache must be writable by PHP-FPM (www-data)
sudo chgrp -R www-data storage bootstrap/cache
sudo chmod -R ug+rwX storage bootstrap/cache

php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan event:cache
```

### 5.8 Nginx

```bash
sudo tee /etc/nginx/sites-available/dao-api >/dev/null <<'EOF'
server {
    listen 80;
    server_name api.YOURDOMAIN.com;
    root /var/www/dao/dao-backend/public;
    index index.php;

    client_max_body_size 100m;   # same as Moi's upload limit

    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    location ~ /\.(?!well-known).* { deny all; }
}
EOF

sudo ln -s /etc/nginx/sites-available/dao-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# HTTPS (needs the DNS record from 5.2 to be live)
sudo certbot --nginx -d api.YOURDOMAIN.com --redirect -m you@YOURDOMAIN.com --agree-tos -n
```

### 5.9 Queue worker (Supervisor) + scheduler (cron)

```bash
sudo tee /etc/supervisor/conf.d/dao-worker.conf >/dev/null <<'EOF'
[program:dao-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/dao/dao-backend/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/dao-worker.log
stopwaitsecs=3600
EOF

sudo supervisorctl reread && sudo supervisorctl update
sudo supervisorctl status          # dao-worker:dao-worker_00 / _01 RUNNING

# Laravel scheduler, every minute, as the PHP user
echo '* * * * * cd /var/www/dao/dao-backend && php artisan schedule:run >> /dev/null 2>&1' | sudo crontab -u www-data -
```

**Verify**

```bash
curl -s https://api.YOURDOMAIN.com/api/health      # {"status":"ok",…}
php /var/www/dao/dao-backend/artisan event:list     # each listener appears exactly once
```

---

## Part 6 — CI/CD (GitHub Actions → SSH deploy)

Moi deploys with a test job followed by an SSH job. Dao does the same.

### 6.1 A CI SSH key (separate from the GitHub deploy key)

On your **Mac**:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/dao_ci -N "" -C "dao-github-actions"
ssh-copy-id -i ~/.ssh/dao_ci.pub deploy@DROPLET_IP

# Store secrets on the repo (private key is base64-encoded, like Moi's workflow expects)
base64 < ~/.ssh/dao_ci | gh secret set SSH_PRIVATE_KEY --repo <OWNER>/dao
echo -n "DROPLET_IP" | gh secret set DROPLET_HOST --repo <OWNER>/dao
```

### 6.2 Backend workflow

```bash
cat > $ROOT/.github/workflows/deploy-backend.yml <<'EOF'
name: Deploy Backend to Production

on:
  push:
    branches: [main]
    paths:
      - 'dao-backend/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  test:
    name: Run Pest suite
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: dao-backend
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: dao_testing
        ports: ['3306:3306']
        options: >-
          --health-cmd="mysqladmin ping -uroot -proot"
          --health-interval=10s --health-timeout=5s --health-retries=10
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, pdo, pdo_mysql, gd, zip, bcmath, exif, intl
          coverage: none
      - run: composer install --no-interaction --prefer-dist --optimize-autoloader
      - run: cp .env.example .env && php artisan key:generate
      - name: Migrate
        env:
          DB_HOST: 127.0.0.1
          DB_DATABASE: dao_testing
          DB_USERNAME: root
          DB_PASSWORD: root
        run: php artisan migrate:fresh --force
      - name: Test
        env:
          DB_HOST: 127.0.0.1
          DB_DATABASE: dao_testing
          DB_USERNAME: root
          DB_PASSWORD: root
        run: php artisan test

  deploy:
    name: SSH deploy → DigitalOcean
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Setup SSH
        env:
          SSH_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          HOST: ${{ secrets.DROPLET_HOST }}
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_KEY" | base64 -d > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H "$HOST" >> ~/.ssh/known_hosts

      - name: Deploy
        env:
          HOST: ${{ secrets.DROPLET_HOST }}
        run: |
          ssh -i ~/.ssh/deploy_key deploy@"$HOST" bash << 'ENDSSH'
            set -e
            cd /var/www/dao
            git fetch origin && git reset --hard origin/main
            cd dao-backend
            composer install --no-dev --optimize-autoloader --no-interaction
            php artisan migrate --force
            php artisan config:cache
            php artisan route:clear && php artisan route:cache
            php artisan view:cache
            php artisan event:cache
            php artisan queue:restart
            sudo supervisorctl restart "dao-worker:*"
            sudo systemctl reload php8.3-fpm
            echo "Backend deploy complete: $(date)"
          ENDSSH
EOF
```

### 6.3 Mobile check workflow (lint + types + tests after push, like Moi)

```bash
sed -e 's/moi-order-frontend/dao-frontend/g' \
    $MOI/.github/workflows/check-frontend.yml > $ROOT/.github/workflows/check-frontend.yml
```

**Verify**

```bash
cd $ROOT && git add -A && git commit -m "ci: backend deploy + frontend checks" && git push origin develop
git checkout main && git merge develop && git push origin main && git checkout develop
gh run watch            # the deploy job should go green
curl -s https://api.YOURDOMAIN.com/api/health
```

---

## Part 7 — Mobile builds and OTA (EAS)

```bash
cd $ROOT/dao-frontend

# 1. Set the API URL for cloud builds / OTA (never commit it in code)
eas env:create --name EXPO_PUBLIC_API_URL --value https://api.YOURDOMAIN.com \
  --environment production --environment preview --environment development --visibility plaintext

# 2. First development build (needed for --dev-client)
eas build --profile development --platform ios        # needs Apple Developer account
eas build --profile development --platform android

# 3. Production builds
eas build --profile production --platform ios
eas build --profile production --platform android     # AAB for Play Store

# 4. Store submission
eas submit --profile production --platform ios
```

> `eas submit` and the store listings need the accounts from Part 0. `eas.json`'s
> `submit.production` block only exists for Android in Moi; add an `ios` block
> (`ascAppId`, etc.) when you have the App Store Connect record.

**Ship a JS-only fix (OTA)** — only reaches binaries whose `version` equals the
`app.config.js` `version` (runtime policy `appVersion`):

```bash
cd $ROOT/dao-frontend
npx eas update --branch production --platform ios     --message "what changed" --non-interactive
npx eas update --branch production --platform android --message "what changed" --non-interactive
```

**Release-branch convention (same as Moi):** right after each store submission, pin the
exact built commit so hotfix OTAs can branch from what is really shipped:

```bash
eas build:list --platform ios --limit 1        # read the gitCommitHash
git branch release/1.0.0 <that-commit> && git push origin release/1.0.0
```

Rule: after adding **any** dependency with native code, run
`rm -rf android/build android/app/build` before the next Android build
(Moi's CLAUDE.md rule 13 — stale autolinking otherwise crashes at runtime with
"package … doesn't seem to be linked").

---

## Part 8 — Admin dashboard (do this after the API has admin auth)

Moi's admin (React + Vite + MUI) talks to `/api/admin/v1/*`, which relies on Moi's admin
stack (admin users, roles, route permissions). A fresh Laravel has none of that, so the
admin cannot log in yet. Order of work:

1. Build admin auth + a users list endpoint in `dao-backend` (Enum → FormRequest → DTO →
   Service → Controller → Resource → Migration → Test).
2. Then copy the admin shell:

```bash
cd $ROOT
rsync -a --exclude node_modules --exclude dist --exclude .env --exclude .env.local \
  $MOI/moi-order-admin/ dao-admin/
cd dao-admin
sed -i '' 's/moi-order-admin/dao-admin/g' package.json
```

3. In `dao-admin/`, delete Moi domains from `src/sections/`, `src/pages/`,
   `src/routes/sections.tsx` and `src/layouts/nav-config-dashboard.tsx`
   (food, restaurants, tickets/attractions, places, safety, merchants, hospital-categories,
   home-cards…), keeping only auth, overview, users, roles as needed. Run
   `npm run build` after each removal to catch broken imports.
4. Replace hardcoded Moi values: `vercel.json`'s CSP `connect-src`
   (`api.moiorder.com`, the R2 URL, the railway URL), `VITE_VAPID_PUBLIC_KEY`, and the
   API URL env var (`VITE_API_BASE_URL`).
5. Deploy on Vercel:

```bash
npm install && npm run lint && npm run build
npx vercel link              # new Vercel project "dao-admin"
npx vercel env add VITE_API_BASE_URL production   # https://api.YOURDOMAIN.com
npx vercel --prod
```

**Import order rule (from Moi's CLAUDE.md):** `perfectionist/sort-imports`
(line-length, ascending, grouped) fails the Vercel build if violated — run `npm run lint`
before every push.

---

## Part 9 — Project instructions for Claude (CLAUDE.md)

Give Dao the same engineering playbook so every future session follows it:

```bash
cd $ROOT
cp $MOI/CLAUDE.md CLAUDE.md
sed -i '' -e 's/moi-order-/dao-/g' -e 's/Moi Order/Dao/g' -e 's#/moi-order/#/dao/#g' CLAUDE.md
```

Then edit `CLAUDE.md` by hand:

- Project structure: replace the four Moi apps with `dao-backend`, `dao-frontend`,
  `dao-admin` (drop `moi-order-merchant` until you build a seller/merchant app).
- Delete rules **10** (Google Sign-In iOS crash), **11** (Burmese lineHeight — keep only
  if Dao ships Burmese text) and **12** (merchant menu categories). These are Moi-specific.
  Keep rule **13** (native module clean step).
- Keep everything else (SOLID, layering, security, MySQL, testing) unchanged.

---

## Part 10 — Final checklist

- [ ] `php artisan test` green locally and in CI
- [ ] `curl https://api.YOURDOMAIN.com/api/health` returns `ok`
- [ ] `supervisorctl status` shows both `dao-worker` processes RUNNING
- [ ] Push to `main` deploys automatically (GitHub Actions green)
- [ ] `npm run lint && npm run ts:check && npm test` green in `dao-frontend`
- [ ] Development build installs and calls the production API
- [ ] `APP_DEBUG=false` on the droplet; `.env` is not in git
- [ ] Droplet backups enabled; DB dump cron/plan decided
- [ ] `ufw status` shows only OpenSSH + Nginx Full

## What comes next (product work, not setup)

The setup above gives you an empty but production-shaped platform. Fashion & lifestyle
features are new domain modules built with the same write order
(Enum → FormRequest → DTO → Service → Controller → Resource → Event → Listener → Migration → Test):
auth (email OTP / social), products + variants (size/colour/stock), categories & brands,
cart, orders + payments (Stripe), addresses, favourites/wishlist, reviews, and push notifications.

## Known unknowns (verify when you hit them)

- The `@sdk-54` template tag in 4.1 is recalled, not tested — the check under 4.1 catches a miss.
- Moi's repo also contains an unused `Dockerfile`, `railway.toml` and a DRAFT `app.yaml`
  (App Platform). Its live production is the droplet, so those are intentionally not copied.
- Droplet size/region and the deploy-user hardening in 5.3–5.4 are recommendations,
  not something Moi's repo proves; adjust to your traffic and comfort.
