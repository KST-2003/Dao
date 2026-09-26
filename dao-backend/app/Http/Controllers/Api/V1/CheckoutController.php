<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\PlaceOrderData;
use App\Enums\DeliveryMethod;
use App\Exceptions\DomainException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\PlaceOrderRequest;
use App\Http\Requests\Api\QuoteRequest;
use App\Http\Resources\Api\OrderResource;
use App\Services\Cart\CartService;
use App\Services\Orders\CheckoutService;
use App\Services\Payments\PaymentManager;
use App\Services\Settings\SettingsService;
use App\Services\Pricing\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function options(PaymentManager $payments, SettingsService $settings): JsonResponse
    {
        return $this->ok([
            'payment_methods' => array_map(fn ($g) => $g->method()->value, $payments->available()),
            'delivery_methods' => collect(DeliveryMethod::cases())->map(fn (DeliveryMethod $d) => [
                'code' => $d->value, 'fee' => $settings->int($d->feeSettingKey()),
            ]),
        ]);
    }

    /** Authoritative totals for the checkout screen. */
    public function quote(QuoteRequest $request, CartService $cart, PricingService $pricing): JsonResponse
    {
        $user = $request->user();
        $items = $cart->load($user)->items->where('saved_for_later', false)->values();
        if ($items->isEmpty()) {
            throw DomainException::of('CART_EMPTY', 422);
        }
        $issues = $cart->blockingIssues($items);
        if ($issues !== []) {
            throw DomainException::of('CART_INVALID', 422, [], ['issues' => $issues]);
        }
        $quote = $pricing->quote(
            $user, $items,
            $request->filled('coupon_code') ? (string) $request->input('coupon_code') : null,
            (int) $request->input('points', 0),
            DeliveryMethod::tryFrom((string) $request->input('delivery_method')) ?? DeliveryMethod::Standard,
        );

        return $this->ok($quote->toArray());
    }

    public function placeOrder(PlaceOrderRequest $request, CheckoutService $checkout): JsonResponse
    {
        $result = $checkout->placeOrder($request->user(), PlaceOrderData::fromArray($request->validated()));

        return $this->ok([
            'order' => new OrderResource($result['order']->load(['items', 'statusHistory'])),
            'payment' => $result['payment']->toArray(),
        ], 201);
    }
}
