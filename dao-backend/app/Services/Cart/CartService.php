<?php

namespace App\Services\Cart;

use App\Exceptions\DomainException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\Loyalty\MembershipService;
use Illuminate\Support\Collection;

/**
 * Cart rules: variant-level stock checks, VIP gating, max quantity per line.
 * Problems (sold out, price changed…) are REPORTED as issues — the cart is never silently modified.
 */
class CartService
{
    public const MAX_QTY_PER_LINE = 10;

    public function __construct(private readonly MembershipService $membership) {}

    public function cartFor(User $user): Cart
    {
        return Cart::query()->firstOrCreate(['user_id' => $user->id]);
    }

    public function load(User $user): Cart
    {
        return $this->cartFor($user)->load(['items.variant.product.translations', 'items.variant.product.images']);
    }

    public function add(User $user, int $variantId, int $quantity): CartItem
    {
        $variant = ProductVariant::query()->with('product')->find($variantId);
        $this->assertPurchasable($user, $variant);

        $cart = $this->cartFor($user);
        /** @var CartItem|null $item */
        $item = $cart->items()->where('product_variant_id', $variantId)->first();
        $newQty = ($item && ! $item->saved_for_later ? $item->quantity : 0) + $quantity;
        $this->assertQuantity($variant, $newQty);
        $this->assertProductMax($cart, $variant, $newQty, $item?->id);

        if ($item) {
            $item->update(['quantity' => $newQty, 'saved_for_later' => false, 'unit_price_at_add' => $variant->listPrice()]);

            return $item;
        }

        return $cart->items()->create([
            'product_variant_id' => $variant->id,
            'quantity' => $newQty,
            'unit_price_at_add' => $variant->listPrice(),
        ]);
    }

    public function updateQuantity(User $user, int $itemId, int $quantity): CartItem
    {
        $item = $this->ownedItem($user, $itemId);
        $variant = $item->variant()->with('product')->first();
        $this->assertPurchasable($user, $variant);
        $this->assertQuantity($variant, $quantity);
        $this->assertProductMax($item->cart, $variant, $quantity, $item->id);
        $item->update(['quantity' => $quantity]);

        return $item;
    }

    public function remove(User $user, int $itemId): void
    {
        $this->ownedItem($user, $itemId)->delete();
    }

    public function setSavedForLater(User $user, int $itemId, bool $saved): CartItem
    {
        $item = $this->ownedItem($user, $itemId);
        $item->update(['saved_for_later' => $saved]);

        return $item;
    }

    /** The shopper accepts the current price after a price_changed notice. */
    public function acceptPrice(User $user, int $itemId): CartItem
    {
        $item = $this->ownedItem($user, $itemId);
        $item->update(['unit_price_at_add' => $item->variant->listPrice()]);

        return $item;
    }

    /**
     * @param  Collection<int, CartItem>  $items
     * @return list<array{item_id: int, code: string, available?: int, min?: int, max?: int, old_price?: int, new_price?: int}>
     */
    public function issues(Collection $items): array
    {
        $issues = [];
        // Admin-set limits are per product, across all its sizes/colors in the cart.
        $perProduct = $items->where('saved_for_later', false)->groupBy(fn ($i) => $i->variant?->product_id)->map(fn ($g) => (int) $g->sum('quantity'));
        foreach ($items as $item) {
            $variant = $item->variant;
            $product = $variant?->product;
            if (! $variant || $variant->trashed() || ! $variant->is_active || ! $product || $product->trashed() || ! $product->isPublished()) {
                $issues[] = ['item_id' => $item->id, 'code' => 'unavailable'];
            } elseif ($variant->stock_quantity <= 0) {
                $issues[] = ['item_id' => $item->id, 'code' => 'out_of_stock'];
            } elseif ($item->quantity > $variant->stock_quantity) {
                $issues[] = ['item_id' => $item->id, 'code' => 'insufficient_stock', 'available' => $variant->stock_quantity];
            } elseif (! $item->saved_for_later && $product->min_order_qty !== null && ($perProduct[$product->id] ?? 0) < $product->min_order_qty) {
                $issues[] = ['item_id' => $item->id, 'code' => 'below_min_quantity', 'min' => $product->min_order_qty];
            } elseif (! $item->saved_for_later && $product->max_order_qty !== null && ($perProduct[$product->id] ?? 0) > $product->max_order_qty) {
                $issues[] = ['item_id' => $item->id, 'code' => 'above_max_quantity', 'max' => $product->max_order_qty];
            } elseif ($item->unit_price_at_add !== $variant->listPrice()) {
                $issues[] = ['item_id' => $item->id, 'code' => 'price_changed', 'old_price' => $item->unit_price_at_add, 'new_price' => $variant->listPrice()];
            }
        }

        return $issues;
    }

    /** Issues that prevent checkout (a price change only needs acknowledgement via expected_total). */
    public function blockingIssues(Collection $items): array
    {
        return array_values(array_filter($this->issues($items), fn ($i) => $i['code'] !== 'price_changed'));
    }

    private function ownedItem(User $user, int $itemId): CartItem
    {
        return CartItem::query()->whereKey($itemId)
            ->whereHas('cart', fn ($q) => $q->where('user_id', $user->id))
            ->firstOrFail();
    }

    public function assertPurchasable(User $user, ?ProductVariant $variant): void
    {
        $product = $variant?->product;
        if (! $variant || ! $variant->is_active || ! $product || ! $product->isPublished()) {
            throw DomainException::of('PRODUCT_UNAVAILABLE', 422);
        }
        if ($product->is_vip_only) {
            $tier = $this->membership->currentTier($user);
            $required = $product->vipMinTier;
            $entry = $this->membership->entryTier();
            $allowed = $required ? ($tier && $tier->sort_order >= $required->sort_order) : ($tier && $tier->sort_order > $entry->sort_order);
            if (! $allowed) {
                throw DomainException::of('VIP_ONLY', 403);
            }
        }
    }

    private function assertQuantity(ProductVariant $variant, int $quantity): void
    {
        $max = $variant->product->max_order_qty ?? self::MAX_QTY_PER_LINE;
        if ($quantity < 1 || $quantity > $max) {
            throw DomainException::of('QUANTITY_INVALID', 422, ['max' => $max]);
        }
        if ($quantity > $variant->stock_quantity) {
            throw DomainException::of($variant->stock_quantity > 0 ? 'INSUFFICIENT_STOCK' : 'OUT_OF_STOCK', 422, [], ['available' => max(0, $variant->stock_quantity)]);
        }
    }

    /** The admin's per-product max counts every size/color of the product already in the cart. */
    private function assertProductMax(Cart $cart, ProductVariant $variant, int $newLineQty, ?int $lineItemId): void
    {
        $max = $variant->product->max_order_qty;
        if ($max === null) {
            return;
        }
        $others = (int) $cart->items()->where('saved_for_later', false)
            ->when($lineItemId, fn ($q) => $q->where('id', '!=', $lineItemId))
            ->whereHas('variant', fn ($q) => $q->where('product_id', $variant->product_id))
            ->sum('quantity');
        if ($others + $newLineQty > $max) {
            throw DomainException::of('ORDER_QTY_ABOVE_MAX', 422, ['max' => $max], ['max' => $max]);
        }
    }
}
