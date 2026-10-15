<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Admin-managed categories for the video feed (the tabs along the top of the reels screen).
 * `videos.category` keeps storing the slug, so existing videos are untouched.
 */
return new class extends Migration
{
    private const DEFAULTS = [
        'daily_life' => ['Daily Life', 'ชีวิตประจำวัน', 'နေ့စဉ်ဘဝ'],
        'fashion' => ['Fashion', 'แฟชั่น', 'ဖက်ရှင်'],
        'travel' => ['Travel', 'ท่องเที่ยว', 'ခရီးသွား'],
        'beauty' => ['Beauty', 'บิวตี้', 'အလှအပ'],
        'food' => ['Food', 'อาหาร', 'အစားအစာ'],
        'behind_the_scenes' => ['Behind the Scenes', 'เบื้องหลัง', 'နောက်ကွယ်'],
        'daos_life' => ["Dao's Life", 'ชีวิตของดาว', 'Dao ၏ ဘဝ'],
    ];

    public function up(): void
    {
        Schema::create('video_categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 40)->unique();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('video_category_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('video_category_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('name');
            $table->unique(['video_category_id', 'locale']);
        });

        // Keep the categories videos already use, in the order the app used to show them.
        $slugs = array_keys(self::DEFAULTS);
        foreach (DB::table('videos')->whereNotNull('category')->distinct()->pluck('category') as $used) {
            if (! in_array($used, $slugs, true)) {
                $slugs[] = $used;
            }
        }
        foreach ($slugs as $i => $slug) {
            $id = DB::table('video_categories')->insertGetId(['slug' => $slug, 'sort_order' => $i, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
            $names = self::DEFAULTS[$slug] ?? [ucwords(str_replace('_', ' ', $slug))];
            foreach (array_slice(['en', 'th', 'my'], 0, count($names)) as $n => $locale) {
                DB::table('video_category_translations')->insert(['video_category_id' => $id, 'locale' => $locale, 'name' => $names[$n]]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('video_category_translations');
        Schema::dropIfExists('video_categories');
    }
};
