<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Commerce\CommerceException;
use App\Http\JsonResponder;
use App\Http\Response;
use App\Services\AdminService;
use Throwable;

final class AdminController
{
    public function __construct(private readonly AdminService $admin)
    {
    }

    public function handle(string $requestId, callable $operation): Response
    {
        try {
            return JsonResponder::success($operation($this->admin), []);
        } catch (CommerceException $exception) {
            return JsonResponder::error($exception->errorCode, $exception->getMessage(), $exception->status, $requestId, $exception->fields, $exception->details);
        } catch (Throwable) {
            return JsonResponder::error('DATABASE_UNAVAILABLE', 'Dịch vụ hiện không khả dụng.', 503, $requestId);
        }
    }
}
