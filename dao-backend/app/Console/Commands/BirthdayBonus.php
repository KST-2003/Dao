<?php

namespace App\Console\Commands;

use App\Enums\LoyaltyTransactionType;
use App\Models\User;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Settings\SettingsService;
use Illuminate\Console\Command;

class BirthdayBonus extends Command
{
    protected $signature = 'dao:birthday-bonus';

    protected $description = 'Award the configured birthday bonus (once per user per year)';

    public function handle(LoyaltyService $loyalty, SettingsService $settings): int
    {
        $bonus = $settings->int('loyalty.birthday_bonus');
        if ($bonus <= 0) {
            return self::SUCCESS;
        }
        $today = now();
        $count = 0;
        User::query()->whereNotNull('date_of_birth')
            ->whereMonth('date_of_birth', $today->month)->whereDay('date_of_birth', $today->day)
            ->chunkById(500, function ($users) use ($loyalty, $bonus, $today, &$count) {
                foreach ($users as $user) {
                    $tx = $loyalty->credit($user, LoyaltyTransactionType::BirthdayBonus, $bonus, null, 'Happy birthday ✦', "birthday_bonus:user:{$user->id}:{$today->year}");
                    $count += $tx ? 1 : 0;
                }
            });
        $this->info("Birthday bonus awarded to {$count} user(s).");

        return self::SUCCESS;
    }
}
