<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * A business-rule violation. Rendered as { message, code, errors? } with the given status.
 * The message is translated from lang/{locale}/errors.php using the error code.
 */
class DomainException extends RuntimeException
{
    /**
     * @param  array<string, mixed>  $errors
     */
    public function __construct(
        string $message,
        public readonly string $errorCode,
        public readonly int $status = 409,
        public readonly array $errors = [],
    ) {
        parent::__construct($message);
    }

    /**
     * @param  array<string, mixed>  $replace  translation placeholders
     * @param  array<string, mixed>  $errors  structured details for the client
     */
    public static function of(string $code, int $status = 409, array $replace = [], array $errors = []): self
    {
        $key = "errors.{$code}";
        $message = __($key, $replace);

        return new self($message === $key ? __('errors.GENERIC') : $message, $code, $status, $errors);
    }
}
