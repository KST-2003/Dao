<?php

use App\Models\Address;
use App\Models\Order;

function addressPayload(array $overrides = []): array
{
    return array_merge([
        'recipient_name' => 'Dao', 'phone' => '+66812345678', 'country_code' => 'TH',
        'region' => 'Bangkok', 'postal_code' => '10330', 'address_line1' => '99 Wireless Road',
    ], $overrides);
}

it('saves map coordinates and returns them as floats', function () {
    customer();

    $this->postJson('/api/v1/me/addresses', addressPayload(['latitude' => 13.7563, 'longitude' => 100.5018]))
        ->assertCreated()
        ->assertJsonPath('data.latitude', 13.7563)
        ->assertJsonPath('data.longitude', 100.5018);

    expect(Address::query()->first())->latitude->toBe(13.7563)->longitude->toBe(100.5018);
});

it('still accepts a legacy address without coordinates', function () {
    customer();

    $this->postJson('/api/v1/me/addresses', addressPayload())
        ->assertCreated()
        ->assertJsonPath('data.latitude', null)
        ->assertJsonPath('data.longitude', null);
});

it('rejects out-of-range coordinates', function (array $coords, string $field) {
    customer();

    $this->postJson('/api/v1/me/addresses', addressPayload($coords))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);
})->with([
    'latitude too high' => [['latitude' => 91, 'longitude' => 100], 'latitude'],
    'latitude too low' => [['latitude' => -91, 'longitude' => 100], 'latitude'],
    'longitude too high' => [['latitude' => 13, 'longitude' => 181], 'longitude'],
    'not numeric' => [['latitude' => 'abc', 'longitude' => 100], 'latitude'],
]);

it('requires latitude and longitude together', function () {
    customer();

    $this->postJson('/api/v1/me/addresses', addressPayload(['latitude' => 13.7]))
        ->assertUnprocessable()->assertJsonValidationErrors('longitude');
    $this->postJson('/api/v1/me/addresses', addressPayload(['longitude' => 100.5]))
        ->assertUnprocessable()->assertJsonValidationErrors('latitude');
});

it('lets an old address gain coordinates on update', function () {
    $user = customer();
    $address = Address::factory()->create(['user_id' => $user->id]);

    $this->putJson("/api/v1/me/addresses/{$address->id}", addressPayload(['latitude' => 16.8409, 'longitude' => 96.1735]))
        ->assertOk()->assertJsonPath('data.latitude', 16.8409);
});

it('keeps the delivery point in the order snapshot', function () {
    $user = customer();
    variant();
    Address::factory()->create(['user_id' => $user->id, 'latitude' => 13.7563, 'longitude' => 100.5018]);
    $this->postJson('/api/v1/cart/items', ['variant_id' => \App\Models\ProductVariant::query()->value('id'), 'quantity' => 1]);

    $res = placeOrder($user)->assertCreated()
        ->assertJsonPath('data.order.shipping_address.latitude', 13.7563)
        ->assertJsonPath('data.order.shipping_address.longitude', 100.5018);

    expect(Order::query()->find($res->json('data.order.id'))->shipping_address['latitude'])->toBe(13.7563);
});
