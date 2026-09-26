<?php

namespace App\Http\Controllers\Api\V1;

use App\DTOs\AuthResult;
use App\DTOs\SocialIdentity;
use App\Enums\AuthProvider;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\GoogleLoginRequest;
use App\Http\Requests\Api\LineLoginRequest;
use App\Http\Requests\Api\SmsRequestRequest;
use App\Http\Requests\Api\SmsVerifyRequest;
use App\Http\Resources\Api\UserResource;
use App\Services\Auth\AuthService;
use App\Services\Auth\GoogleIdentityProvider;
use App\Services\Auth\LineIdentityProvider;
use App\Services\Auth\OtpService;
use App\Services\Auth\PhoneNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $auth,
        private readonly OtpService $otp,
        private readonly PhoneNormalizer $phones,
    ) {}

    public function smsRequest(SmsRequestRequest $request): JsonResponse
    {
        $phone = $this->phones->normalize((string) $request->input('phone'), $request->input('country', 'TH'));

        return $this->ok($this->otp->request($phone, $request->ip(), app()->getLocale()) + ['phone' => $phone]);
    }

    public function smsVerify(SmsVerifyRequest $request): JsonResponse
    {
        $phone = $this->phones->normalize((string) $request->input('phone'), $request->input('country', 'TH'));
        $this->otp->verify($phone, (string) $request->input('code'));

        $identity = new SocialIdentity(AuthProvider::Sms, $phone, phone: $phone);

        return $this->respond($this->auth->login($identity, $request->input('referral_code'), $this->device($request), app()->getLocale()));
    }

    public function google(GoogleLoginRequest $request, GoogleIdentityProvider $google): JsonResponse
    {
        $identity = $google->verify($request->only('id_token'));

        return $this->respond($this->auth->login($identity, $request->input('referral_code'), $this->device($request), app()->getLocale()));
    }

    public function line(LineLoginRequest $request, LineIdentityProvider $line): JsonResponse
    {
        $identity = $line->verify(array_filter($request->only(['id_token', 'code', 'code_verifier', 'redirect_uri'])));

        return $this->respond($this->auth->login($identity, $request->input('referral_code'), $this->device($request), app()->getLocale()));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return $this->ok(['logged_out' => true]);
    }

    private function respond(AuthResult $result): JsonResponse
    {
        return $this->ok([
            'token' => $result->token,
            'is_new_user' => $result->isNewUser,
            'user' => new UserResource($result->user->load('authProviders')),
        ]);
    }

    private function device(Request $request): string
    {
        return (string) ($request->input('device_name') ?: substr((string) $request->userAgent(), 0, 60) ?: 'app');
    }
}
