<?php

namespace App\Contracts;

use App\DTOs\StoredFile;
use Illuminate\Http\UploadedFile;

interface FileStorageInterface
{
    public function putImage(UploadedFile $file, string $directory): StoredFile;

    public function putVideo(UploadedFile $file, string $directory): StoredFile;

    public function delete(string $path): void;

    public function url(string $path): string;
}
