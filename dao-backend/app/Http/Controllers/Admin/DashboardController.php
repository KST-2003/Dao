<?php

namespace App\Http\Controllers\Admin;

use App\Services\Admin\DashboardService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DashboardController extends AdminController
{
    public function __invoke(Request $request, DashboardService $dashboard): JsonResponse
    {
        $data = $request->validate([
            'range' => ['nullable', Rule::in(['today', '7d', '30d', '90d', 'custom'])],
            'from' => ['required_if:range,custom', 'nullable', 'date'],
            'to' => ['required_if:range,custom', 'nullable', 'date', 'after_or_equal:from'],
        ]);
        $now = CarbonImmutable::now();
        [$from, $to] = match ($data['range'] ?? '30d') {
            'today' => [$now->startOfDay(), $now],
            '7d' => [$now->subDays(7), $now],
            '90d' => [$now->subDays(90), $now],
            'custom' => [CarbonImmutable::parse($data['from'])->startOfDay(), CarbonImmutable::parse($data['to'])->endOfDay()],
            default => [$now->subDays(30), $now],
        };

        return response()->json(['data' => $dashboard->metrics($from, $to)]);
    }
}
