<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InventoryReason;
use App\Http\Requests\Admin\InventoryAdjustRequest;
use App\Models\InventoryMovement;
use App\Models\ProductVariant;
use App\Services\Catalog\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $query = ProductVariant::query()->with('product.translations')
            ->when($request->boolean('low_stock'), fn ($q) => $q->whereColumn('stock_quantity', '<=', 'low_stock_threshold'))
            ->when($request->filled('q'), fn ($q) => $q->where(fn ($w) => $w
                ->where('sku', 'like', $this->like((string) $request->input('q')))
                ->orWhereHas('product.translations', fn ($t) => $t->where('name', 'like', $this->like((string) $request->input('q'))))))
            ->orderBy('stock_quantity');

        return $this->paginated($query->paginate($this->perPage()), fn (ProductVariant $v) => [
            'id' => $v->id,
            'product_id' => $v->product_id,
            'product_name' => $v->product?->translated('name'),
            'sku' => $v->sku,
            'label' => $v->label(),
            'stock_quantity' => $v->stock_quantity,
            'low_stock_threshold' => $v->low_stock_threshold,
            'is_low' => $v->stock_quantity <= $v->low_stock_threshold,
            'is_active' => $v->is_active,
        ]);
    }

    public function adjust(InventoryAdjustRequest $request, InventoryService $inventory): JsonResponse
    {
        $variant = ProductVariant::query()->findOrFail($request->integer('variant_id'));
        $movement = $inventory->adjust($variant, $request->integer('change'), InventoryReason::from((string) $request->input('reason')), $this->admin(), (string) $request->input('note'));
        $this->audit('inventory.adjusted', $variant, ['change' => $movement->quantity_change, 'stock_after' => $movement->stock_after], (string) $request->input('note'));

        return response()->json(['data' => $movement], 201);
    }

    public function movements(int $variantId): JsonResponse
    {
        return $this->paginated(
            InventoryMovement::query()->where('product_variant_id', $variantId)->with('variant')->latest('id')->paginate($this->perPage()),
            fn (InventoryMovement $m) => $m->toArray(),
        );
    }
}
