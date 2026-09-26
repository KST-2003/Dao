<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Banner */
class BannerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'image_url' => $this->image_url,
            'eyebrow' => $this->translated('eyebrow'),
            'title' => $this->translated('title'),
            'subtitle' => $this->translated('subtitle'),
            'cta_label' => $this->translated('cta_label'),
            'link' => $this->link_type ? ['type' => $this->link_type, 'value' => $this->link_value] : null,
            'theme' => $this->theme,
        ];
    }
}
