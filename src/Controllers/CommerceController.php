<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Commerce\CommerceException;
use App\Http\JsonResponder;
use App\Http\Response;
use App\Repositories\CommerceRepository;
use App\Services\CommerceService;
use Throwable;

final class CommerceController
{
    public function __construct(private readonly CommerceService $commerce)
    {
    }

    public function cart(string $requestId, ?int $userId, string $guestKey): Response { return $this->call($requestId, fn (): array => $this->commerce->cart($userId, $guestKey)); }
    public function grindOptions(string $requestId): Response { return $this->call($requestId, fn (): array => $this->commerce->grindOptions()); }
    public function add(string $requestId, ?int $userId, string $guestKey, array $body): Response { return $this->call($requestId, fn (): array => $this->commerce->add($userId, $guestKey, $body)); }
    public function update(string $requestId, ?int $userId, string $guestKey, array $parameters, array $body): Response { return $this->call($requestId, fn (): array => $this->commerce->update($userId, $guestKey, $parameters['lineId'] ?? '', $body)); }
    public function remove(string $requestId, ?int $userId, string $guestKey, array $parameters): Response { return $this->call($requestId, fn (): array => $this->commerce->remove($userId, $guestKey, $parameters['lineId'] ?? '')); }
    public function applyCoupon(string $requestId, ?int $userId, string $guestKey, array $body): Response { return $this->call($requestId, fn (): array => $this->commerce->applyCoupon($userId, $guestKey, $body)); }
    public function clearCoupon(string $requestId, ?int $userId, string $guestKey): Response { return $this->call($requestId, fn (): array => $this->commerce->clearCoupon($userId, $guestKey)); }
    public function merge(string $requestId, int $userId, string $guestKey): Response { return $this->call($requestId, fn (): array => $this->commerce->merge($userId, $guestKey)); }

    public function checkout(string $requestId, ?int $userId, string $guestKey, array $body, string $idempotencyKey): Response { return $this->call($requestId, fn (): array => $this->commerce->checkout($userId, $guestKey, $body, $idempotencyKey), 201); }

    public function orders(string $requestId, int $userId): Response { return $this->call($requestId, fn (): array => $this->commerce->orders($userId)); }
    public function order(string $requestId, int $userId, array $parameters): Response { return $this->call($requestId, fn (): array => $this->commerce->order($userId, $parameters['code'] ?? '')); }
    public function guestLookup(string $requestId, array $body): Response { return $this->call($requestId, fn (): array => $this->commerce->guestLookup((string) ($body['order_code'] ?? ''), (string) ($body['phone'] ?? ''))); }
    public function adminOrders(string $requestId, ?string $status): Response { return $this->call($requestId, fn (): array => $this->commerce->adminOrders($status)); }
    public function adminOrder(string $requestId, array $parameters): Response { return $this->call($requestId, fn (): array => $this->commerce->adminOrder($parameters['code'] ?? '')); }
    public function updateStatus(string $requestId, array $parameters, array $body, int $userId): Response { return $this->call($requestId, fn (): array => $this->commerce->updateStatus($parameters['code'] ?? '', $body, $userId)); }
    public function inventory(string $requestId): Response { return $this->call($requestId, fn (): array => $this->commerce->inventory()); }
    public function adjustInventory(string $requestId, array $body, int $userId): Response { return $this->call($requestId, fn (): array => $this->commerce->adjustInventory($body, $userId)); }

    private function call(string $requestId, callable $operation, int $successStatus = 200): Response
    {
        try { return JsonResponder::success($operation(), [], $successStatus); }
        catch (CommerceException $exception) { return JsonResponder::error($exception->errorCode, $exception->getMessage(), $exception->status, $requestId, $exception->fields, $exception->details); }
        catch (Throwable) { return JsonResponder::error('DATABASE_UNAVAILABLE', 'Dịch vụ hiện không khả dụng.', 503, $requestId); }
    }
}
