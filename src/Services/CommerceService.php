<?php

declare(strict_types=1);

namespace App\Services;

use App\Commerce\CommerceException;
use App\Repositories\CommerceRepository;

final class CommerceService
{
    public function __construct(private readonly CommerceRepository $commerce)
    {
    }

    public function cart(?int $userId, string $guestKey): array { return $this->commerce->getCart($userId, $guestKey); }

    public function grindOptions(): array { return $this->commerce->grindOptions(); }

    public function add(?int $userId, string $guestKey, array $input): array
    {
        return $this->commerce->addItem($userId, $guestKey, $this->integer($input, 'variant_id', 1), $this->integer($input, 'grind_option_id', 1), $this->integer($input, 'quantity', 1, 20));
    }

    public function update(?int $userId, string $guestKey, string $lineId, array $input): array
    {
        return $this->commerce->updateItem($userId, $guestKey, $this->pathId($lineId), $this->integer($input, 'quantity', 1, 20));
    }

    public function remove(?int $userId, string $guestKey, string $lineId): array
    {
        return $this->commerce->removeItem($userId, $guestKey, $this->pathId($lineId));
    }

    public function applyCoupon(?int $userId, string $guestKey, array $input): array
    {
        $code = $input['code'] ?? null;
        if (!is_string($code) || trim($code) === '' || strlen($code) > 80) throw new CommerceException('Nhập mã giảm giá hợp lệ.', 'VALIDATION_FAILED', 422, ['code' => ['Mã giảm giá không hợp lệ.']]);
        return $this->commerce->applyCoupon($userId, $guestKey, $code);
    }

    public function clearCoupon(?int $userId, string $guestKey): array { return $this->commerce->clearCoupon($userId, $guestKey); }
    public function merge(int $userId, string $guestKey): array { return $this->commerce->mergeGuestCart($userId, $guestKey); }

    public function checkout(?int $userId, string $guestKey, array $input, string $idempotencyKey): array
    {
        $required = ['recipient_name' => 120, 'phone' => 32, 'address_line1' => 240, 'province_city' => 120, 'district' => 120];
        $clean = [];
        foreach ($required as $key => $max) {
            $value = $input[$key] ?? null;
            if (!is_string($value) || trim($value) === '' || mb_strlen(trim($value), 'UTF-8') > $max) throw new CommerceException('Thông tin giao hàng chưa hợp lệ.', 'VALIDATION_FAILED', 422, [$key => ['Trường này là bắt buộc.']]);
            $clean[$key] = trim($value);
        }
        foreach (['email' => 254, 'address_line2' => 240, 'ward' => 120] as $key => $max) {
            $value = $input[$key] ?? null;
            if ($value !== null && (!is_string($value) || mb_strlen(trim($value), 'UTF-8') > $max)) throw new CommerceException('Thông tin giao hàng chưa hợp lệ.', 'VALIDATION_FAILED', 422, [$key => ['Giá trị không hợp lệ.']]);
            $clean[$key] = is_string($value) ? trim($value) : null;
        }
        if (preg_match('/^\+?[0-9][0-9 -]{7,19}$/D', $clean['phone']) !== 1) throw new CommerceException('Số điện thoại không hợp lệ.', 'VALIDATION_FAILED', 422, ['phone' => ['Số điện thoại không hợp lệ.']]);
        if ($clean['email'] !== null && $clean['email'] !== '' && filter_var($clean['email'], FILTER_VALIDATE_EMAIL) === false) throw new CommerceException('Email không hợp lệ.', 'VALIDATION_FAILED', 422, ['email' => ['Email không hợp lệ.']]);
        $clean['shipping_method'] = $input['shipping_method'] ?? 'standard';
        $clean['payment_method'] = $input['payment_method'] ?? 'cod';
        if ($clean['shipping_method'] !== 'standard' || !in_array($clean['payment_method'], ['cod', 'bank'], true)) throw new CommerceException('Phương thức giao hàng hoặc thanh toán không hợp lệ.', 'VALIDATION_FAILED', 422);
        if (strlen($idempotencyKey) < 8 || strlen($idempotencyKey) > 200) throw new CommerceException('Thiếu khóa yêu cầu hợp lệ.', 'VALIDATION_FAILED', 422);
        return $this->commerce->createOrder($userId, $guestKey, $clean, $idempotencyKey);
    }

    public function orders(int $userId): array { return $this->commerce->ordersForUser($userId); }
    public function order(int $userId, string $code): array
    {
        $order = $this->commerce->orderForUser($userId, $code);
        if ($order === null) throw new CommerceException('Không tìm thấy đơn hàng.', 'NOT_FOUND', 404);
        return $order;
    }
    public function guestLookup(string $code, string $phone): array
    {
        $order = $this->commerce->guestOrder(trim($code), trim($phone));
        if ($order === null) throw new CommerceException('Không tìm thấy đơn hàng phù hợp.', 'NOT_FOUND', 404);
        return $order;
    }
    public function adminOrders(?string $status): array { return $this->commerce->adminOrders($status); }
    public function adminOrder(string $code): array
    {
        $order = $this->commerce->adminOrder($code);
        if ($order === null) throw new CommerceException('Không tìm thấy đơn hàng.', 'NOT_FOUND', 404);
        return $order;
    }
    public function updateStatus(string $code, array $input, int $userId): array
    {
        $status = $input['status'] ?? null;
        if (!is_string($status)) throw new CommerceException('Trạng thái không hợp lệ.', 'VALIDATION_FAILED', 422);
        $note = isset($input['note']) && is_string($input['note']) ? $input['note'] : null;
        return $this->commerce->updateOrderStatus($code, $status, $userId, $note);
    }
    public function inventory(): array { return $this->commerce->inventory(); }
    public function adjustInventory(array $input, int $userId): array
    {
        return $this->commerce->adjustInventory($this->integer($input, 'lot_id', 1), $this->integer($input, 'quantity_delta', -1000000, 1000000), $userId, is_string($input['note'] ?? null) ? (string) $input['note'] : '');
    }

    private function integer(array $input, string $key, int $min, int $max = PHP_INT_MAX): int
    {
        $value = $input[$key] ?? null;
        $parsed = filter_var($value, FILTER_VALIDATE_INT);
        if (!is_int($parsed) || $parsed < $min || $parsed > $max) throw new CommerceException('Một số trường cần được kiểm tra.', 'VALIDATION_FAILED', 422, [$key => ['Giá trị phải là số nguyên hợp lệ.']]);
        return $parsed;
    }

    private function pathId(string $id): int
    {
        $parsed = filter_var($id, FILTER_VALIDATE_INT);
        if (!is_int($parsed) || $parsed < 1) throw new CommerceException('Mã dòng hàng không hợp lệ.', 'VALIDATION_FAILED', 422);
        return $parsed;
    }
}
