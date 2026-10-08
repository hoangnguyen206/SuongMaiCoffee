<?php

declare(strict_types=1);

namespace App\Auth;

use RuntimeException;

final class AuthException extends RuntimeException
{
    /** @param array<string, list<string>> $fields */
    public function __construct(
        string $message,
        public readonly string $errorCode,
        public readonly int $status,
        public readonly array $fields = [],
    ) {
        parent::__construct($message);
    }
}
