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
use App\Services\Currency\CurrencyService;
use App\Services\Payments\PaymentManager;
use App\Services\Settings\SettingsService;
use App\Services\Pricing\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    /**
     * Payment methods that can take the customer's currency, and the delivery methods for the chosen address's country
     * (Thailand: standard/express; Myanmar: air/land cargo) with their fees in that currency.
     */
    public function options(Request $request, PaymentManager $payments, PricingService $pricing, CurrencyService $currencies): JsonResponse
    {
        $user = $request->user();
        $address = $request->filled('address_id')
            ? $user->addresses()->find((int) $request->input('address_id'))
            : $user->addresses()->orderByDesc('is_default')->first();
        $country = $address?->country_code ?? 'TH';
        $currency = $currencies->current();

        return $this->ok([
            'payment_methods' => array_map(fn ($g) => $g->method()->value, $payments->available($currency->value)),
            'country' => $country,
            'delivery_methods' => collect(DeliveryMethod::forCountry($country))->map(fn (DeliveryMethod $d) => [
                'code' => $d->value, 'fee' => $pricing->shippingFee($d, $currency),
            ])->values(),
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
