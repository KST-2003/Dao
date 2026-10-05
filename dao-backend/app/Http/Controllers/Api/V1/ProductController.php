<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ReviewStatus;
use App\Enums\SaveableType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ReviewRequest;
use App\Http\Resources\Api\ProductCardResource;
use App\Http\Resources\Api\ProductResource;
use App\Http\Resources\Api\ReviewResource;
use App\Models\Product;
use App\Models\Review;
use App\Contracts\MediaStorageInterface;
use App\Services\Catalog\ProductQueryService;
use App\Services\Content\EngagementService;
use App\Services\Content\ReviewService;
use App\Services\Loyalty\MembershipService;
use App\Services\Pricing\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function __construct(private readonly EngagementService $engagement) {}

    public function index(Request $request, ProductQueryService $products): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'category' => ['nullable', 'string', 'max:100'],
            'collection' => ['nullable', 'string', 'max:100'],
            'q' => ['nullable', 'string', 'max:80'],
            'sizes' => ['nullable', 'array'], 'sizes.*' => ['string', 'max:30'],
            'colors' => ['nullable', 'array'], 'colors.*' => ['string', 'max:50'],
            'min_price' => ['nullable', 'integer', 'min:0'],
            'max_price' => ['nullable', 'integer', 'min:0'],
            'on_sale' => ['nullable', 'boolean'],
            'in_stock' => ['nullable', 'boolean'],
            'badge' => ['nullable', 'string', 'max:30'],
            'sort' => ['nullable', Rule::in(ProductQueryService::SORTS)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ]);
        $request->attributes->set('saved_product_ids', $this->engagement->savedIds($request->user('sanctum'), SaveableType::Product));

        return ProductCardResource::collection($products->paginate($filters));
    }

    public function show(Request $request, int $id, PricingService $pricing, MembershipService $membership): ProductResource
    {
        $product = Product::query()->published()->with(['translations', 'images', 'variants', 'category.translations'])->findOrFail($id);
        $user = $request->user('sanctum');
        $request->attributes->set('saved_product_ids', $this->engagement->savedIds($user, SaveableType::Product));

        if ($user) {
            $tier = $membership->currentTier($user);
            $variant = $product->variants->firstWhere('is_active', true);
            if ($variant) {
                $variant->setRelation('product', $product);
                $line = $pricing->priceLine($variant, 1, $tier);
                $request->attributes->set('product_pricing', [
                    'your_price' => $line->memberUnitPrice,
                    'tier' => $tier?->translated('name'),
                    'is_member_price' => $line->memberUnitPrice < $line->listUnitPrice,
                ]);
            }
            DB::table('recently_viewed_products')->upsert(
                [['user_id' => $user->id, 'product_id' => $product->id, 'viewed_at' => now()]],
                ['user_id', 'product_id'], ['viewed_at'],
            );
        }

        return new ProductResource($product);
    }

    public function related(Request $request, int $id): AnonymousResourceCollection
    {
        $product = Product::query()->published()->findOrFail($id);
        $request->attributes->set('saved_product_ids', $this->engagement->savedIds($request->user('sanctum'), SaveableType::Product));

        return ProductCardResource::collection(
            Product::query()->published()->whereKeyNot($product->id)
                ->where('category_id', $product->category_id)
                ->with(['translations', 'images', 'variants'])->orderByDesc('sold_count')->limit(10)->get()
        );
    }

    public function recentlyViewed(Request $request): AnonymousResourceCollection
    {
        $ids = DB::table('recently_viewed_products')->where('user_id', $request->user()->id)
            ->orderByDesc('viewed_at')->limit(20)->pluck('product_id')->all();
        $products = Product::query()->published()->whereIn('id', $ids)->with(['translations', 'images', 'variants'])->get()
            ->sortBy(fn ($p) => array_search($p->id, $ids, true))->values();
        $request->attributes->set('saved_product_ids', $this->engagement->savedIds($request->user(), SaveableType::Product));

        return ProductCardResource::collection($products);
    }

    public function reviews(int $id): JsonResponse
    {
        $product = Product::query()->published()->findOrFail($id);
        $reviews = Review::query()->where('product_id', $product->id)->where('status', ReviewStatus::Approved->value)
            ->with('user')->latest()->paginate(10);
        $distribution = Review::query()->where('product_id', $product->id)->where('status', ReviewStatus::Approved->value)
            ->selectRaw('rating, COUNT(*) as c')->groupBy('rating')->pluck('c', 'rating');

        return ReviewResource::collection($reviews)->additional(['meta' => [
            'rating_avg' => $product->rating_avg,
            'rating_count' => $product->rating_count,
            'distribution' => collect(range(1, 5))->mapWithKeys(fn ($r) => [$r => (int) ($distribution[$r] ?? 0)]),
        ]])->response();
    }

    /** Content type must match exactly what the client then PUTs with — see MediaStorageInterface. */
    public function presignReviewPhoto(Request $request, MediaStorageInterface $media): JsonResponse
    {
        $data = $request->validate([
            'content_type' => ['required', Rule::in(['image/jpeg', 'image/png', 'image/webp'])],
        ]);
        $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$data['content_type']];
        $key = $media->makeKey('reviews', $request->user()->id, $ext);

        return $this->ok(['upload_url' => $media->createUploadUrl($key, $data['content_type']), 'key' => $key]);
    }

    public function storeReview(ReviewRequest $request, int $id, ReviewService $reviews): ReviewResource
    {
        $product = Product::query()->published()->findOrFail($id);
        $photos = $request->input('photos', []);

        return new ReviewResource($reviews->submit($request->user(), $product, (int) $request->input('rating'), $request->input('body'), $photos)->load('user'));
    }

    public function reportReview(Request $request, int $reviewId, ReviewService $reviews): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:255']]);
        $reviews->report($request->user(), Review::query()->findOrFail($reviewId), $data['reason']);

        return $this->ok(['reported' => true]);
    }
}
