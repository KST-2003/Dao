<?php

namespace App\Http\Controllers\Admin;

use App\Contracts\MediaStorageInterface;
use App\Http\Requests\Admin\AdminProfileRequest;
use App\Http\Requests\Admin\AvatarPresignRequest;
use Illuminate\Http\JsonResponse;

/** An admin's own display name and profile picture. */
class ProfileController extends AdminController
{
    public function update(AdminProfileRequest $request): JsonResponse
    {
        $admin = $this->admin();
        $admin->fill($request->safe()->only(['name']));
        if ($request->has('avatar_url')) {
            $admin->avatar_url = $request->input('avatar_url');
        }
        $admin->save();
        $this->audit('admin.profile_updated', $admin, ['name' => $admin->name, 'avatar' => $request->has('avatar_url')]);

        return response()->json(['data' => ['id' => $admin->id, 'name' => $admin->name, 'avatar_url' => $admin->avatar_url]]);
    }

    public function presignAvatar(AvatarPresignRequest $request, MediaStorageInterface $media): JsonResponse
    {
        $contentType = (string) $request->input('content_type');
        $key = $media->makeKey('avatars', $this->admin()->id, str($contentType)->after('/')->toString());

        return response()->json(['data' => [
            'upload_url' => $media->createUploadUrl($key, $contentType), 'key' => $key, 'url' => $media->getMediaUrl($key),
        ]], 201);
    }
}
