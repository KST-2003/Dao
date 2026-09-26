<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\DomainException;
use App\Http\Requests\Admin\TierRequest;
use App\Models\MembershipTier;
use App\Models\UserMembership;
use Illuminate\Database\Eloquent\Model;

/** Tiers are fully admin-defined. Changing thresholds applies at each member's next recalculation. */
class MembershipTierController extends TranslatedCrudController
{
    protected function model(): string
    {
        return MembershipTier::class;
    }

    protected function request(): string
    {
        return TierRequest::class;
    }

    protected function auditName(): string
    {
        return 'membership_tier';
    }

    protected function beforeDelete(Model $model): void
    {
        if (UserMembership::query()->where('membership_tier_id', $model->id)->exists()) {
            throw DomainException::of('TIER_IN_USE', 409);
        }
    }

    protected function present(Model $model): array
    {
        return $this->withTranslations($model, [
            'members' => UserMembership::query()->where('membership_tier_id', $model->id)->count(),
        ]);
    }
}
