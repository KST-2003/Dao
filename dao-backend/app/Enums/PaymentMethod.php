<?php

namespace App\Enums;

enum PaymentMethod: string
{
    /** Cash on delivery — order proceeds to processing, payment collected by courier. */
    case Cod = 'cod';
    /** Bank transfer / PromptPay — admin confirms the transfer, then the order becomes paid. */
    case BankTransfer = 'bank_transfer';
    /** Stripe Checkout (cards, PromptPay) — confirmed by signed webhook only. */
    case Stripe = 'stripe';
}
