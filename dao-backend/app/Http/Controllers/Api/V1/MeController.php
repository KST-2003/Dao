<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\FileStorageInterface;
use App\DTOs\SocialIdentity;
use App\Enums\AuthProvider;
use App\Exceptions\DomainException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\DeviceTokenRequest;
use App\Http\Requests\Api\LinkProviderRequest;
use App\Http\Requests\Api\UpdateProfileRequest;
use App\Http\Resources\Api\UserResource;
use App\Models\DeviceToken;
use App\Services\Auth\AuthService;
use App\Services\Auth\GoogleIdentityProvider;
use App\Services\Auth\LineIdentityProvider;
use App\Services\Auth\OtpService;
use App\Services\Auth\PhoneNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    public function show(Request $request): UserResource
    {
        return new UserResource($request->user()->load('authProviders'));
    }

    public function update(UpdateProfileRequest $request, FileStorageInterface $files): UserResource
    {
        $user = $request->user();
        $data = collect($request->validated())->except('avatar')->all();
        if ($request->hasFile('avatar')) {
            $data['avatar_url'] = $files->putImage($request->file('avatar'), 'avatars')->url;
        }
        $user->fill($data);
        $user->profile_completed = $user->profile_completed || (bool) ($user->display_name || $user->name);
        $user->save();

        return new UserResource($user->load('authProviders'));
    }

    public function destroy(Request $request): JsonResponse
    {
        $this->auth->deleteAccount($request->user());

        return $this->ok(['deleted' => true]);
    }

    public function linkProvider(string $provider, LinkProviderRequest $request, GoogleIdentityProvider $google, LineIdentityProvider $line, OtpService $otp, PhoneNormalizer $phones): UserResource
    {
        $identity = match (AuthProvider::tryFrom($provider)) {
            AuthProvider::Google => $google->verify($request->only('id_token')),
            AuthProvider::Line => $line->verify(array_filter($request->only(['id_token', 'code', 'code_verifier', 'redirect_uri']))),
            AuthProvider::Sms => (function () use ($request, $otp, $phones) {
                $phone = $phones->normalize((string) $request->input('phone'), $request->input('country', 'TH'));
                $otp->verify($phone, (string) $request->input('otp'));

                return new SocialIdentity(AuthProvider::Sms, $phone, phone: $phone);
            })(),
            default => throw DomainException::of('NOT_FOUND', 404),
        };
        $this->auth->linkProvider($request->user(), $identity);

        return new UserResource($request->user()->fresh()->load('authProviders'));
    }

    public function unlinkProvider(string $provider, Request $request): UserResource
    {
        $this->auth->unlinkProvider($request->user(), AuthProvider::tryFrom($provider) ?? throw DomainException::of('NOT_FOUND', 404));

        return new UserResource($request->user()->fresh()->load('authProviders'));
    }

    public function registerDevice(DeviceTokenRequest $request): JsonResponse
    {
        DeviceToken::query()->updateOrCreate(
            ['token' => (string) $request->input('token')],
            ['user_id' => $request->user()->id, 'platform' => (string) $request->input('platform'), 'last_seen_at' => now()],
        );

        return $this->ok(['registered' => true]);
    }

    public function unregisterDevice(Request $request): JsonResponse
    {
        DeviceToken::query()->where('user_id', $request->user()->id)->where('token', (string) $request->input('token'))->delete();

        return $this->ok(['unregistered' => true]);
    }
}
