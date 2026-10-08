<?php

use App\Enums\ContentType;
use App\Enums\PublishStatus;
use App\Models\Product;
use App\Models\Video;

it('shows linked, published videos on a product and hides unpublished ones', function () {
    $product = Product::factory()->create();

    $review = Video::query()->create([
        'content_type' => ContentType::Vlog, 'slug' => 'review-'.$product->id,
        'status' => PublishStatus::Published, 'published_at' => now()->subHour(),
    ]);
    $review->syncTranslations(['en' => ['title' => "Dao's review"]]);
    $product->videos()->attach($review->id, ['sort_order' => 0]);

    $draft = Video::query()->create([
        'content_type' => ContentType::Vlog, 'slug' => 'draft-'.$product->id,
        'status' => PublishStatus::Draft,
    ]);
    $draft->syncTranslations(['en' => ['title' => 'Not ready yet']]);
    $product->videos()->attach($draft->id, ['sort_order' => 1]);

    $this->getJson("/api/v1/products/{$product->id}")->assertOk()
        ->assertJsonCount(1, 'data.videos')
        ->assertJsonPath('data.videos.0.id', $review->id)
        ->assertJsonPath('data.videos.0.title', "Dao's review");
});

it('shows linked products on a video ("shop this look", the existing direction)', function () {
    $product = Product::factory()->create();
    $video = Video::query()->create([
        'content_type' => ContentType::Vlog, 'slug' => 'vlog-'.$product->id,
        'status' => PublishStatus::Published, 'published_at' => now()->subHour(),
    ]);
    $video->syncTranslations(['en' => ['title' => 'A video']]);
    $video->products()->attach($product->id, ['sort_order' => 0]);

    $this->getJson("/api/v1/videos/{$video->id}")->assertOk()
        ->assertJsonCount(1, 'data.shop_the_look')
        ->assertJsonPath('data.shop_the_look.0.id', $product->id);
});
