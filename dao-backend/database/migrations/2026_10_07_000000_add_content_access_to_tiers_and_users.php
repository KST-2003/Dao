<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Screenshot/screen-recording blocking and video-download are on by default for nobody.
 * A user gets either through their membership tier (admin-defined, like free_shipping /
 * early_access) or an individual override (admin-granted regardless of tier — e.g. staff,
 * press, partners). Effective access is tier flag OR override — see ContentAccessService.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_tiers', function (Blueprint $table) {
            $table->boolean('allows_screenshots')->default(false)->after('priority_support');
            $table->boolean('allows_video_download')->default(false)->after('allows_screenshots');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('screenshot_override')->default(false)->after('profile_completed');
            $table->boolean('download_override')->default(false)->after('screenshot_override');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['screenshot_override', 'download_override']);
        });

        Schema::table('membership_tiers', function (Blueprint $table) {
            $table->dropColumn(['allows_screenshots', 'allows_video_download']);
        });
    }
};
