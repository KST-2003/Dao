<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MMK support. Products may carry their own MMK prices (null = convert THB at the admin-set rate). Orders and
 * pre-orders record the exchange rate used, so points, tier spend and revenue can always be converted back to THB.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('price_mmk')->nullable()->after('member_price');
            $table->unsignedBigInteger('sale_price_mmk')->nullable()->after('price_mmk');
            $table->unsignedBigInteger('member_price_mmk')->nullable()->after('sale_price_mmk');
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('exchange_rate', 14, 6)->default(1)->after('currency')->comment('Units of the order currency per 1 THB');
        });
        Schema::table('preorders', function (Blueprint $table) {
            $table->decimal('exchange_rate', 14, 6)->default(1)->after('currency');
        });
    }

    public function down(): void
    {
        Schema::table('preorders', fn (Blueprint $t) => $t->dropColumn('exchange_rate'));
        Schema::table('orders', fn (Blueprint $t) => $t->dropColumn('exchange_rate'));
        Schema::table('products', fn (Blueprint $t) => $t->dropColumn(['price_mmk', 'sale_price_mmk', 'member_price_mmk']));
    }
};
