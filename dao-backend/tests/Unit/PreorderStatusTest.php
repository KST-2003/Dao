<?php

use App\Enums\PreorderDestination as D;
use App\Enums\PreorderStatus as S;

it('follows the Myanmar path via courier, transit and landing', function () {
    expect(S::path(D::Myanmar))->toBe([
        S::Submitted, S::InReview, S::Approved, S::WaitingPayment, S::InProcess,
        S::WaitingCourier, S::InTransit, S::LandedMyanmar, S::OnDelivery, S::Completed,
    ]);
    expect(S::InProcess->allowedNext(D::Myanmar))->toBe([S::WaitingCourier]);
});

it('follows the Thailand path via packaging', function () {
    expect(S::path(D::Thailand))->toBe([
        S::Submitted, S::InReview, S::Approved, S::WaitingPayment, S::InProcess,
        S::Packaging, S::OnDelivery, S::Completed,
    ]);
    expect(S::InProcess->allowedNext(D::Thailand))->toBe([S::Packaging]);
    expect(S::Packaging->canTransitionTo(S::InTransit, D::Thailand))->toBeFalse();
});

it('lets staff reject only from review, and never set in_process by hand', function () {
    expect(S::Submitted->adminNext(D::Thailand))->not->toContain(S::Rejected)
        ->and(S::InReview->adminNext(D::Thailand))->toContain(S::Rejected)
        ->and(S::WaitingPayment->adminNext(D::Thailand))->toBe([S::Cancelled])
        ->and(S::WaitingPayment->allowedNext(D::Thailand))->toContain(S::InProcess);
});

it('maps countries to destinations', function () {
    expect(D::fromCountry('mm'))->toBe(D::Myanmar)->and(D::fromCountry('TH'))->toBe(D::Thailand)->and(D::fromCountry('SG'))->toBeNull();
});
