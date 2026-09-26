<?php

namespace App\Http\Controllers\Admin;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends AdminController
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()->with('admin:id,name,email')
            ->when($request->filled('action'), fn ($q) => $q->where('action', 'like', $this->like((string) $request->input('action'))))
            ->when($request->filled('admin_user_id'), fn ($q) => $q->where('admin_user_id', $request->integer('admin_user_id')))
            ->latest('id');

        return $this->paginated($query->paginate($this->perPage()), fn (AuditLog $log) => [
            'id' => $log->id,
            'admin' => $log->admin?->only(['id', 'name', 'email']),
            'action' => $log->action,
            'subject' => $log->auditable_type ? $log->auditable_type.':'.$log->auditable_id : null,
            'changes' => $log->changes,
            'reason' => $log->reason,
            'ip' => $log->ip,
            'created_at' => $log->created_at?->toIso8601String(),
        ]);
    }
}
