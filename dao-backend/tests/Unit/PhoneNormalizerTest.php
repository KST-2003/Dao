<?php

use App\Exceptions\DomainException;
use App\Services\Auth\PhoneNormalizer;

it('normalizes Thai mobile numbers to E.164', function (string $raw) {
    expect((new PhoneNormalizer)->normalize($raw, 'TH'))->toBe('+66812345678');
})->with(['0812345678', '081-234-5678', '+66 81 234 5678', '0066812345678']);

it('normalizes Myanmar mobile numbers to E.164', function () {
    expect((new PhoneNormalizer)->normalize('09 7812 34567', 'MM'))->toBe('+959781234567');
});

it('rejects invalid numbers', function (string $raw) {
    (new PhoneNormalizer)->normalize($raw, 'TH');
})->with(['12345', '0212345678', 'abc'])->throws(DomainException::class);
