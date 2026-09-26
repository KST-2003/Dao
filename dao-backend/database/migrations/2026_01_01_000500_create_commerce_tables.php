<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Coupons, carts, orders, payments, shipments, reward redemptions. Money in minor units. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('type', 20);
            $table->unsignedBigInteger('value')->default(0)->comment('Percent (0-100) or minor units');
            $table->unsignedBigInteger('max_discount')->nullable();
            $table->unsignedBigInteger('min_subtotal')->default(0);
            $table->string('scope', 20)->default('all');
            $table->foreignId('min_tier_id')->nullable()->constrained('membership_tiers')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete()->comment('Personal coupon');
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('usage_limit_per_user')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        Schema::create('coupon_product', function (Blueprint $table) {
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['coupon_id', 'product_id']);
        });

        Schema::create('category_coupon', function (Blueprint $table) {
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->primary(['coupon_id', 'category_id']);
        });

        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('coupon_code', 50)->nullable();
            $table->unsignedInteger('points_to_redeem')->default(0);
            $table->timestamps();
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->boolean('saved_for_later')->default(false);
            $table->unsignedBigInteger('unit_price_at_add')->comment('Detect price changes; never silently re-price');
            $table->timestamps();
            $table->unique(['cart_id', 'product_variant_id']);
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 30)->unique();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('status', 30);
            $table->string('payment_status', 30);
            $table->string('payment_method', 30);
            $table->string('delivery_method', 30);
            $table->char('currency', 3);
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('member_discount')->default(0);
            $table->unsignedBigInteger('coupon_discount')->default(0);
            $table->unsignedBigInteger('points_discount')->default(0);
            $table->unsignedBigInteger('shipping_fee')->default(0);
            $table->unsignedBigInteger('grand_total');
            $table->unsignedInteger('points_redeemed')->default(0);
            $table->unsignedInteger('points_earned')->default(0);
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->string('coupon_code', 50)->nullable();
            $table->foreignId('membership_tier_id')->nullable()->constrained()->nullOnDelete();
            $table->json('shipping_address');
            $table->string('notes', 500)->nullable();
            $table->string('idempotency_key', 64)->nullable();
            $table->timestamp('placed_at');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('spend_recorded_at')->nullable()->comment('Tier spend counted once');
            $table->timestamps();
            $table->unique(['user_id', 'idempotency_key']);
            $table->index(['user_id', 'placed_at']);
            $table->index(['status', 'placed_at']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('variant_label')->nullable();
            $table->string('sku');
            $table->string('image_url')->nullable();
            $table->unsignedBigInteger('unit_price')->comment('Price charged per unit after member pricing');
            $table->unsignedBigInteger('original_unit_price');
            $table->unsignedInteger('quantity');
            $table->unsignedBigInteger('line_total');
            $table->timestamps();
        });

        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30);
            $table->string('note', 500)->nullable();
            $table->nullableMorphs('actor');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 30);
            $table->string('provider_reference')->nullable()->index();
            $table->unsignedBigInteger('amount');
            $table->char('currency', 3);
            $table->string('status', 30);
            $table->json('meta')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('carrier', 50)->nullable();
            $table->string('tracking_number', 100)->nullable();
            $table->string('tracking_url')->nullable();
            $table->string('status', 30)->default('pending');
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });

        Schema::create('coupon_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('discount_amount');
            $table->timestamp('released_at')->nullable()->comment('Set when the order is cancelled');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['coupon_id', 'user_id']);
        });

        Schema::create('reward_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reward_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('loyalty_transaction_id')->constrained()->restrictOnDelete();
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 20)->default('issued');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['reward_redemptions', 'coupon_redemptions', 'shipments', 'payments', 'order_status_histories', 'order_items', 'orders', 'cart_items', 'carts', 'category_coupon', 'coupon_product', 'coupons'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
