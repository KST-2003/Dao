<?php

namespace App\Services\Audit;

use App\Models\AdminUser;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

/** Every admin write goes through here. Rows are never updated or deleted. */
class AuditLogger
{
    /**
     * @param  array<string, mixed>|null  $changes
     */
    public function log(?AdminUser $admin, string $action, ?Model $subject = null, ?array $changes = null, ?string $reason = null): AuditLog
    {
        $request = request();

        return AuditLog::query()->create([
            'admin_user_id' => $admin?->id,
            'action' => $action,
            'auditable_type' => $subject?->getMorphClass(),
            'auditable_id' => $subject?->getKey(),
            'changes' => $changes,
            'reason' => $reason,
            'ip' => $request?->ip(),
            'user_agent' => substr((string) $request?->userAgent(), 0, 255),
        ]);
    }

    /** Diff helper: only fields that actually changed, secrets stripped. */
    public function diff(Model $model): array
    {
        $changes = [];
        foreach ($model->getChanges() as $key => $new) {
            if (in_array($key, ['password', 'remember_token', 'updated_at'], true)) {
                continue;
            }
            $changes[$key] = ['old' => $model->getOriginal($key), 'new' => $new];
        }

        return $changes;
    }
}
