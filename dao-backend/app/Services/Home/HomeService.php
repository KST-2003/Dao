<?php

namespace App\Services\Home;

use App\Enums\BannerPlacement;
use App\Enums\ContentType;
use App\Enums\Locale;
use App\Enums\OrderStatus;
use App\Enums\ProductBadge;
use App\Models\Banner;
use App\Models\Collection;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\User;
use App\Models\Video;
use App\Services\Loyalty\MembershipService;
use Illuminate\Support\Facades\Cache;

/**
 * Fashion-first home feed. Public sections are cached per locale for 5 minutes;
 * the personal part (greeting, membership) is computed per request.
 * Section order: hero → new arrivals → DAO picks → featured collection → from Dao → kitchen → membership.
 */
class HomeService
{
    public function __construct(private readonly MembershipService $membership) {}

    public function publicSections(string $locale): array
    {
        return Cache::remember("home:v1:{$locale}", now()->addMinutes(5), function () {
            $with = ['translations', 'images', 'variants'];

            return [
                'hero' => Banner::query()->live(BannerPlacement::HomeHero)->with('translations')->limit(5)->get(),
                'new_arrivals' => Product::query()->published()->with($with)->latest('published_at')->limit(10)->get(),
                'dao_picks' => Product::query()->published()->with($with)->whereJsonContains('badges', ProductBadge::DaoPick->value)->latest('published_at')->limit(10)->get(),
                'featured_collection' => Collection::query()->live()->where('is_featured', true)->with(['translations', 'products' => fn ($q) => $q->published()->with($with)->limit(8)])->orderBy('sort_order')->first(),
                'feature_banners' => Banner::query()->live(BannerPlacement::HomeFeature)->with('translations')->limit(3)->get(),
                'from_dao' => Video::query()->published()->whereIn('content_type', [ContentType::Vlog->value, ContentType::Fashion->value])->with('translations')->latest('published_at')->limit(6)->get(),
                'kitchen' => Recipe::query()->published()->with('translations')->orderByDesc('is_featured')->latest('published_at')->limit(4)->get(),
            ];
        });
    }

    /**
     * Call whenever something publicSections() reads from changes: banners, a featured
     * collection, a new/dao_pick product, a vlog video, or a recipe. Cheap — just a few key
     * deletes — so admin writes call it unconditionally rather than working out what changed.
     */
    public static function flushCache(): void
    {
        foreach (Locale::values() as $locale) {
            Cache::forget("home:v1:{$locale}");
        }
    }

    /** Personalized greeting key + params, resolved by the app's i18n. */
    public function greeting(?User $user): array
    {
        if (! $user) {
            return ['key' => 'home.greeting.new', 'params' => []];
        }

        $shipped = Order::query()->where('user_id', $user->id)->where('status', OrderStatus::Shipped->value)->latest('updated_at')->first();
        if ($shipped) {
            return ['key' => 'home.greeting.orderOnTheWay', 'params' => ['order' => $shipped->order_number], 'order_id' => $shipped->id];
        }

        $recent = LoyaltyTransaction::query()->where('user_id', $user->id)->where('points', '>', 0)
            ->where('created_at', '>', now()->subDays(2))->latest('id')->first();
        if ($recent) {
            return ['key' => 'home.greeting.pointsEarned', 'params' => ['points' => $recent->points]];
        }

        $tier = $this->membership->currentTier($user);
        $entry = $this->membership->entryTier();
        if ($tier && $tier->id !== $entry->id) {
            return ['key' => 'home.greeting.member', 'params' => ['tier' => $tier->translated('name'), 'name' => $user->greetingName()]];
        }

        return ['key' => 'home.greeting.returning', 'params' => ['name' => $user->greetingName()]];
    }
}
