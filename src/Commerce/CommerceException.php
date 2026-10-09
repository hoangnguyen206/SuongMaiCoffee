<?php

declare(strict_types=1);

namespace App\Commerce;

final class CommerceException extends \RuntimeException
{
    /** @param array<string, list<string>> $fields @param array<string, mixed> $details */
    public function __construct(
        string $message,
        public readonly string $errorCode,
        public readonly int $status = 422,
        public readonly array $fields = [],
        public readonly array $details = [],
    ) {
        parent::__construct($message);
    }
}
