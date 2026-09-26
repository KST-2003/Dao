<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\MembershipTier */
class MembershipTierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = app()->getLocale();
        $benefits = null;
        foreach (\App\Enums\Locale::fallbackChain($locale) as $l) {
            $benefits = $this->translations->firstWhere('locale', $l)?->benefits;
            if (! empty($benefits)) {
                break;
            }
        }

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->translated('name'),
            'description' => $this->translated('description'),
            'benefits' => $benefits ?? [],
            'min_points' => $this->min_points,
            'min_spend' => $this->min_spend,
            'discount_percent' => (float) $this->discount_percent,
            'points_multiplier' => (float) $this->points_multiplier,
            'free_shipping' => $this->free_shipping,
            'early_access' => $this->early_access,
            'badge_icon' => $this->badge_icon,
            'color' => $this->color,
            'sort_order' => $this->sort_order,
        ];
    }
}
