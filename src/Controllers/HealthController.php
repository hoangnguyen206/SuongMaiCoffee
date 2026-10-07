<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\JsonResponder;
use App\Http\Response;
use Throwable;

final class HealthController
{
    /** @param callable(): void $databaseCheck */
    public function __construct(private readonly mixed $databaseCheck)
    {
    }

    public function handle(string $requestId): Response
    {
        try {
            ($this->databaseCheck)();
        } catch (Throwable) {
            return JsonResponder::error(
                'DATABASE_UNAVAILABLE',
                'Dịch vụ hiện không khả dụng.',
                503,
                $requestId,
                details: ['component' => 'database'],
            );
        }

        return JsonResponder::success([
            'status' => 'ok',
            'database' => 'connected',
        ], []);
    }
}
