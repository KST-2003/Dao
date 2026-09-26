<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\DeliveryMethod;
use App\Exceptions\DomainException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CartItemRequest;
use App\Http\Requests\Api\CartQuantityRequest;
use App\Http\Requests\Api\QuoteRequest;
use App\Models\CartItem;
use App\Models\User;
use App\Services\Cart\CartService;
use App\Services\Loyalty\MembershipService;
use App\Services\Pricing\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        private readonly CartService $cart,
        private readonly PricingService $pricing,
        private readonly MembershipService $membership,
    ) {}

    public function show(Request $request): JsonResponse
    {
        return $this->ok($this->payload($request->user()));
    }

    public function add(CartItemRequest $request): JsonResponse
    {
        $this->cart->add($request->user(), (int) $request->input('variant_id'), (int) $request->input('quantity'));

        return $this->ok($this->payload($request->user()), 201);
    }

    public function update(CartQuantityRequest $request, int $itemId): JsonResponse
    {
        $this->cart->updateQuantity($request->user(), $itemId, (int) $request->input('quantity'));

        return $this->ok($this->payload($request->user()));
    }

    public function remove(Request $request, int $itemId): JsonResponse
    {
        $this->cart->remove($request->user(), $itemId);

        return $this->ok($this->payload($request->user()));
    }

    public function saveForLater(Request $request, int $itemId): JsonResponse
    {
        $this->cart->setSavedForLater($request->user(), $itemId, $request->boolean('saved', true));

        return $this->ok($this->payload($request->user()));
    }

    public function acceptPrice(Request $request, int $itemId): JsonResponse
    {
        $this->cart->acceptPrice($request->user(), $itemId);

        return $this->ok($this->payload($request->user()));
    }

    /** Store coupon/points on the cart after validating them against the current cart. */
    public function applyOptions(QuoteRequest $request): JsonResponse
    {
        $user = $request->user();
        $cart = $this->cart->load($user);
        $active = $cart->items->where('saved_for_later', false)->values();
        $code = $request->filled('coupon_code') ? strtoupper(trim((string) $request->input('coupon_code'))) : null;
        $points = (int) $request->input('points', 0);

        // Throws a DomainException with a precise code if the coupon/points are not valid.
        $this->pricing->quote($user, $active, $code, $points, DeliveryMethod::tryFrom((string) $request->input('delivery_method')) ?? DeliveryMethod::Standard);
        $cart->update(['coupon_code' => $code, 'points_to_redeem' => $points]);

        return $this->ok($this->payload($user));
    }

    private function payload(User $user): array
    {
        $cart = $this->cart->load($user);
        $tier = $this->membership->currentTier($user);
        $active = $cart->items->where('saved_for_later', false)->values();
        $issues = $this->cart->issues($cart->items);
        $blockedIds = collect($this->cart->blockingIssues($active))->pluck('item_id')->all();
        $valid = $active->reject(fn (CartItem $i) => in_array($i->id, $blockedIds, true))->values();

        $quote = null;
        $optionError = null;
        try {
            $quote = $this->pricing->quote($user, $valid, $cart->coupon_code, $cart->points_to_redeem, DeliveryMethod::Standard)->toArray();
        } catch (DomainException $e) {
            // A saved coupon/points choice became invalid (expired coupon, balance changed…). Report it; don't drop it.
            $optionError = ['code' => $e->errorCode, 'message' => $e->getMessage()];
            $quote = $this->pricing->quote($user, $valid, null, 0, DeliveryMethod::Standard)->toArray();
        }

        return [
            'items' => $active->map(fn (CartItem $i) => $this->item($i, $tier))->values(),
            'saved_for_later' => $cart->items->where('saved_for_later', true)->map(fn (CartItem $i) => $this->item($i, $tier))->values(),
            'issues' => $issues,
            'coupon_code' => $cart->coupon_code,
            'points_to_redeem' => $cart->points_to_redeem,
            'option_error' => $optionError,
            'quote' => $quote,
            'can_checkout' => $valid->isNotEmpty() && count($blockedIds) === 0,
        ];
    }

    private function item(CartItem $item, $tier): array
    {
        $variant = $item->variant;
        $product = $variant?->product;
        $line = $variant && $product ? $this->pricing->priceLine($variant, $item->quantity, $tier) : null;
        $image = $product?->images->firstWhere('color', $variant?->color) ?? $product?->images->first();

        return [
            'id' => $item->id,
            'variant_id' => $item->product_variant_id,
            'product_id' => $product?->id,
            'name' => $product?->translated('name'),
            'image_url' => $image?->thumbnail_url ?? $image?->url,
            'size' => $variant?->size,
            'color' => $variant?->color,
            'variant_label' => $variant?->label(),
            'quantity' => $item->quantity,
            'unit_price' => $line?->listUnitPrice,
            'member_unit_price' => $line?->memberUnitPrice,
            'line_total' => $line?->netTotal(),
            'max_quantity' => min(CartService::MAX_QTY_PER_LINE, max(0, (int) $variant?->stock_quantity)),
            'saved_for_later' => $item->saved_for_later,
        ];
    }
}
