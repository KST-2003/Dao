<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Fashion catalog. All money columns are integers in minor units (satang). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('image_url')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('category_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('name');
            $table->text('description')->nullable();
            $table->unique(['category_id', 'locale']);
            $table->index(['locale', 'name']);
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('brand')->nullable();
            $table->string('sku')->nullable()->unique();
            $table->string('barcode')->nullable();
            $table->char('currency', 3)->default('THB');
            $table->unsignedBigInteger('price');
            $table->unsignedBigInteger('sale_price')->nullable();
            $table->unsignedBigInteger('member_price')->nullable();
            $table->unsignedBigInteger('cost')->nullable();
            $table->unsignedInteger('weight_grams')->nullable();
            $table->string('status', 20)->default('draft');
            $table->json('badges')->nullable();
            $table->boolean('is_vip_only')->default(false);
            $table->foreignId('vip_min_tier_id')->nullable()->constrained('membership_tiers')->nullOnDelete();
            $table->string('video_url')->nullable();
            // Future social commerce: link-outs only, no fake integrations.
            $table->string('external_url')->nullable();
            $table->string('social_platform', 30)->nullable();
            $table->string('campaign_code', 50)->nullable();
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedInteger('rating_count')->default(0);
            $table->unsignedInteger('sold_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'published_at']);
            $table->index(['category_id', 'status']);
        });

        Schema::create('product_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('materials')->nullable();
            $table->text('care_instructions')->nullable();
            $table->text('shipping_info')->nullable();
            $table->unique(['product_id', 'locale']);
            $table->index(['locale', 'name']);
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('url');
            $table->string('thumbnail_url')->nullable();
            $table->string('alt')->nullable();
            $table->string('color', 50)->nullable()->comment('Show this image when this color is selected');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['product_id', 'sort_order']);
        });

        // Inventory lives on the variant (size × color), never only on the product.
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('sku')->unique();
            $table->string('size', 30)->nullable();
            $table->string('color', 50)->nullable();
            $table->string('color_hex', 7)->nullable();
            $table->json('attributes')->nullable();
            $table->unsignedBigInteger('price_override')->nullable();
            $table->unsignedBigInteger('sale_price_override')->nullable();
            $table->integer('stock_quantity')->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(3);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['product_id', 'is_active']);
        });

        // Append-only stock ledger; product_variants.stock_quantity is its cached sum.
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity_change');
            $table->integer('stock_after');
            $table->string('reason', 30);
            $table->nullableMorphs('reference');
            $table->foreignId('admin_user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('note', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['product_variant_id', 'created_at']);
        });

        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('hero_image_url')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_vip_only')->default(false);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
            $table->index(['is_published', 'sort_order']);
        });

        Schema::create('collection_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('name');
            $table->string('subtitle')->nullable();
            $table->text('description')->nullable();
            $table->unique(['collection_id', 'locale']);
        });

        Schema::create('collection_product', function (Blueprint $table) {
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->primary(['collection_id', 'product_id']);
        });

        Schema::create('recently_viewed_products', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->timestamp('viewed_at');
            $table->primary(['user_id', 'product_id']);
            $table->index(['user_id', 'viewed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recently_viewed_products');
        Schema::dropIfExists('collection_product');
        Schema::dropIfExists('collection_translations');
        Schema::dropIfExists('collections');
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('product_translations');
        Schema::dropIfExists('products');
        Schema::dropIfExists('category_translations');
        Schema::dropIfExists('categories');
    }
};
