<?php

use App\Contracts\SmsProviderInterface;
use App\Models\LoyaltyAccount;
use App\Models\User;
use App\Models\UserAuthProvider;
use Illuminate\Support\Facades\Http;

function lastOtp(string $phone): ?string
{
    return app(SmsProviderInterface::class)->lastCodeFor($phone);
}

it('registers a new customer with SMS OTP, gives the signup bonus and entry tier', function () {
    $this->postJson('/api/v1/auth/sms/request', ['phone' => '0812345678'])
        ->assertOk()->assertJsonPath('data.phone', '+66812345678');

    $code = lastOtp('+66812345678');
    expect($code)->not->toBeNull();

    $res = $this->postJson('/api/v1/auth/sms/verify', ['phone' => '0812345678', 'code' => $code, 'device_name' => 'test'])
        ->assertOk()
        ->assertJsonPath('data.is_new_user', true)
        ->assertJsonPath('data.user.phone', '+66812345678');

    expect($res->json('data.token'))->toBeString();
    $user = User::query()->where('phone', '+66812345678')->firstOrFail();
    expect(LoyaltyAccount::query()->find($user->id)->balance)->toBe(100)
        ->and($user->membership->tier->code)->toBe('member');
});

it('returns the same account when the same phone signs in again', function () {
    $this->postJson('/api/v1/auth/sms/request', ['phone' => '0812345678']);
    $this->postJson('/api/v1/auth/sms/verify', ['phone' => '0812345678', 'code' => lastOtp('+66812345678')])->assertOk();

    $this->travel(2)->minutes();
    $this->postJson('/api/v1/auth/sms/request', ['phone' => '0812345678'])->assertOk();
    $this->postJson('/api/v1/auth/sms/verify', ['phone' => '0812345678', 'code' => lastOtp('+66812345678')])
        ->assertOk()->assertJsonPath('data.is_new_user', false);

    expect(User::query()->count())->toBe(1)
        ->and(LoyaltyAccount::query()->first()->balance)->toBe(100); // signup bonus only once
});

it('enforces the resend cooldown', function () {
    $this->postJson('/api/v1/auth/sms/request', ['phone' => '0812345678'])->assertOk();
    $this->postJson('/api/v1/auth/sms/request', ['phone' => '0812345678'])
        ->assertStatus(429)->assertJsonPath('code', 'OTP_COOLDOWN');
});

it('locks the code after too many wrong attempts', function () {
    $this->postJson('/api/v1/auth/sms/request', ['phone' => '0812345678']);
    $real = lastOtp('+66812345678');
    $wrong = $real === '000000' ? '111111' : '000000';

    foreach (range(1, 5) as $i) {
        $this->postJson('/api/v1/auth/sms/verify', ['phone' => '0812345678', 'code' => $wrong])->assertStatus(422)->assertJsonPath('code', 'OTP_INVALID');
    }
    $this->postJson('/api/v1/auth/sms/verify', ['phone' => '0812345678', 'code' => $real])
        ->assertStatus(429)->assertJsonPath('code', 'OTP_TOO_MANY_ATTEMPTS');
});

it('rejects an invalid phone number', function () {
    $this->postJson('/api/v1/auth/sms/request', ['phone' => '12345'])->assertStatus(422)->assertJsonPath('code', 'PHONE_INVALID');
});

it('signs in with a verified Google ID token and links it to an existing SMS account', function () {
    config(['services.google.client_ids' => ['test-client.apps.googleusercontent.com']]);
    app()->forgetInstance(\App\Services\Auth\GoogleIdentityProvider::class);
    Http::fake(['oauth2.googleapis.com/*' => Http::response([
        'iss' => 'https://accounts.google.com', 'aud' => 'test-client.apps.googleusercontent.com',
        'exp' => (string) (time() + 600), 'sub' => 'google-123', 'email' => 'lily@example.com', 'email_verified' => 'true', 'name' => 'Lily',
    ])]);

    // 1) SMS account
    $this->postJson('/api/v1/auth/sms/request', ['phone' => '0812345678']);
    $token = $this->postJson('/api/v1/auth/sms/verify', ['phone' => '0812345678', 'code' => lastOtp('+66812345678')])->json('data.token');

    // 2) Link Google while signed in
    $this->withToken($token)->postJson('/api/v1/me/providers/google', ['id_token' => 'fake'])
        ->assertOk()->assertJsonPath('data.providers', ['sms', 'google']);

    // 3) Google sign-in now resolves to the same account
    $this->app['auth']->forgetGuards();
    $this->withToken('')->postJson('/api/v1/auth/google', ['id_token' => 'fake'])
        ->assertOk()->assertJsonPath('data.is_new_user', false);

    expect(User::query()->count())->toBe(1)
        ->and(UserAuthProvider::query()->count())->toBe(2);
});

it('refuses Google sign-in when Google is not configured (no fake success)', function () {
    config(['services.google.client_ids' => []]);
    app()->forgetInstance(\App\Services\Auth\GoogleIdentityProvider::class);

    $this->postJson('/api/v1/auth/google', ['id_token' => 'x'])->assertStatus(503)->assertJsonPath('code', 'PROVIDER_NOT_CONFIGURED');
});

it('does not let a user remove their last sign-in method', function () {
    $user = customer();
    $user->authProviders()->create(['provider' => 'sms', 'provider_user_id' => $user->phone]);

    $this->deleteJson('/api/v1/me/providers/sms')->assertStatus(422)->assertJsonPath('code', 'LAST_PROVIDER');
});
