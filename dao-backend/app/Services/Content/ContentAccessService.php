<?php

namespace App\Services\Content;

use App\Models\User;
use App\Services\Loyalty\MembershipService;

/**
 * Screenshot/recording-block bypass and video download are both opt-in, never the default.
 * A user gets either through their membership tier (admin-defined per tier, like
 * free_shipping/early_access) or an individual override (admin-granted regardless of tier —
 * staff testing, press, partners). Either source is enough; there's no "revoke below tier".
 */
class ContentAccessService
{
    public function __construct(private readonly MembershipService $membership) {}

    public function canScreenshot(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->screenshot_override || (bool) $this->membership->currentTier($user)?->allows_screenshots;
    }

    public function canDownloadVideos(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $user->download_override || (bool) $this->membership->currentTier($user)?->allows_video_download;
    }

    /** @return array{can_screenshot: bool, can_download_videos: bool} */
    public function permissions(?User $user): array
    {
        return ['can_screenshot' => $this->canScreenshot($user), 'can_download_videos' => $this->canDownloadVideos($user)];
    }
}
