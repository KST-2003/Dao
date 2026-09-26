<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /** Uniform success shape for non-resource payloads. */
    protected function ok(mixed $data = null, int $status = 200, array $meta = []): \Illuminate\Http\JsonResponse
    {
        $body = ['data' => $data];
        if ($meta !== []) {
            $body['meta'] = $meta;
        }

        return response()->json($body, $status);
    }
}
