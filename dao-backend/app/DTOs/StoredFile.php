<?php

namespace App\DTOs;

final readonly class StoredFile
{
    public function __construct(
        public string $path,
        public string $url,
        public ?string $thumbnailUrl = null,
        public ?string $mime = null,
        public int $size = 0,
    ) {}

    public function toArray(): array
    {
        return ['path' => $this->path, 'url' => $this->url, 'thumbnail_url' => $this->thumbnailUrl, 'mime' => $this->mime, 'size' => $this->size];
    }
}
