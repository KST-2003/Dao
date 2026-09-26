<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status->value,
            'payment_status' => $this->payment_status->value,
            'payment_method' => $this->payment_method->value,
            'delivery_method' => $this->delivery_method->value,
            'currency' => $this->currency,
            'subtotal' => $this->subtotal,
            'member_discount' => $this->member_discount,
            'coupon_code' => $this->coupon_code,
            'coupon_discount' => $this->coupon_discount,
            'points_redeemed' => $this->points_redeemed,
            'points_discount' => $this->points_discount,
            'points_earned' => $this->points_earned,
            'shipping_fee' => $this->shipping_fee,
            'grand_total' => $this->grand_total,
            'item_count' => $this->whenLoaded('items', fn () => (int) $this->items->sum('quantity')),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($i) => [
                'id' => $i->id,
                'product_id' => $i->product_id,
                'variant_id' => $i->product_variant_id,
                'name' => $i->product_name,
                'variant_label' => $i->variant_label,
                'image_url' => $i->image_url,
                'unit_price' => $i->unit_price,
                'original_unit_price' => $i->original_unit_price,
                'quantity' => $i->quantity,
                'line_total' => $i->line_total,
            ])->values()),
            'shipping_address' => $this->shipping_address,
            'shipment' => $this->whenLoaded('shipment', fn () => $this->shipment ? [
                'carrier' => $this->shipment->carrier,
                'tracking_number' => $this->shipment->tracking_number,
                'tracking_url' => $this->shipment->tracking_url,
                'status' => $this->shipment->status->value,
                'shipped_at' => $this->shipment->shipped_at?->toIso8601String(),
                'delivered_at' => $this->shipment->delivered_at?->toIso8601String(),
            ] : null),
            'timeline' => $this->whenLoaded('statusHistory', fn () => $this->statusHistory->map(fn ($h) => [
                'status' => $h->to_status, 'at' => $h->created_at?->toIso8601String(),
            ])->values()),
            'can_cancel' => $this->status->value === 'pending_payment'
                || ($this->status->value === 'processing' && $this->payment_status->value !== 'succeeded'),
            'notes' => $this->notes,
            'placed_at' => $this->placed_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
        ];
    }
}
