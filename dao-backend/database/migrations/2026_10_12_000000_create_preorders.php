<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pre-orders + per-product quantity limits.
 * A pre-order is reviewed by staff first; payment happens later through a linked `orders` row
 * (created on "waiting_payment") so gateways, points and tier spend reuse the normal paid-order path.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Normal orders: optional per-order limits (null = no limit).
            $table->unsignedInteger('min_order_qty')->nullable()->after('weight_grams');
            $table->unsignedInteger('max_order_qty')->nullable()->after('min_order_qty');
            // Pre-orders: per-preorder limits + optional total capacity across all customers.
            $table->boolean('preorder_enabled')->default(false)->after('max_order_qty');
            $table->unsignedInteger('preorder_min_qty')->nullable()->after('preorder_enabled');
            $table->unsignedInteger('preorder_max_qty')->nullable()->after('preorder_min_qty');
            $table->unsignedInteger('preorder_capacity')->nullable()->after('preorder_max_qty');
        });

        Schema::create('preorders', function (Blueprint $table) {
            $table->id();
            $table->string('preorder_number', 30)->unique();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('status', 30);
            $table->string('destination', 20);
            $table->char('currency', 3);
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('member_discount')->default(0);
            $table->unsignedBigInteger('shipping_fee')->default(0);
            $table->unsignedBigInteger('grand_total');
            $table->foreignId('membership_tier_id')->nullable()->constrained()->nullOnDelete();
            $table->json('shipping_address');
            $table->string('notes', 500)->nullable();
            $table->string('reject_reason', 500)->nullable();
            $table->string('carrier', 50)->nullable();
            $table->string('tracking_number', 100)->nullable();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete()->comment('Payable order, created on waiting_payment');
            $table->string('idempotency_key', 64)->nullable();
            $table->timestamp('submitted_at');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'idempotency_key']);
            $table->index(['user_id', 'submitted_at']);
            $table->index(['status', 'submitted_at']);
        });

        Schema::create('preorder_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('preorder_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('variant_label')->nullable();
            $table->string('sku');
            $table->string('image_url')->nullable();
            $table->unsignedBigInteger('unit_price');
            $table->unsignedBigInteger('original_unit_price');
            $table->unsignedInteger('quantity');
            $table->unsignedBigInteger('line_total');
            $table->timestamps();
            $table->index('product_id');
        });

        Schema::create('preorder_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('preorder_id')->constrained()->cascadeOnDelete();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30);
            $table->string('note', 500)->nullable();
            $table->nullableMorphs('actor');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('preorder_id')->nullable()->index()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $t) => $t->dropColumn('preorder_id'));
        foreach (['preorder_status_histories', 'preorder_items', 'preorders'] as $t) {
            Schema::dropIfExists($t);
        }
        Schema::table('products', fn (Blueprint $t) => $t->dropColumn([
            'min_order_qty', 'max_order_qty', 'preorder_enabled', 'preorder_min_qty', 'preorder_max_qty', 'preorder_capacity',
        ]));
    }
};
