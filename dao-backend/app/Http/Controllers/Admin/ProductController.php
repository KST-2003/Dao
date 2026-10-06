<?php

namespace App\Http\Controllers\Admin;

use App\Contracts\MediaStorageInterface;
use App\Enums\InventoryReason;
use App\Enums\ProductStatus;
use App\Exceptions\DomainException;
use App\Http\Requests\Admin\ProductRequest;
use App\Http\Requests\Admin\VariantRequest;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Services\Home\HomeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->with(['translations', 'images', 'variants', 'category.translations'])
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w
                ->whereHas('translations', fn ($t) => $t->where('name', 'like', $this->like((string) $request->input('q'))))
                ->orWhere('sku', 'like', $this->like((string) $request->input('q')))))
            ->when($request->filled('status'), fn ($q) => $q->where('status', (string) $request->input('status')))
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->latest('id');

        return $this->paginated($query->paginate($this->perPage()), fn (Product $p) => [
            'id' => $p->id,
            'name' => $p->translated('name'),
            'slug' => $p->slug,
            'sku' => $p->sku,
            'image_url' => $p->images->first()?->thumbnail_url ?? $p->images->first()?->url,
            'category' => $p->category?->translated('name'),
            'price' => $p->price,
            'sale_price' => $p->sale_price,
            'status' => $p->status->value,
            'stock' => (int) $p->variants->sum('stock_quantity'),
            'variant_count' => $p->variants->count(),
            'badges' => $p->badges ?? [],
            'updated_at' => $p->updated_at?->toIso8601String(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['data' => $this->present(Product::query()->findOrFail($id))]);
    }

    public function store(ProductRequest $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request) {
            $data = $request->safe()->except(['translations', 'collection_ids']);
            $this->assertSalePrice($data['price'] ?? null, $data['sale_price'] ?? null);
            $data['slug'] ??= Str::slug($request->input('translations.en.name', 'product')).'-'.Str::lower(Str::random(4));
            $data['status'] ??= ProductStatus::Draft->value;
            $product = Product::query()->create($data);
            $product->syncTranslations($request->input('translations', []));
            $product->collections()->sync($request->input('collection_ids', []));

            return $product;
        });
        $this->audit('product.created', $product);
        HomeService::flushCache(); // could land in new_arrivals / dao_picks

        return response()->json(['data' => $this->present($product)], 201);
    }

    public function update(ProductRequest $request, int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        DB::transaction(function () use ($request, $product) {
            $data = $request->safe()->except(['translations', 'collection_ids']);
            $this->assertSalePrice($data['price'] ?? $product->price, array_key_exists('sale_price', $data) ? $data['sale_price'] : $product->sale_price);
            $product->fill($data)->save();
            if ($request->has('translations')) {
                $product->syncTranslations($request->input('translations'));
            }
            if ($request->has('collection_ids')) {
                $product->collections()->sync($request->input('collection_ids'));
            }
        });
        $this->audit('product.updated', $product, $request->safe()->except('translations'));
        HomeService::flushCache();

        return response()->json(['data' => $this->present($product->fresh())]);
    }

    public function publish(int $id): JsonResponse
    {
        $product = Product::query()->with('variants')->findOrFail($id);
        if ($product->variants->where('is_active', true)->isEmpty()) {
            throw DomainException::of('PRODUCT_NEEDS_VARIANT', 422);
        }
        $product->forceFill(['status' => ProductStatus::Published, 'published_at' => $product->published_at ?? now()])->save();
        $this->audit('product.published', $product);
        HomeService::flushCache();

        return response()->json(['data' => $this->present($product)]);
    }

    public function unpublish(int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $product->forceFill(['status' => ProductStatus::Draft])->save();
        $this->audit('product.unpublished', $product);
        HomeService::flushCache();

        return response()->json(['data' => $this->present($product)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $product->forceFill(['status' => ProductStatus::Archived])->save();
        $product->delete(); // soft delete: order history keeps its snapshot
        $this->audit('product.deleted', $product);
        HomeService::flushCache();

        return response()->json(['data' => ['deleted' => true]]);
    }

    // ---------- Variants ----------

    public function storeVariant(VariantRequest $request, int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $variant = DB::transaction(function () use ($request, $product) {
            $variant = $product->variants()->create($request->safe()->except('initial_stock'));
            $initial = (int) $request->input('initial_stock', 0);
            if ($initial > 0) {
                $variant->forceFill(['stock_quantity' => $initial])->save();
                InventoryMovement::query()->create([
                    'product_variant_id' => $variant->id, 'quantity_change' => $initial, 'stock_after' => $initial,
                    'reason' => InventoryReason::Restock, 'admin_user_id' => $this->admin()->id, 'note' => 'Initial stock',
                ]);
            }

            return $variant;
        });
        $this->audit('variant.created', $product, ['variant_id' => $variant->id, 'sku' => $variant->sku]);

        return response()->json(['data' => $variant], 201);
    }

    public function updateVariant(VariantRequest $request, int $id, int $variantId): JsonResponse
    {
        $variant = ProductVariant::query()->where('product_id', $id)->findOrFail($variantId);
        $variant->fill($request->safe()->except('initial_stock'))->save();
        $this->audit('variant.updated', $variant->product, ['variant_id' => $variant->id] + $request->safe()->except('initial_stock'));

        return response()->json(['data' => $variant]);
    }

    public function destroyVariant(int $id, int $variantId): JsonResponse
    {
        $variant = ProductVariant::query()->where('product_id', $id)->findOrFail($variantId);
        $variant->forceFill(['is_active' => false])->save();
        $variant->delete();
        $this->audit('variant.deleted', $variant->product, ['variant_id' => $variant->id]);

        return response()->json(['data' => ['deleted' => true]]);
    }

    // ---------- Images ----------

    /** Content type must match exactly what the client then PUTs with — see MediaStorageInterface. */
    public function presignImage(Request $request, int $id, MediaStorageInterface $media): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $data = $request->validate(['content_type' => ['required', Rule::in(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])]]);
        $ext = str($data['content_type'])->after('/')->toString();
        $key = $media->makeKey('products', $product->id, $ext);

        return response()->json(['data' => ['upload_url' => $media->createUploadUrl($key, $data['content_type']), 'key' => $key]]);
    }

    public function storeImage(Request $request, int $id, MediaStorageInterface $media): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $data = $request->validate([
            'key' => ['required', 'string', 'max:500', function ($attribute, $value, $fail) use ($product) {
                if (! str_starts_with($value, "products/{$product->id}/")) {
                    $fail('Invalid image key.');
                }
            }],
            'color' => ['nullable', 'string', 'max:50'],
            'alt' => ['nullable', 'string', 'max:190'],
        ]);
        // No server-side thumbnail: the file never passes through this server to resize.
        $image = $product->images()->create([
            'url' => $data['key'], 'thumbnail_url' => null,
            'color' => $data['color'] ?? null, 'alt' => $data['alt'] ?? null,
            'sort_order' => (int) $product->images()->max('sort_order') + 1,
        ]);
        $this->audit('product.image_added', $product, ['image_id' => $image->id]);

        return response()->json(['data' => $image], 201);
    }

    public function reorderImages(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']]);
        foreach ($data['ids'] as $i => $imageId) {
            ProductImage::query()->where('product_id', $id)->whereKey($imageId)->update(['sort_order' => $i]);
        }

        return response()->json(['data' => ['reordered' => true]]);
    }

    public function destroyImage(int $id, int $imageId, MediaStorageInterface $media): JsonResponse
    {
        $image = ProductImage::query()->where('product_id', $id)->findOrFail($imageId);
        $media->delete($image->getRawOriginal('url'));
        if ($image->getRawOriginal('thumbnail_url')) {
            $media->delete($image->getRawOriginal('thumbnail_url'));
        }
        $image->delete();
        $this->audit('product.image_removed', Product::query()->find($id), ['image_id' => $imageId]);

        return response()->json(['data' => ['deleted' => true]]);
    }

    private function assertSalePrice(?int $price, ?int $sale): void
    {
        if ($price !== null && $sale !== null && $sale >= $price) {
            throw DomainException::of('SALE_PRICE_INVALID', 422);
        }
    }

    private function present(Product $product): array
    {
        $product->load(['translations', 'images', 'variants', 'collections:id']);

        return $this->withTranslations($product, [
            'cost' => $product->cost,
            'status' => $product->status->value,
            'images' => $product->images,
            'variants' => $product->variants,
            'collection_ids' => $product->collections->pluck('id'),
        ]);
    }
}
