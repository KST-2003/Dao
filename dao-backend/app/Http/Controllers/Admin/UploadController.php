<?php

namespace App\Http\Controllers\Admin;

use App\Contracts\FileStorageInterface;
use App\Http\Requests\Admin\UploadRequest;
use Illuminate\Http\JsonResponse;

/** Validated image/video uploads to the configured disk (R2/S3 in production). Returns the public URL. */
class UploadController extends AdminController
{
    public function __invoke(UploadRequest $request, FileStorageInterface $files): JsonResponse
    {
        $file = $request->file('file');
        $folder = (string) $request->input('folder');
        $stored = $request->input('kind') === 'video' ? $files->putVideo($file, $folder) : $files->putImage($file, $folder);
        $this->audit('upload.created', null, ['path' => $stored->path, 'size' => $stored->size]);

        return response()->json(['data' => $stored->toArray()], 201);
    }
}
