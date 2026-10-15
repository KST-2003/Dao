<?php

namespace App\Services\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\UserMembership;
use App\Models\Video;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function metrics(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $paid = Order::query()->where('payment_status', PaymentStatus::Succeeded->value)->whereBetween('paid_at', [$from, $to]);

        return [
            'range' => ['from' => $from->toIso8601String(), 'to' => $to->toIso8601String()],
            // Orders can be in THB or MMK; revenue is always reported in THB (each order converted at its own rate).
            'revenue' => (int) round((float) (clone $paid)->sum(DB::raw('grand_total / exchange_rate'))),
            'orders' => Order::query()->whereBetween('placed_at', [$from, $to])->count(),
            'paid_orders' => (clone $paid)->count(),
            'customers' => User::query()->count(),
            'new_customers' => User::query()->whereBetween('created_at', [$from, $to])->count(),
            'pending_orders' => Order::query()->whereIn('status', [OrderStatus::PendingPayment->value, OrderStatus::Paid->value, OrderStatus::Processing->value, OrderStatus::Packing->value])->count(),
            'points_issued' => (int) LoyaltyTransaction::query()->where('points', '>', 0)->whereBetween('created_at', [$from, $to])->sum('points'),
            'points_redeemed' => (int) -LoyaltyTransaction::query()->where('type', 'redeemed')->whereBetween('created_at', [$from, $to])->sum('points'),
            'video_views' => (int) Video::query()->sum('view_count'),
            'revenue_by_day' => (clone $paid)->selectRaw('DATE(paid_at) as day, SUM(grand_total / exchange_rate) as revenue, COUNT(*) as orders')
                ->groupBy('day')->orderBy('day')->get()->map(fn ($r) => ['day' => $r->day, 'revenue' => (int) round((float) $r->revenue), 'orders' => (int) $r->orders]),
            'top_products' => OrderItem::query()
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.payment_status', PaymentStatus::Succeeded->value)->whereBetween('orders.paid_at', [$from, $to])
                ->selectRaw('order_items.product_id, MAX(order_items.product_name) as name, SUM(order_items.quantity) as units, SUM(order_items.line_total / orders.exchange_rate) as revenue')
                ->groupBy('order_items.product_id')->orderByDesc('units')->limit(5)->get()
                ->map(fn ($r) => ['product_id' => $r->product_id, 'name' => $r->name, 'units' => (int) $r->units, 'revenue' => (int) round((float) $r->revenue)]),
            'low_stock' => ProductVariant::query()->with('product.translations')->where('is_active', true)
                ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')->orderBy('stock_quantity')->limit(10)->get()
                ->map(fn (ProductVariant $v) => ['variant_id' => $v->id, 'product_id' => $v->product_id, 'name' => $v->product?->translated('name'), 'label' => $v->label(), 'sku' => $v->sku, 'stock' => $v->stock_quantity]),
            'membership_distribution' => UserMembership::query()
                ->join('membership_tiers', 'membership_tiers.id', '=', 'user_memberships.membership_tier_id')
                ->select('membership_tiers.code', DB::raw('COUNT(*) as members'))
                ->groupBy('membership_tiers.code', 'membership_tiers.sort_order')->orderBy('membership_tiers.sort_order')->get(),
        ];
    }
}
