<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** When each step happens in the recipe's linked video — drives the step captions and tap-to-seek. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recipe_steps', function (Blueprint $table) {
            $table->unsignedInteger('video_seconds')->nullable()->after('timer_seconds');
        });
    }

    public function down(): void
    {
        Schema::table('recipe_steps', function (Blueprint $table) {
            $table->dropColumn('video_seconds');
        });
    }
};
