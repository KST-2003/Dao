<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** DAO Points ledger + membership tiers + rewards + referrals. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_memberships', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->foreignId('membership_tier_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('lifetime_spend')->default(0);
            $table->timestamp('achieved_at');
            $table->timestamps();
        });

        Schema::create('membership_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_tier_id')->nullable()->constrained('membership_tiers')->nullOnDelete();
            $table->foreignId('to_tier_id')->constrained('membership_tiers')->restrictOnDelete();
            $table->string('reason', 100);
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'created_at']);
        });

        // Cached balance, reconciled nightly against SUM(loyalty_transactions.points).
        Schema::create('loyalty_accounts', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->integer('balance')->default(0);
            $table->unsignedInteger('lifetime_points')->default(0);
            $table->timestamps();
        });

        // Append-only ledger. Rows are never updated except `remaining` (FIFO lot tracking) and never deleted.
        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30);
            $table->integer('points')->comment('Signed');
            $table->integer('balance_after');
            $table->unsignedInteger('remaining')->default(0)->comment('Unspent points of a credit lot');
            $table->timestamp('expires_at')->nullable();
            $table->nullableMorphs('reference');
            $table->string('description')->nullable();
            $table->foreignId('admin_user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('idempotency_key', 120)->nullable()->unique();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'remaining', 'expires_at']);
            $table->index(['type', 'created_at']);
        });

        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('type', 30);
            $table->unsignedInteger('points_cost');
            $table->unsignedBigInteger('value')->default(0)->comment('Coupon value (minor units or percent)');
            $table->string('value_type', 20)->default('fixed');
            $table->unsignedBigInteger('min_subtotal')->default(0);
            $table->foreignId('min_tier_id')->nullable()->constrained('membership_tiers')->nullOnDelete();
            $table->unsignedInteger('stock')->nullable();
            $table->unsignedInteger('coupon_valid_days')->default(30);
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        Schema::create('reward_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reward_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('name');
            $table->text('description')->nullable();
            $table->unique(['reward_id', 'locale']);
        });

        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('referee_user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('status', 20)->default('pending');
            $table->unsignedBigInteger('qualifying_order_id')->nullable();
            $table->timestamp('rewarded_at')->nullable();
            $table->timestamps();
            $table->index(['referrer_user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
        Schema::dropIfExists('reward_translations');
        Schema::dropIfExists('rewards');
        Schema::dropIfExists('loyalty_transactions');
        Schema::dropIfExists('loyalty_accounts');
        Schema::dropIfExists('membership_histories');
        Schema::dropIfExists('user_memberships');
    }
};
