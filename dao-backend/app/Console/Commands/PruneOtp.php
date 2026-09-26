<?php

namespace App\Console\Commands;

use App\Models\OtpChallenge;
use Illuminate\Console\Command;

class PruneOtp extends Command
{
    protected $signature = 'dao:otp:prune';

    protected $description = 'Delete OTP challenges older than 24 hours';

    public function handle(): int
    {
        $n = OtpChallenge::query()->where('created_at', '<', now()->subDay())->delete();
        $this->info("Pruned {$n} OTP challenge(s).");

        return self::SUCCESS;
    }
}
