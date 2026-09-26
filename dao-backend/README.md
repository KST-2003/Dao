# dao-backend — Laravel 12 API

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed          # roles, settings, tiers, categories (+ demo data outside production)
php artisan dao:admin:create you@example.com
php artisan serve && php artisan queue:work
php artisan test                    # Pest (SQLite in-memory by default; CI uses MySQL)
```

Scheduled commands (`routes/console.php`): `dao:points:expire`, `dao:points:reconcile`, `dao:birthday-bonus`, `dao:otp:prune`.
See `/docs` for architecture, database and API reference.
