<?php

namespace App\Services\Catalog;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/** Shop listing: filters, sorting, search. Always paginated — the catalog is never loaded whole. */
class ProductQueryService
{
    public const SORTS = ['newest', 'price_asc', 'price_desc', 'popular', 'rating'];

    /**
     * @param  array{category?: string, collection?: string, q?: string, sizes?: list<string>, colors?: list<string>,
     *               min_price?: int, max_price?: int, on_sale?: bool, badge?: string, in_stock?: bool, sort?: string, per_page?: int}  $filters
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = Product::query()->published()->with(['translations', 'images', 'variants']);

        if (! empty($filters['category'])) {
            $query->whereHas('category', fn (Builder $q) => $q->where('slug', $filters['category'])
                ->orWhereHas('parent', fn (Builder $p) => $p->where('slug', $filters['category'])));
        }
        if (! empty($filters['collection'])) {
            $query->whereHas('collections', fn (Builder $q) => $q->where('slug', $filters['collection']));
        }
        if (! empty($filters['q'])) {
            $this->search($query, $filters['q']);
        }
        if (! empty($filters['sizes'])) {
            $query->whereHas('variants', fn (Builder $q) => $q->where('is_active', true)->whereIn('size', $filters['sizes']));
        }
        if (! empty($filters['colors'])) {
            $query->whereHas('variants', fn (Builder $q) => $q->where('is_active', true)->whereIn('color', $filters['colors']));
        }
        if (! empty($filters['in_stock'])) {
            $query->whereHas('variants', fn (Builder $q) => $q->where('is_active', true)->where('stock_quantity', '>', 0));
        }
        if (isset($filters['min_price'])) {
            $query->whereRaw('COALESCE(sale_price, price) >= ?', [(int) $filters['min_price']]);
        }
        if (isset($filters['max_price'])) {
            $query->whereRaw('COALESCE(sale_price, price) <= ?', [(int) $filters['max_price']]);
        }
        if (! empty($filters['on_sale'])) {
            $query->whereNotNull('sale_price')->whereColumn('sale_price', '<', 'price');
        }
        if (! empty($filters['badge'])) {
            $query->whereJsonContains('badges', $filters['badge']);
        }

        match ($filters['sort'] ?? 'newest') {
            'price_asc' => $query->orderByRaw('COALESCE(sale_price, price) asc'),
            'price_desc' => $query->orderByRaw('COALESCE(sale_price, price) desc'),
            'popular' => $query->orderByDesc('sold_count'),
            'rating' => $query->orderByDesc('rating_avg')->orderByDesc('rating_count'),
            default => $query->orderByDesc('published_at')->orderByDesc('id'),
        };

        return $query->paginate(min(48, max(1, (int) ($filters['per_page'] ?? 20))))->withQueryString();
    }

    public function search(Builder $query, string $term): Builder
    {
        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], mb_substr(trim($term), 0, 80)).'%';

        return $query->where(fn (Builder $q) => $q
            ->whereHas('translations', fn (Builder $t) => $t->where('name', 'like', $like))
            ->orWhere('sku', 'like', $like)
            ->orWhere('brand', 'like', $like));
    }
}
