<?php

namespace App\Enums;

enum PreorderStatus: string
{
    case Submitted = 'submitted';
    case InReview = 'in_review';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case WaitingPayment = 'waiting_payment';
    case InProcess = 'in_process';
    // Myanmar (overseas)
    case WaitingCourier = 'waiting_courier';
    case InTransit = 'in_transit';
    case LandedMyanmar = 'landed_myanmar';
    // Thailand
    case Packaging = 'packaging';
    // Both
    case OnDelivery = 'on_delivery';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';

    /** Every status the order can legally move to next (includes system-driven moves). @return list<self> */
    public function allowedNext(PreorderDestination $destination): array
    {
        $myanmar = $destination === PreorderDestination::Myanmar;

        return match ($this) {
            self::Submitted => [self::InReview, self::Cancelled],
            self::InReview => [self::Approved, self::Rejected, self::Cancelled],
            self::Approved => [self::WaitingPayment, self::Cancelled],
            self::WaitingPayment => [self::InProcess, self::Cancelled],
            self::InProcess => [$myanmar ? self::WaitingCourier : self::Packaging],
            self::WaitingCourier => [self::InTransit],
            self::InTransit => [self::LandedMyanmar],
            self::LandedMyanmar => [self::OnDelivery],
            self::Packaging => [self::OnDelivery],
            self::OnDelivery => [self::Completed],
            self::Rejected, self::Completed, self::Cancelled, self::Refunded => [],
        };
    }

    /**
     * What staff may pick. in_process is excluded: it happens only when the backend confirms payment.
     *
     * @return list<self>
     */
    public function adminNext(PreorderDestination $destination): array
    {
        return array_values(array_filter(
            $this->allowedNext($destination),
            fn (self $s) => $s !== self::InProcess,
        ));
    }

    public function canTransitionTo(self $next, PreorderDestination $destination): bool
    {
        return in_array($next, $this->allowedNext($destination), true);
    }

    /** Happy-path steps, for progress trackers. @return list<self> */
    public static function path(PreorderDestination $destination): array
    {
        return $destination === PreorderDestination::Myanmar
            ? [self::Submitted, self::InReview, self::Approved, self::WaitingPayment, self::InProcess, self::WaitingCourier, self::InTransit, self::LandedMyanmar, self::OnDelivery, self::Completed]
            : [self::Submitted, self::InReview, self::Approved, self::WaitingPayment, self::InProcess, self::Packaging, self::OnDelivery, self::Completed];
    }

    /** Customer or staff may cancel without a refund until payment is confirmed. */
    public function isCancellable(): bool
    {
        return in_array($this, [self::Submitted, self::InReview, self::Approved, self::WaitingPayment], true);
    }

    /** Paid and not yet closed — refundable. */
    public function isRefundable(): bool
    {
        return in_array($this, [self::InProcess, self::WaitingCourier, self::InTransit, self::LandedMyanmar, self::Packaging, self::OnDelivery, self::Completed], true);
    }

    /** Statuses whose quantity no longer counts against a product's pre-order capacity. */
    public static function releasing(): array
    {
        return [self::Rejected, self::Cancelled, self::Refunded];
    }
}
