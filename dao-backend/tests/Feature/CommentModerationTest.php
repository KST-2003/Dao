<?php

use App\Enums\ContentType;
use App\Enums\PublishStatus;
use App\Models\AdminUser;
use App\Models\Comment;
use App\Models\User;
use App\Models\Video;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

function commentVideo(): Video
{
    $video = Video::query()->create([
        'content_type' => ContentType::Vlog, 'category' => 'vlog', 'slug' => 'c-'.Str::random(10),
        'status' => PublishStatus::Published, 'published_at' => now()->subMinute(),
    ]);
    $video->syncTranslations(['en' => ['title' => 'Comment video']]);

    return $video;
}

function postComment(User $user, Video $video, array $body): Illuminate\Testing\TestResponse
{
    Sanctum::actingAs($user, ['customer']);

    return test()->postJson("/api/v1/videos/{$video->id}/comments", $body);
}

it('posts a comment and counts it', function () {
    $video = commentVideo();
    postComment(User::factory()->create(), $video, ['body' => 'Yum <b>so good</b>'])->assertCreated()->assertJsonPath('data.body', 'Yum so good');

    expect($video->fresh()->comment_count)->toBe(1);
});

it('rejects an empty comment but allows an image-only one', function () {
    fakeMedia();
    $video = commentVideo();
    $user = User::factory()->create();

    postComment($user, $video, ['body' => '  '])->assertStatus(422);
    postComment($user, $video, ['image' => "comments/{$user->id}/pic.jpg"])->assertCreated()->assertJsonPath('data.body', null);
    postComment($user, $video, ['image' => 'comments/999999/pic.jpg'])->assertStatus(422); // someone else's folder
});

it('flattens replies to the top-level comment and tracks reply_count', function () {
    $video = commentVideo();
    [$a, $b] = [User::factory()->create(['name' => 'Aye', 'display_name' => 'Aye']), User::factory()->create()];
    $top = postComment($a, $video, ['body' => 'top'])->json('data.id');
    $reply = postComment($b, $video, ['body' => 'r1', 'parent_id' => $top])->assertCreated()->assertJsonPath('data.reply_to', 'Aye')->json('data.id');
    $deep = postComment($a, $video, ['body' => 'r2', 'parent_id' => $reply])->assertCreated();

    expect($deep->json('data.parent_id'))->toBe($top);
    expect(Comment::query()->find($top)->reply_count)->toBe(2);
    expect($video->fresh()->comment_count)->toBe(3);
    $this->getJson("/api/v1/comments/{$top}/replies")->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('data.0.body', 'r1');
    $this->getJson("/api/v1/videos/{$video->id}/comments")->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.reply_count', 2);
});

it('likes and unlikes a comment once', function () {
    $video = commentVideo();
    $user = User::factory()->create();
    $id = postComment($user, $video, ['body' => 'hi'])->json('data.id');

    $this->postJson("/api/v1/comments/{$id}/like")->assertOk()->assertJsonPath('data.like_count', 1);
    $this->postJson("/api/v1/comments/{$id}/like")->assertOk()->assertJsonPath('data.like_count', 1);
    $this->getJson("/api/v1/videos/{$video->id}/comments")->assertJsonPath('data.0.is_liked', true);
    $this->deleteJson("/api/v1/comments/{$id}/like")->assertOk()->assertJsonPath('data.like_count', 0);
});

it('shows a banned comment only to its author, masked, and hides it from the count', function () {
    $video = commentVideo();
    [$author, $other] = [User::factory()->create(), User::factory()->create()];
    $id = postComment($author, $video, ['body' => 'rude words'])->json('data.id');

    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);
    $this->postJson("/api/admin/v1/comments/{$id}/ban", ['reason' => 'abuse'])->assertOk()->assertJsonPath('data.status', 'banned');
    expect($video->fresh()->comment_count)->toBe(0);
    $this->assertDatabaseHas('audit_logs', ['action' => 'comment.banned', 'reason' => 'abuse']);

    Sanctum::actingAs($author, ['customer']);
    $mine = $this->getJson("/api/v1/videos/{$video->id}/comments")->assertOk()->assertJsonCount(1, 'data');
    $mine->assertJsonPath('data.0.status', 'banned')->assertJsonPath('data.0.body', null);
    $this->postJson("/api/v1/comments/{$id}/like")->assertNotFound();

    Sanctum::actingAs($other, ['customer']);
    $this->getJson("/api/v1/videos/{$video->id}/comments")->assertOk()->assertJsonCount(0, 'data');

    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);
    $this->postJson("/api/admin/v1/comments/{$id}/unban")->assertOk();
    expect($video->fresh()->comment_count)->toBe(1);
});

it('removes replies from the public count while their parent is banned', function () {
    $video = commentVideo();
    $user = User::factory()->create();
    $top = postComment($user, $video, ['body' => 'top'])->json('data.id');
    postComment(User::factory()->create(), $video, ['body' => 'reply', 'parent_id' => $top]);
    expect($video->fresh()->comment_count)->toBe(2);

    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);
    $this->postJson("/api/admin/v1/comments/{$top}/ban")->assertOk();
    expect($video->fresh()->comment_count)->toBe(0);
});

it('lets an admin delete a comment with its replies, and the author delete their own only', function () {
    $video = commentVideo();
    [$a, $b] = [User::factory()->create(), User::factory()->create()];
    $top = postComment($a, $video, ['body' => 'top'])->json('data.id');
    postComment($b, $video, ['body' => 'reply', 'parent_id' => $top]);

    Sanctum::actingAs($b, ['customer']);
    $this->deleteJson("/api/v1/comments/{$top}")->assertForbidden();

    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);
    $this->deleteJson("/api/admin/v1/comments/{$top}")->assertOk();
    expect(Comment::query()->count())->toBe(0);
    expect($video->fresh()->comment_count)->toBe(0);
    $this->assertDatabaseHas('audit_logs', ['action' => 'comment.deleted']);
});

it('requires the comments.moderate permission for the moderation queue', function () {
    $video = commentVideo();
    $id = postComment(User::factory()->create(), $video, ['body' => 'x'])->json('data.id');

    Sanctum::actingAs(User::factory()->create(), ['customer']);
    $this->getJson('/api/admin/v1/comments')->assertStatus(403);

    Sanctum::actingAs(AdminUser::factory()->create(), ['admin']);
    $this->getJson('/api/admin/v1/comments?status=visible&q=x')->assertOk()->assertJsonPath('data.0.id', $id)->assertJsonPath('data.0.video.id', $video->id);
});
