<?php

namespace App\Console\Commands;

use App\Services\Loyalty\LoyaltyService;
use Illuminate\Console\Command;

class ExpirePoints extends Command
{
    protected $signature = 'dao:points:expire';

    protected $description = 'Expire DAO Points lots past their expiry date (creates `expired` ledger rows)';

    public function handle(LoyaltyService $loyalty): int
    {
        $this->info('Users affected: '.$loyalty->expireDueLots());

        return self::SUCCESS;
    }
}
