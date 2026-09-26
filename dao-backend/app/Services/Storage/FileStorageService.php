<?php

namespace App\Services\Storage;

use App\Contracts\FileStorageInterface;
use App\DTOs\StoredFile;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

/**
 * Uploads to the configured disk (public locally, R2/S3 in production).
 * Images get a 640px WebP thumbnail (GD) for fast list rendering.
 * Videos are stored as uploaded; transcoding to HLS is a future pipeline step.
 */
class FileStorageService implements FileStorageInterface
{
    public function __construct(
        private readonly Filesystem $disk,
        private readonly string $publicBaseUrl,
    ) {}

    public function putImage(UploadedFile $file, string $directory): StoredFile
    {
        $path = $this->disk->putFileAs($directory, $file, Str::uuid().'.'.$file->extension(), 'public');
        $thumbUrl = null;

        $thumb = $this->thumbnail($file->getRealPath(), 640);
        if ($thumb !== null) {
            $thumbPath = $directory.'/thumbs/'.pathinfo($path, PATHINFO_FILENAME).'.webp';
            $this->disk->put($thumbPath, $thumb, 'public');
            $thumbUrl = $this->url($thumbPath);
        }

        return new StoredFile($path, $this->url($path), $thumbUrl, $file->getMimeType(), (int) $file->getSize());
    }

    public function putVideo(UploadedFile $file, string $directory): StoredFile
    {
        $path = $this->disk->putFileAs($directory, $file, Str::uuid().'.'.$file->extension(), 'public');

        return new StoredFile($path, $this->url($path), null, $file->getMimeType(), (int) $file->getSize());
    }

    public function delete(string $path): void
    {
        $this->disk->delete($path);
    }

    public function url(string $path): string
    {
        return $this->publicBaseUrl !== ''
            ? rtrim($this->publicBaseUrl, '/').'/'.ltrim($path, '/')
            : $this->disk->url($path);
    }

    private function thumbnail(string $source, int $width): ?string
    {
        if (! function_exists('imagecreatefromstring') || ! function_exists('imagewebp')) {
            return null;
        }
        $raw = @file_get_contents($source);
        $image = $raw !== false ? @imagecreatefromstring($raw) : false;
        if ($image === false) {
            return null;
        }
        $scaled = imagesx($image) > $width ? imagescale($image, $width) : $image;
        ob_start();
        imagewebp($scaled, null, 80);
        $data = (string) ob_get_clean();
        imagedestroy($image);

        return $data !== '' ? $data : null;
    }
}
