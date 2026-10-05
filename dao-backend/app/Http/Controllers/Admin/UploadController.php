<?php

namespace App\Http\Controllers\Admin;

use App\Contracts\MediaStorageInterface;
use App\Http\Requests\Admin\UploadRequest;
use Illuminate\Http\JsonResponse;

/**
 * Presigns a direct-to-R2 upload; the file never passes through this server. Returns the
 * key to store (and a ready-to-use preview URL, so the admin UI doesn't need a second
 * round-trip to show what was just uploaded).
 *
 * Content type and max size (config('dao.uploads')) are validated before issuing the URL,
 * and content type is bound into the presigned URL's signature — but size itself isn't
 * cryptographically enforced by a presigned PUT, only checked here at request time.
 */
class UploadController extends AdminController
{
    public function __invoke(UploadRequest $request, MediaStorageInterface $media): JsonResponse
    {
        $contentType = (string) $request->input('content_type');
        $ext = str($contentType)->after('/')->toString();
        $key = $media->makeKey((string) $request->input('folder'), $this->admin()->id, $ext);
        $uploadUrl = $media->createUploadUrl($key, $contentType);
        $this->audit('upload.presigned', null, ['key' => $key]);

        return response()->json(['data' => ['upload_url' => $uploadUrl, 'key' => $key, 'url' => $media->getMediaUrl($key)]], 201);
    }
}
