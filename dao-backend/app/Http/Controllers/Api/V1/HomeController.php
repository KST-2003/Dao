<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\SaveableType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\BannerResource;
use App\Http\Resources\Api\CollectionResource;
use App\Http\Resources\Api\MembershipTierResource;
use App\Http\Resources\Api\ProductCardResource;
use App\Http\Resources\Api\RecipeCardResource;
use App\Http\Resources\Api\VideoCardResource;
use App\Services\Content\EngagementService;
use App\Services\Home\HomeService;
use App\Services\Loyalty\MembershipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function __invoke(Request $request, HomeService $home, MembershipService $membership, EngagementService $engagement): JsonResponse
    {
        $user = $request->user('sanctum');
        $request->attributes->set('saved_product_ids', $engagement->savedIds($user, SaveableType::Product));
        $s = $home->publicSections(app()->getLocale());

        $member = null;
        if ($user) {
            $summary = $membership->summary($user);
            $member = [
                'tier' => new MembershipTierResource($summary['tier']),
                'balance' => $summary['balance'],
                'points_to_next' => $summary['points_to_next'],
                'next_tier' => $summary['next_tier'] ? $summary['next_tier']->translated('name') : null,
                'progress' => $summary['progress'],
            ];
        }

        return $this->ok([
            'greeting' => $home->greeting($user),
            'hero' => BannerResource::collection($s['hero']),
            'new_arrivals' => ProductCardResource::collection($s['new_arrivals']),
            'dao_picks' => ProductCardResource::collection($s['dao_picks']),
            'featured_collection' => $s['featured_collection'] ? new CollectionResource($s['featured_collection']) : null,
            'feature_banners' => BannerResource::collection($s['feature_banners']),
            'from_dao' => VideoCardResource::collection($s['from_dao']),
            'kitchen' => RecipeCardResource::collection($s['kitchen']),
            'membership' => $member,
        ]);
    }
}
