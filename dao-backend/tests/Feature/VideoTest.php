<?php

use App\Enums\ContentType;
use App\Enums\PublishStatus;
use App\Models\AdminUser;
use App\Models\Video;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

function makeVideo(array $tags = [], array $overrides = []): Video
{
    $video = Video::query()->create(array_merge([
        'content_type' => ContentType::Recipe, 'category' => 'food',
        'slug' => 'v-'.Str::random(10), 'tags' => $tags,
        'status' => PublishStatus::Published, 'published_at' => now()->subMinute(),
    ], $overrides));
    $video->syncTranslations(['en' => ['title' => 'Video '.$video->slug]]);

    return $video;
}

it('lowercases, trims and dedupes tags on save', function () {
    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);

    $id = $this->postJson('/api/admin/v1/videos', [
        'content_type' => 'recipe', 'slug' => 'tag-normalize-test',
        'tags' => [' Egg ', 'egg', 'Breakfast'],
        'translations' => ['en' => ['title' => 'Normalize test']],
    ])->assertCreated()->json('data.id');

    expect(Video::query()->findOrFail($id)->tags)->toBe(['egg', 'breakfast']);
});

it('filters the public video list by tags', function () {
    $egg = makeVideo(['egg', 'breakfast']);
    $curry = makeVideo(['curry', 'spicy']);

    $this->getJson('/api/v1/videos?tags[]=egg')->assertOk()
        ->assertJsonPath('data.0.id', $egg->id)->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/videos?tags[]=egg&tags[]=curry')->assertOk()->assertJsonCount(2, 'data');
    expect($this->getJson('/api/v1/videos')->json('data'))->toHaveCount(2); // no filter = everything
});

it('ranks related videos by shared tags before recency', function () {
    $main = makeVideo(['egg', 'breakfast', 'quick']);
    $sameType = makeVideo(['curry'], ['published_at' => now()]); // newer, no overlap
    $oneTag = makeVideo(['egg'], ['published_at' => now()->subHour()]);
    $twoTags = makeVideo(['egg', 'breakfast'], ['published_at' => now()->subHours(2)]);
    makeVideo(['egg', 'breakfast', 'quick'], ['content_type' => ContentType::Vlog]); // different type, excluded

    $ids = $this->getJson("/api/v1/videos/{$main->id}/related")->assertOk()->json('data.*.id');

    expect($ids)->toBe([$twoTags->id, $oneTag->id, $sameType->id]);
});

it('suggests distinct existing tags to admins, filtered by query', function () {
    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);
    makeVideo(['egg', 'breakfast']);
    makeVideo(['eggplant', 'curry']);

    $this->getJson('/api/admin/v1/videos/tags')->assertOk()
        ->assertJsonPath('data', ['breakfast', 'curry', 'egg', 'eggplant']);
    $this->getJson('/api/admin/v1/videos/tags?q=egg')->assertOk()
        ->assertJsonPath('data', ['egg', 'eggplant']);
});
