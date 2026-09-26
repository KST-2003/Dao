<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return NotificationResource::collection($user->appNotifications()->latest('id')->paginate(20))
            ->additional(['meta' => ['unread' => $user->appNotifications()->whereNull('read_at')->count()]])
            ->response();
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $request->user()->appNotifications()->whereKey($id)->whereNull('read_at')->update(['read_at' => now()]);

        return $this->ok(['read' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->appNotifications()->whereNull('read_at')->update(['read_at' => now()]);

        return $this->ok(['read' => true]);
    }
}
