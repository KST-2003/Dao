<?php

namespace App\Console\Commands;

use App\Services\Loyalty\LoyaltyService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ReconcilePoints extends Command
{
    protected $signature = 'dao:points:reconcile';

    protected $description = 'Compare cached point balances with the ledger and repair mismatches';

    public function handle(LoyaltyService $loyalty): int
    {
        $mismatches = $loyalty->reconcile();
        foreach ($mismatches as $m) {
            Log::warning('loyalty.reconcile_mismatch', $m);
            $this->warn("user {$m['user_id']}: cached {$m['cached']} → ledger {$m['ledger']}");
        }
        $this->info(count($mismatches).' mismatch(es) repaired.');

        return self::SUCCESS;
    }
}
