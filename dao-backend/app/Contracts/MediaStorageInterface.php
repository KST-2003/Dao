<?php

namespace App\Contracts;

/**
 * Photos/videos never pass through the app server. The client asks for a presigned PUT,
 * uploads straight to R2, and gives the app the key back to store. Reading is symmetric:
 * the app never stores a usable URL, only the key — resolved to a URL on demand by
 * getMediaUrl() (see App\Casts\MediaUrl, which is how every *_url column resolves this
 * transparently without each caller needing to know about it).
 */
interface MediaStorageInterface
{
    /** Server-generated key — never trust one supplied by the client. */
    public function makeKey(string $folder, int|string $owner, string $extension): string;

    /** Presigned PUT, expires in 10 minutes. $contentType is bound into the signature. */
    public function createUploadUrl(string $key, string $contentType): string;

    /**
     * A key already looks like a full URL (http:// or https://) for a few legacy/external
     * cases — demo seed data, and Google/LINE's own avatar photos at sign-in — so it's
     * returned unchanged. Otherwise: the bucket's public base URL if one is configured, else
     * a presigned GET (expires in 6 hours).
     */
    public function getMediaUrl(?string $key): ?string;

    /** @param list<string|null> $keys @return array<string, string|null> keyed by the original key */
    public function getMediaUrls(array $keys): array;

    public function delete(string $key): void;

    /**
     * If $value is actually one of our own resolved URLs — an admin form round-tripping a
     * record it fetched without touching the image, say — recover the bare key instead of
     * writing back a URL that will eventually stop resolving. Anything else (a real key,
     * or a genuinely external URL) passes through unchanged.
     */
    public function normalizeKey(?string $value): ?string;
}
