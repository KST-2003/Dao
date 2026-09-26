<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

/** Writes default business settings once; never overwrites values an admin changed. */
class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        foreach (config('dao.default_settings') as $key => $value) {
            Setting::query()->firstOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
