<?php

use App\Enums\ContentType;
use App\Enums\PublishStatus;
use App\Models\AdminRole;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\MembershipTier;
use App\Models\User;
use App\Models\UserMembership;
use App\Models\Video;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

function moveToTier(User $user, string $code): void
{
    UserMembership::query()->where('user_id', $user->id)
        ->update(['membership_tier_id' => MembershipTier::query()->where('code', $code)->firstOrFail()->id]);
}

function downloadableVideo(): Video
{
    $video = Video::query()->create([
        'content_type' => ContentType::Recipe, 'slug' => 'dl-'.Str::random(8),
        'video_url' => 'videos/1/clip.mp4', 'status' => PublishStatus::Published, 'published_at' => now()->subMinute(),
    ]);
    $video->syncTranslations(['en' => ['title' => 'Downloadable']]);

    return $video;
}

it('grants content access from the membership tier (dao_star ships with both on)', function () {
    $user = customer();
    moveToTier($user, 'dao_star');

    $this->getJson('/api/v1/me')->assertOk()
        ->assertJsonPath('data.permissions.can_screenshot', true)
        ->assertJsonPath('data.permissions.can_download_videos', true);
});

it('withholds content access by default on the entry tier', function () {
    $user = customer(); // entry tier ('member'), no overrides
    $this->getJson('/api/v1/me')->assertOk()
        ->assertJsonPath('data.permissions.can_screenshot', false)
        ->assertJsonPath('data.permissions.can_download_videos', false);
});

it('grants access via a per-user override even on the entry tier', function () {
    $user = customer();
    $user->forceFill(['download_override' => true])->save();

    $this->getJson('/api/v1/me')->assertOk()
        ->assertJsonPath('data.permissions.can_download_videos', true)
        ->assertJsonPath('data.permissions.can_screenshot', false);
});

it('rejects a video download for a non-privileged user and accepts it for a privileged one', function () {
    config(['filesystems.r2_public_url' => 'https://cdn.dao.test']); // getMediaUrl() needs a resolvable base in tests
    $video = downloadableVideo();

    $blocked = customer();
    $this->postJson("/api/v1/videos/{$video->id}/download")
        ->assertStatus(403)->assertJsonPath('code', 'VIDEO_DOWNLOAD_NOT_ALLOWED');

    $allowed = customer();
    $allowed->forceFill(['download_override' => true])->save();
    Sanctum::actingAs($allowed, ['customer']);
    $this->postJson("/api/v1/videos/{$video->id}/download")
        ->assertOk()->assertJsonPath('data.url', fn ($url) => str_contains((string) $url, 'clip.mp4'));
});

it('rejects an unauthenticated download request', function () {
    $video = downloadableVideo();
    $this->postJson("/api/v1/videos/{$video->id}/download")->assertStatus(401);
});

it('lets an admin with customers.manage grant a per-user override and audits it', function () {
    // Create the target customer BEFORE switching the acting session to the admin —
    // the customer() helper itself calls Sanctum::actingAs, which would otherwise
    // clobber the admin session set below.
    $user = customer();
    $role = AdminRole::query()->firstOrCreate(['slug' => 'manager'], ['name' => 'Manager', 'permissions' => ['customers.manage']]);
    Sanctum::actingAs(AdminUser::factory()->create(['admin_role_id' => $role->id]), ['admin']);

    $this->putJson("/api/admin/v1/customers/{$user->id}/content-access", ['screenshot_override' => true])
        ->assertOk()->assertJsonPath('data.screenshot_override', true)->assertJsonPath('data.download_override', false);

    expect($user->fresh()->screenshot_override)->toBeTrue();
    expect(AuditLog::query()->where('action', 'customer.content_access_updated')->exists())->toBeTrue();
});

it('forbids a customers.view-only admin from granting overrides', function () {
    $user = customer();
    $role = AdminRole::query()->firstOrCreate(['slug' => 'customer_support'], ['name' => 'Customer Support', 'permissions' => ['customers.view']]);
    Sanctum::actingAs(AdminUser::factory()->create(['admin_role_id' => $role->id]), ['admin']);

    $this->putJson("/api/admin/v1/customers/{$user->id}/content-access", ['screenshot_override' => true])->assertForbidden();
});
