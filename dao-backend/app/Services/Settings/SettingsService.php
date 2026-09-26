<?php

namespace App\Services\Settings;

use App\Models\AdminUser;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * Runtime business settings (point rates, shipping fees, bank details…).
 * DB rows override the defaults in config('dao.default_settings'). Admin-editable.
 */
class SettingsService
{
    private const CACHE_KEY = 'dao.settings.v1';

    /** @var array<string, mixed>|null */
    private ?array $memo = null;

    public function get(string $key, mixed $default = null): mixed
    {
        $all = $this->all();

        return array_key_exists($key, $all) ? $all[$key] : $default;
    }

    public function int(string $key): int
    {
        return (int) $this->get($key, 0);
    }

    /** @return array<string, mixed> */
    public function all(): array
    {
        if ($this->memo !== null) {
            return $this->memo;
        }
        $stored = Cache::rememberForever(self::CACHE_KEY, static fn () => Setting::query()->pluck('value', 'key')->all());

        return $this->memo = array_replace(config('dao.default_settings', []), $stored);
    }

    /** @param  array<string, mixed>  $values */
    public function set(array $values, ?AdminUser $admin = null): void
    {
        $known = array_keys(config('dao.default_settings', []));
        foreach ($values as $key => $value) {
            if (! in_array($key, $known, true)) {
                continue; // only known keys are writable
            }
            Setting::query()->updateOrCreate(['key' => $key], ['value' => $value, 'updated_by' => $admin?->id]);
        }
        $this->flush();
    }

    public function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
        $this->memo = null;
    }
}
