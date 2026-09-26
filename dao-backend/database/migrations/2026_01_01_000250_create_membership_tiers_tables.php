<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Membership tiers are admin-configurable (names, thresholds, benefits). Never hardcoded. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->unsignedInteger('sort_order')->default(0)->comment('Higher = better tier');
            $table->unsignedInteger('min_points')->default(0)->comment('Lifetime points; 0 = criterion unused');
            $table->unsignedBigInteger('min_spend')->default(0)->comment('Lifetime spend (minor units); 0 = criterion unused');
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->decimal('points_multiplier', 4, 2)->default(1);
            $table->boolean('free_shipping')->default(false);
            $table->boolean('early_access')->default(false);
            $table->boolean('priority_support')->default(false);
            $table->string('badge_icon')->nullable();
            $table->string('color', 7)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('membership_tier_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('membership_tier_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('benefits')->nullable()->comment('List of benefit lines');
            $table->unique(['membership_tier_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_tier_translations');
        Schema::dropIfExists('membership_tiers');
    }
};
