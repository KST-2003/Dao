<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\BroadcastRequest;
use App\Jobs\SendBroadcastNotification;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;

class NotificationController extends AdminController
{
    public function index(): JsonResponse
    {
        return $this->paginated(
            AuditLog::query()->where('action', 'notification.broadcast')->with('admin:id,name')->latest('id')->paginate($this->perPage()),
            fn (AuditLog $log) => ['id' => $log->id, 'admin' => $log->admin?->name, 'payload' => $log->changes, 'created_at' => $log->created_at?->toIso8601String()],
        );
    }

    public function broadcast(BroadcastRequest $request): JsonResponse
    {
        SendBroadcastNotification::dispatch(
            (string) $request->input('type'),
            $request->input('content'),
            $request->input('tier_ids'),
            $request->filled('route') ? ['route' => (string) $request->input('route')] : [],
        );
        $this->audit('notification.broadcast', null, $request->validated());

        return response()->json(['data' => ['queued' => true]], 202);
    }
}
