<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Admins appear as the creator on reels, so they get a profile picture (name already exists). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_users', function (Blueprint $table) {
            $table->string('avatar_url', 500)->nullable()->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('admin_users', fn (Blueprint $table) => $table->dropColumn('avatar_url'));
    }
};
