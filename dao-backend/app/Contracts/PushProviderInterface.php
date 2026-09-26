<?php

namespace App\Contracts;

interface PushProviderInterface
{
    /**
     * @param  list<string>  $tokens
     * @param  array<string, mixed>  $data
     * @return list<string> tokens the provider reported as invalid (to be pruned)
     */
    public function send(array $tokens, string $title, string $body, array $data = []): array;
}
