<?php

namespace App\Services\Catalog;

use App\Enums\InventoryReason;
use App\Exceptions\DomainException;
use App\Models\AdminUser;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/** Variant-level stock with an append-only movement ledger. */
class InventoryService
{
    /** Caller must already hold a row lock on the variant (lockForUpdate) inside a transaction. */
    public function decrementLocked(ProductVariant $variant, int $quantity, Model $reference): void
    {
        if ($variant->stock_quantity < $quantity) {
            throw DomainException::of('INSUFFICIENT_STOCK', 422, [], ['variant_id' => $variant->id, 'available' => $variant->stock_quantity]);
        }
        $this->apply($variant, -$quantity, InventoryReason::OrderPlaced, $reference);
    }

    public function restoreForOrder(Order $order, InventoryReason $reason): void
    {
        DB::transaction(function () use ($order, $reason) {
            foreach ($order->items as $item) {
                if (! $item->product_variant_id) {
                    continue;
                }
                $variant = ProductVariant::withTrashed()->whereKey($item->product_variant_id)->lockForUpdate()->first();
                if ($variant) {
                    $this->apply($variant, $item->quantity, $reason, $order);
                }
            }
        });
    }

    public function adjust(ProductVariant $variant, int $change, InventoryReason $reason, AdminUser $admin, ?string $note): InventoryMovement
    {
        return DB::transaction(function () use ($variant, $change, $reason, $admin, $note) {
            $locked = ProductVariant::query()->whereKey($variant->id)->lockForUpdate()->firstOrFail();
            if ($locked->stock_quantity + $change < 0) {
                throw DomainException::of('STOCK_CANNOT_BE_NEGATIVE', 422);
            }

            return $this->apply($locked, $change, $reason, null, $admin, $note);
        });
    }

    private function apply(ProductVariant $variant, int $change, InventoryReason $reason, ?Model $reference = null, ?AdminUser $admin = null, ?string $note = null): InventoryMovement
    {
        $variant->stock_quantity += $change;
        $variant->save();

        return InventoryMovement::query()->create([
            'product_variant_id' => $variant->id,
            'quantity_change' => $change,
            'stock_after' => $variant->stock_quantity,
            'reason' => $reason,
            'reference_type' => $reference?->getMorphClass(),
            'reference_id' => $reference?->getKey(),
            'admin_user_id' => $admin?->id,
            'note' => $note,
        ]);
    }
}
