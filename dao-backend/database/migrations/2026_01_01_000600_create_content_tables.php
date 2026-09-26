<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** One reusable video/content system (vlog, recipe, fashion, tutorial, short) + recipes + social. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->string('content_type', 20);
            $table->string('category', 40)->nullable()->comment('daily_life, fashion, travel, beauty, food, behind_the_scenes, daos_life');
            $table->string('slug')->unique();
            $table->string('thumbnail_url')->nullable();
            $table->string('video_url')->nullable()->comment('HLS (.m3u8) preferred, MP4 accepted');
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->string('status', 20)->default('draft');
            $table->json('tags')->nullable();
            $table->boolean('is_members_only')->default(false);
            $table->foreignId('author_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->unsignedBigInteger('view_count')->default(0);
            $table->unsignedInteger('like_count')->default(0);
            $table->unsignedInteger('comment_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['content_type', 'status', 'published_at']);
        });

        Schema::create('video_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('title');
            $table->text('description')->nullable();
            $table->unique(['video_id', 'locale']);
            $table->index(['locale', 'title']);
        });

        // "Shop this look"
        Schema::create('product_video', function (Blueprint $table) {
            $table->foreignId('video_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('timestamp_seconds')->nullable();
            $table->primary(['video_id', 'product_id']);
        });

        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_id')->nullable()->constrained()->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('category', 40)->nullable()->comment('curry, homemade, snacks, drinks…');
            $table->string('cover_image_url')->nullable();
            $table->unsignedSmallInteger('prep_minutes')->default(0);
            $table->unsignedSmallInteger('cook_minutes')->default(0);
            $table->unsignedTinyInteger('servings')->default(2);
            $table->string('difficulty', 10)->default('easy');
            $table->unsignedTinyInteger('spice_level')->default(0)->comment('0-3');
            $table->boolean('is_featured')->default(false);
            $table->string('status', 20)->default('draft');
            $table->unsignedInteger('like_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'published_at']);
        });

        Schema::create('recipe_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('tips')->nullable();
            $table->unique(['recipe_id', 'locale']);
            $table->index(['locale', 'title']);
        });

        // Ingredients/steps store localized text as JSON maps {"en": "...", "th": "...", "my": "..."}.
        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->json('name');
            $table->string('quantity', 30)->nullable();
            $table->string('unit', 30)->nullable();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete()->comment('Shop ingredient');
            $table->unsignedInteger('sort_order')->default(0);
        });

        Schema::create('recipe_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('step_number');
            $table->json('instruction');
            $table->string('image_url')->nullable();
            $table->unsignedInteger('timer_seconds')->nullable();
        });

        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('commentable');
            $table->foreignId('parent_id')->nullable()->constrained('comments')->cascadeOnDelete();
            $table->text('body');
            $table->boolean('is_hidden')->default(false);
            $table->timestamps();
        });

        Schema::create('likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('likeable');
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['user_id', 'likeable_type', 'likeable_id']);
        });

        // Unified wishlist: saved products, videos and recipes.
        Schema::create('saved_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('saveable_type', 20);
            $table->unsignedBigInteger('saveable_id');
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['user_id', 'saveable_type', 'saveable_id']);
            $table->index(['user_id', 'saveable_type', 'created_at']);
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_item_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('body')->nullable();
            $table->json('photos')->nullable();
            $table->boolean('is_verified_purchase')->default(false);
            $table->string('status', 20)->default('pending');
            $table->foreignId('moderated_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();
            $table->unsignedInteger('report_count')->default(0);
            $table->timestamps();
            $table->unique(['user_id', 'product_id']);
            $table->index(['product_id', 'status']);
        });

        Schema::create('review_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 255);
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['review_id', 'user_id']);
        });
    }

    public function down(): void
    {
        foreach (['review_reports', 'reviews', 'saved_items', 'likes', 'comments', 'recipe_steps', 'recipe_ingredients', 'recipe_translations', 'recipes', 'product_video', 'video_translations', 'videos'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
