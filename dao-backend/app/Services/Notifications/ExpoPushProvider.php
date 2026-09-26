<?php

namespace App\Services\Notifications;

use App\Contracts\PushProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/** Expo Push Service (works for both iOS/APNs and Android/FCM through Expo). */
class ExpoPushProvider implements PushProviderInterface
{
    public function __construct(private readonly ?string $accessToken) {}

    public function send(array $tokens, string $title, string $body, array $data = []): array
    {
        $invalid = [];
        foreach (array_chunk($tokens, 100) as $chunk) {
            $messages = array_map(fn ($t) => ['to' => $t, 'title' => $title, 'body' => $body, 'data' => $data, 'sound' => 'default'], $chunk);
            $request = Http::acceptJson()->timeout(15);
            if ($this->accessToken) {
                $request = $request->withToken($this->accessToken);
            }
            $response = $request->post('https://exp.host/--/api/v2/push/send', $messages);
            if ($response->failed()) {
                Log::warning('expo.push_failed', ['status' => $response->status()]);

                continue;
            }
            foreach ((array) $response->json('data') as $i => $ticket) {
                if (($ticket['status'] ?? null) === 'error' && ($ticket['details']['error'] ?? null) === 'DeviceNotRegistered') {
                    $invalid[] = $chunk[$i];
                }
            }
        }

        return $invalid;
    }
}
