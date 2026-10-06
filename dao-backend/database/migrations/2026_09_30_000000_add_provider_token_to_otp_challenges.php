<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('otp_challenges', function (Blueprint $table) {
            // Set by providers that verify remotely (ThaiBulkSMS); code_hash is set instead by
            // providers that generate + verify the code locally (log/fake) — see OtpProviderInterface.
            $table->string('provider_token')->nullable()->after('code_hash');
        });

        // MySQL-only raw SQL (doctrine/dbal isn't installed, so Schema::change() isn't available).
        // Tests run on SQLite, which doesn't need this: FakeOtpProvider always sets code_hash, never null.
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE otp_challenges MODIFY code_hash VARCHAR(64) NULL');
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE otp_challenges MODIFY code_hash VARCHAR(64) NOT NULL');
        }

        Schema::table('otp_challenges', function (Blueprint $table) {
            $table->dropColumn('provider_token');
        });
    }
};
