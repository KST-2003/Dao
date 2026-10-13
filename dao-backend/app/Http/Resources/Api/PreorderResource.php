<?php

namespace App\Http\Resources\Api;

use App\Enums\PreorderStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Preorder */
class PreorderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'preorder_number' => $this->preorder_number,
            'status' => $this->status->value,
            'destination' => $this->destination->value,
            // Happy-path steps for this destination, so the app never hardcodes the flow.
            'steps' => array_map(fn (PreorderStatus $s) => $s->value, PreorderStatus::path($this->destination)),
            'currency' => $this->currency,
            'subtotal' => $this->subtotal,
            'member_discount' => $this->member_discount,
            'shipping_fee' => $this->shipping_fee,
            'grand_total' => $this->grand_total,
            // Shipping is confirmed at approval; until then the total is an estimate.
            'is_estimate' => $this->order_id === null,
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
            'timeline' => $this->whenLoaded('statusHistory', fn () => $this->statusHistory->map(fn ($h) => [
                'status' => $h->to_status, 'at' => $h->created_at?->toIso8601String(),
            ])->values()),
            'reject_reason' => $this->reject_reason,
            'carrier' => $this->carrier,
            'tracking_number' => $this->tracking_number,
            'notes' => $this->notes,
            'can_cancel' => $this->status->isCancellable(),
            'can_pay' => $this->status === PreorderStatus::WaitingPayment && $this->order_id !== null,
            'order_id' => $this->order_id,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
        ];
    }
}
