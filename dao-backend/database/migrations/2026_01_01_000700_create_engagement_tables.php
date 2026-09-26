<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Notifications + banners. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30);
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable()->comment('Deep-link payload, e.g. {"route":"/orders/12"}');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('pushed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'read_at', 'created_at']);
        });

        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('placement', 30);
            $table->string('image_url');
            $table->string('link_type', 20)->nullable()->comment('product, collection, category, video, recipe, url');
            $table->string('link_value')->nullable();
            $table->string('theme', 20)->default('botanical')->comment('botanical | midnight');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
            $table->index(['placement', 'is_active', 'sort_order']);
        });

        Schema::create('banner_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('banner_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('eyebrow')->nullable();
            $table->string('title')->nullable();
            $table->string('subtitle')->nullable();
            $table->string('cta_label')->nullable();
            $table->unique(['banner_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banner_translations');
        Schema::dropIfExists('banners');
        Schema::dropIfExists('app_notifications');
    }
};
