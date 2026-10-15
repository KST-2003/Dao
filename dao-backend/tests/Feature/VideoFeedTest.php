<?php

use App\Enums\ContentType;
use App\Enums\PublishStatus;
use App\Models\AdminUser;
use App\Models\Like;
use App\Models\Video;
use App\Models\VideoCategory;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

function feedVideo(array $overrides = []): Video
{
    $video = Video::query()->create(array_merge([
        'content_type' => ContentType::Vlog, 'category' => 'fashion', 'slug' => 'f-'.Str::random(10),
        'video_url' => 'https://cdn.test/v.mp4', 'status' => PublishStatus::Published, 'published_at' => now()->subMinute(),
    ], $overrides));
    $video->syncTranslations(['en' => ['title' => 'Feed '.$video->slug]]);

    return $video;
}

it('seeds the old hard-coded categories and lists active ones in admin order', function () {
    expect(VideoCategory::query()->pluck('slug')->all())->toContain('fashion', 'daos_life');

    VideoCategory::query()->where('slug', 'fashion')->update(['sort_order' => 99]);
    VideoCategory::query()->where('slug', 'travel')->update(['is_active' => false]);

    $slugs = collect($this->getJson('/api/v1/video-categories')->assertOk()->json('data'))->pluck('slug');
    expect($slugs->last())->toBe('fashion')->and($slugs)->not->toContain('travel');
    $this->getJson('/api/v1/video-categories')->assertJsonPath('data.0.name', 'Daily Life');
});

it('serves playable full videos, newest first, without recipes or file-less videos', function () {
    $old = feedVideo(['published_at' => now()->subDay()]);
    $new = feedVideo();
    feedVideo(['content_type' => ContentType::Recipe]);
    feedVideo(['video_url' => null]);
    feedVideo(['status' => PublishStatus::Draft]);

    $res = $this->getJson('/api/v1/videos/feed')->assertOk();
    expect(collect($res->json('data'))->pluck('id')->all())->toBe([$new->id, $old->id])
        ->and($res->json('data.0.video_url'))->toBe('https://cdn.test/v.mp4');
});

it('filters the feed by category and pages it', function () {
    feedVideo(['category' => 'fashion']);
    feedVideo(['category' => 'fashion']);
    feedVideo(['category' => 'travel']);

    $this->getJson('/api/v1/videos/feed?category=fashion')->assertJsonCount(2, 'data');
    $this->getJson('/api/v1/videos/feed?per_page=2')->assertJsonCount(2, 'data')->assertJsonPath('meta.last_page', 2);
});

it('marks which feed videos the signed-in user liked and saved', function () {
    $user = customer();
    $liked = feedVideo();
    $other = feedVideo();
    Like::query()->create(['user_id' => $user->id, 'likeable_type' => $liked->getMorphClass(), 'likeable_id' => $liked->id]);

    $data = collect($this->getJson('/api/v1/videos/feed')->assertOk()->json('data'))->keyBy('id');
    expect($data[$liked->id]['is_liked'])->toBeTrue()->and($data[$other->id]['is_liked'])->toBeFalse();
});

it('hides the members-only file from guests in the feed', function () {
    feedVideo(['is_members_only' => true]);
    $this->getJson('/api/v1/videos/feed')->assertJsonPath('data.0.video_url', null)->assertJsonPath('data.0.is_members_only', true);
});

it('lets admins manage video categories and carries a rename to the videos', function () {
    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);

    $id = $this->postJson('/api/admin/v1/video-categories', ['slug' => 'ootd', 'translations' => ['en' => ['name' => 'OOTD'], 'th' => ['name' => 'ชุดวันนี้']]])
        ->assertCreated()->assertJsonPath('data.translations.th.name', 'ชุดวันนี้')->json('data.id');
    $this->postJson('/api/admin/v1/video-categories', ['slug' => 'Bad Slug!', 'translations' => ['en' => ['name' => 'x']]])->assertStatus(422);

    $video = feedVideo(['category' => 'ootd']);
    $this->deleteJson("/api/admin/v1/video-categories/{$id}")->assertStatus(409)->assertJsonPath('code', 'VIDEO_CATEGORY_IN_USE');

    $this->putJson("/api/admin/v1/video-categories/{$id}", ['slug' => 'outfits'])->assertOk();
    expect($video->fresh()->category)->toBe('outfits');

    $video->update(['category' => null]);
    $this->deleteJson("/api/admin/v1/video-categories/{$id}")->assertOk();
});
