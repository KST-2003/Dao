<?php

use App\Enums\ContentType;
use App\Enums\PublishStatus;
use App\Models\AdminUser;
use App\Models\Video;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

function recipeVideo(array $overrides = []): Video
{
    $video = Video::query()->create(array_merge([
        'content_type' => ContentType::Recipe, 'slug' => 'rv-'.Str::random(8),
        'status' => PublishStatus::Published, 'published_at' => now()->subMinute(),
    ], $overrides));
    $video->syncTranslations(['en' => ['title' => 'Cook along']]);

    return $video;
}

it('stores when each step happens in the video and serves it with the recipe', function () {
    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);
    $video = recipeVideo();

    $id = $this->postJson('/api/admin/v1/recipes', [
        'slug' => 'timed-curry', 'video_id' => $video->id, 'status' => 'published', 'published_at' => now()->subMinute()->toIso8601String(),
        'translations' => ['en' => ['title' => 'Timed curry']],
        'steps' => [
            ['instruction' => ['en' => 'Chop'], 'video_seconds' => 65, 'video_end_seconds' => 90],
            ['instruction' => ['en' => 'Fry'], 'video_seconds' => null],
        ],
    ])->assertCreated()->json('data.id');

    $this->app['auth']->forgetGuards();
    $this->getJson("/api/v1/recipes/{$id}")->assertOk()
        ->assertJsonPath('data.steps.0.video_seconds', 65)
        ->assertJsonPath('data.steps.0.video_end_seconds', 90)
        ->assertJsonPath('data.steps.1.video_seconds', null)
        ->assertJsonPath('data.video.id', $video->id);
});

it('withholds a members-only recipe video from guests', function () {
    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);
    $video = recipeVideo(['is_members_only' => true, 'video_url' => 'videos/1/clip.mp4']);
    $id = $this->postJson('/api/admin/v1/recipes', [
        'slug' => 'members-curry', 'video_id' => $video->id, 'status' => 'published', 'published_at' => now()->subMinute()->toIso8601String(),
        'translations' => ['en' => ['title' => 'Members curry']],
    ])->assertCreated()->json('data.id');

    $this->app['auth']->forgetGuards();
    $this->getJson("/api/v1/recipes/{$id}")->assertOk()->assertJsonPath('data.video_url', null);
});

it('rejects a step that ends before it starts', function () {
    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);

    $this->postJson('/api/admin/v1/recipes', [
        'slug' => 'bad-times', 'translations' => ['en' => ['title' => 'Bad times']],
        'steps' => [['instruction' => ['en' => 'Chop'], 'video_seconds' => 60, 'video_end_seconds' => 30]],
    ])->assertUnprocessable()->assertJsonValidationErrors('steps.0.video_end_seconds');
});
