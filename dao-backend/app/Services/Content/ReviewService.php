<?php

namespace App\Services\Content;

use App\Enums\LoyaltyTransactionType;
use App\Enums\OrderStatus;
use App\Enums\ReviewStatus;
use App\Exceptions\DomainException;
use App\Models\AdminUser;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use App\Models\ReviewReport;
use App\Models\User;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Settings\SettingsService;
use Illuminate\Support\Facades\DB;

class ReviewService
{
    public function __construct(
        private readonly LoyaltyService $loyalty,
        private readonly SettingsService $settings,
    ) {}

    /** @param  list<string>  $photoUrls */
    public function submit(User $user, Product $product, int $rating, ?string $body, array $photoUrls): Review
    {
        if (Review::query()->where('user_id', $user->id)->where('product_id', $product->id)->exists()) {
            throw DomainException::of('REVIEW_EXISTS', 409);
        }
        $orderItem = OrderItem::query()->where('product_id', $product->id)
            ->whereHas('order', fn ($q) => $q->where('user_id', $user->id)->where('status', OrderStatus::Delivered->value))
            ->first();

        return Review::query()->create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'order_item_id' => $orderItem?->id,
            'rating' => $rating,
            'body' => $body,
            'photos' => $photoUrls,
            'is_verified_purchase' => $orderItem !== null,
            'status' => ReviewStatus::Pending,
        ]);
    }

    public function moderate(Review $review, ReviewStatus $status, AdminUser $admin): Review
    {
        return DB::transaction(function () use ($review, $status, $admin) {
            $review->forceFill(['status' => $status, 'moderated_by' => $admin->id, 'moderated_at' => now()])->save();
            $this->refreshRating($review->product_id);

            // Bonus only for approved, verified-purchase reviews; idempotent per review.
            if ($status === ReviewStatus::Approved && $review->is_verified_purchase) {
                $bonus = $this->settings->int('loyalty.review_bonus')
                    + (! empty($review->photos) ? $this->settings->int('loyalty.photo_review_bonus') : 0);
                if ($bonus > 0) {
                    $this->loyalty->credit($review->user, LoyaltyTransactionType::ReviewBonus, $bonus, $review, 'Review reward', "review_bonus:review:{$review->id}");
                }
            }

            return $review;
        });
    }

    public function report(User $user, Review $review, string $reason): void
    {
        $created = ReviewReport::query()->firstOrCreate(['review_id' => $review->id, 'user_id' => $user->id], ['reason' => $reason]);
        if ($created->wasRecentlyCreated) {
            $review->increment('report_count');
        }
    }

    private function refreshRating(int $productId): void
    {
        $stats = Review::query()->where('product_id', $productId)->where('status', ReviewStatus::Approved->value)
            ->selectRaw('COUNT(*) as c, AVG(rating) as a')->first();
        Product::query()->whereKey($productId)->update([
            'rating_count' => (int) $stats->c,
            'rating_avg' => round((float) $stats->a, 2),
        ]);
    }
}
