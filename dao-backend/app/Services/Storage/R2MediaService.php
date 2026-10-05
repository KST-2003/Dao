<?php

namespace App\Services\Storage;

use App\Contracts\MediaStorageInterface;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Str;

/**
 * Requires an S3-compatible disk (R2 in production). The local "public" disk doesn't support
 * presigned URLs at all — there's no local-dev fallback here, by design: a direct-to-bucket
 * upload only makes sense against a real bucket.
 */
class R2MediaService implements MediaStorageInterface
{
    public function __construct(
        private readonly Filesystem $disk,
        private readonly string $publicBaseUrl,
    ) {}

    public function makeKey(string $folder, int|string $owner, string $extension): string
    {
        return sprintf('%s/%s/%s.%s', trim($folder, '/'), $owner, (string) Str::uuid(), ltrim($extension, '.'));
    }

    public function createUploadUrl(string $key, string $contentType): string
    {
        return $this->disk->temporaryUploadUrl($key, now()->addMinutes(10), ['ContentType' => $contentType])['url'];
    }

    public function getMediaUrl(?string $key): ?string
    {
        if ($key === null || $key === '') {
            return null;
        }
        if (str_starts_with($key, 'http://') || str_starts_with($key, 'https://')) {
            return $key; // demo seed data, or a Google/LINE avatar photo — already a real URL
        }
        if ($this->publicBaseUrl !== '') {
            return rtrim($this->publicBaseUrl, '/').'/'.ltrim($key, '/');
        }

        return $this->disk->temporaryUrl($key, now()->addHours(6));
    }

    public function getMediaUrls(array $keys): array
    {
        $urls = [];
        foreach ($keys as $key) {
            $urls[(string) $key] = $this->getMediaUrl($key);
        }

        return $urls;
    }

    public function delete(string $key): void
    {
        if (str_starts_with($key, 'http://') || str_starts_with($key, 'https://')) {
            return; // external, not ours to delete
        }
        $this->disk->delete($key);
    }

    public function normalizeKey(?string $value): ?string
    {
        if ($value === null || ! str_starts_with($value, 'http')) {
            return $value;
        }

        foreach ($this->ownBaseUrls() as $base) {
            if ($base !== '' && str_starts_with($value, $base.'/')) {
                return strtok(substr($value, strlen($base) + 1), '?'); // drop the query string (signature etc.)
            }
        }

        return $value; // a genuinely external URL (demo data, a Google/LINE avatar photo)
    }

    /** @return list<string> */
    private function ownBaseUrls(): array
    {
        $endpoint = rtrim((string) config('filesystems.disks.r2.endpoint'), '/');
        $bucket = (string) config('filesystems.disks.r2.bucket');

        return array_values(array_filter([
            rtrim($this->publicBaseUrl, '/'),
            $endpoint !== '' && $bucket !== '' ? $endpoint.'/'.$bucket : '',
        ]));
    }
}
