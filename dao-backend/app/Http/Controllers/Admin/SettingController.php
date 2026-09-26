<?php

namespace App\Http\Controllers\Admin;

use App\Services\Settings\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Business rules: point earning/redemption, referral rewards, shipping fees, bank details. */
class SettingController extends AdminController
{
    public function index(SettingsService $settings): JsonResponse
    {
        return response()->json(['data' => $settings->all()]);
    }

    public function update(Request $request, SettingsService $settings): JsonResponse
    {
        $int = ['nullable', 'integer', 'min:0', 'max:100000000'];
        $data = $request->validate([
            'loyalty.signup_bonus' => $int,
            'loyalty.earn_spend_unit' => ['nullable', 'integer', 'min:1'],
            'loyalty.earn_points_per_unit' => $int,
            'loyalty.review_bonus' => $int,
            'loyalty.photo_review_bonus' => $int,
            'loyalty.birthday_bonus' => $int,
            'loyalty.redeem_points_unit' => ['nullable', 'integer', 'min:1'],
            'loyalty.redeem_value_per_unit' => $int,
            'loyalty.redeem_min_points' => $int,
            'loyalty.redeem_max_percent' => ['nullable', 'integer', 'between:0,100'],
            'loyalty.expiry_months' => ['nullable', 'integer', 'between:0,120'],
            'referral.referrer_bonus' => $int,
            'referral.referee_bonus' => $int,
            'referral.min_order_total' => $int,
            'shipping.standard_fee' => $int,
            'shipping.express_fee' => $int,
            'shipping.free_threshold' => $int,
            'payments.bank_transfer' => ['nullable', 'array'],
            'payments.bank_transfer.bank_name' => ['nullable', 'string', 'max:100'],
            'payments.bank_transfer.account_name' => ['nullable', 'string', 'max:120'],
            'payments.bank_transfer.account_number' => ['nullable', 'string', 'max:40'],
            'payments.bank_transfer.promptpay_id' => ['nullable', 'string', 'max:40'],
        ]);
        // Dotted keys arrive nested; flatten back to the settings key format.
        $flat = [];
        foreach (array_keys(config('dao.default_settings')) as $key) {
            if (data_get($data, $key) !== null) {
                $flat[$key] = data_get($data, $key);
            }
        }
        $before = array_intersect_key($settings->all(), $flat);
        $settings->set($flat, $this->admin());
        $this->audit('settings.updated', null, ['old' => $before, 'new' => $flat]);

        return response()->json(['data' => $settings->all()]);
    }
}
