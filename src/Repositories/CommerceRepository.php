<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Commerce\CommerceException;
use PDO;
use PDOException;

final class CommerceRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function getCart(?int $userId, string $guestKey): array
    {
        $cart = $this->ensureCart($userId, $guestKey);
        return $this->cartData((int) $cart['id']);
    }

    /** @return list<array{id: string, slug: string, name: string}> */
    public function grindOptions(): array
    {
        $statement = $this->pdo->query('SELECT id, slug, name FROM grind_options WHERE is_active = TRUE ORDER BY id');
        $options = $statement->fetchAll();
        foreach ($options as &$option) {
            $option['id'] = (string) $option['id'];
        }
        unset($option);
        return $options;
    }

    public function addItem(?int $userId, string $guestKey, int $variantId, int $grindId, int $quantity): array
    {
        $this->validateQuantity($quantity);
        $this->pdo->beginTransaction();
        try {
            $cart = $this->ensureCart($userId, $guestKey, true);
            $this->variant($variantId, $grindId, true);
            $stock = $this->stockForVariant($variantId, true);
            $existing = $this->item((int) $cart['id'], $variantId, $grindId, true);
            $requested = $quantity + ($existing ? (int) $existing['quantity'] : 0);
            $max = min(20, $stock);
            if ($requested > $max) throw $this->conflict($variantId, $grindId, $requested, $max);
            if ($existing) {
                $statement = $this->pdo->prepare('UPDATE cart_items SET quantity = :quantity, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
                $statement->execute(['quantity' => $requested, 'id' => $existing['id']]);
            } else {
                $statement = $this->pdo->prepare('INSERT INTO cart_items (cart_id, variant_id, grind_option_id, quantity) VALUES (:cart_id, :variant_id, :grind_id, :quantity)');
                $statement->execute(['cart_id' => $cart['id'], 'variant_id' => $variantId, 'grind_id' => $grindId, 'quantity' => $quantity]);
            }
            $this->touchCart((int) $cart['id']);
            $result = $this->cartData((int) $cart['id']);
            $this->pdo->commit();
            return $result;
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $exception;
        }
    }

    public function updateItem(?int $userId, string $guestKey, int $lineId, int $quantity): array
    {
        $this->validateQuantity($quantity);
        $this->pdo->beginTransaction();
        try {
            $cart = $this->ensureCart($userId, $guestKey, true);
            $statement = $this->pdo->prepare('SELECT * FROM cart_items WHERE id = :id AND cart_id = :cart_id FOR UPDATE');
            $statement->execute(['id' => $lineId, 'cart_id' => $cart['id']]);
            $item = $statement->fetch();
            if (!is_array($item)) throw new CommerceException('Không tìm thấy dòng hàng.', 'NOT_FOUND', 404);
            $max = min(20, $this->stockForVariant((int) $item['variant_id'], true));
            if ($quantity > $max) throw new CommerceException('Số lượng vượt tồn kho hiện có.', 'OUT_OF_STOCK', 409, [], ['max_acceptable_quantity' => $max]);
            $this->pdo->prepare('UPDATE cart_items SET quantity = :quantity, updated_at = CURRENT_TIMESTAMP WHERE id = :id')->execute(['quantity' => $quantity, 'id' => $lineId]);
            $this->touchCart((int) $cart['id']);
            $result = $this->cartData((int) $cart['id']);
            $this->pdo->commit();
            return $result;
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $exception;
        }
    }

    public function removeItem(?int $userId, string $guestKey, int $lineId): array
    {
        $cart = $this->ensureCart($userId, $guestKey);
        $statement = $this->pdo->prepare('DELETE FROM cart_items WHERE id = :id AND cart_id = :cart_id');
        $statement->execute(['id' => $lineId, 'cart_id' => $cart['id']]);
        if ($statement->rowCount() < 1) throw new CommerceException('Không tìm thấy dòng hàng.', 'NOT_FOUND', 404);
        $this->touchCart((int) $cart['id']);
        return $this->cartData((int) $cart['id']);
    }

    public function applyCoupon(?int $userId, string $guestKey, string $code): array
    {
        $cart = $this->ensureCart($userId, $guestKey);
        $coupon = $this->coupon($code);
        if ($coupon === null || !$this->couponUsable($coupon)) throw new CommerceException('Mã giảm giá không hợp lệ hoặc đã hết hạn.', 'COUPON_NOT_APPLICABLE', 422);
        $data = $this->cartData((int) $cart['id']);
        $eligibleSubtotal = $this->couponEligibleSubtotal((int) $coupon['id'], $data['lines']);
        if ($eligibleSubtotal < (int) $coupon['minimum_subtotal_vnd']) throw new CommerceException('Giá trị sản phẩm đủ điều kiện chưa đạt mức tối thiểu của mã giảm giá.', 'COUPON_NOT_APPLICABLE', 422);
        $this->pdo->prepare('UPDATE carts SET coupon_id = :coupon_id, updated_at = CURRENT_TIMESTAMP WHERE id = :id')->execute(['coupon_id' => $coupon['id'], 'id' => $cart['id']]);
        return $this->cartData((int) $cart['id']);
    }

    public function clearCoupon(?int $userId, string $guestKey): array
    {
        $cart = $this->ensureCart($userId, $guestKey);
        $this->pdo->prepare('UPDATE carts SET coupon_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = :id')->execute(['id' => $cart['id']]);
        return $this->cartData((int) $cart['id']);
    }

    public function mergeGuestCart(int $userId, string $guestKey): array
    {
        $this->pdo->beginTransaction();
        try {
            $guest = $this->findCart(null, $guestKey, true);
            $customer = $this->ensureCart($userId, $guestKey, true);
            if (!$guest || (int) $guest['id'] === (int) $customer['id']) {
                $data = $this->cartData((int) $customer['id']);
                $this->pdo->commit();
                return $data;
            }
            $guestItems = $this->cartItems((int) $guest['id']);
            $customerItems = $this->cartItems((int) $customer['id']);
            $existing = [];
            foreach ($customerItems as $item) $existing[$item['variant_id'] . ':' . $item['grind_option_id']] = $item;
            $conflicts = [];
            foreach ($guestItems as $item) {
                $key = $item['variant_id'] . ':' . $item['grind_option_id'];
                $attempted = (int) $item['quantity'] + (int) ($existing[$key]['quantity'] ?? 0);
                $max = min(20, $this->stockForVariant((int) $item['variant_id'], true));
                if ($attempted > $max) $conflicts[] = ['variant_id' => (string) $item['variant_id'], 'grind_option_id' => (string) $item['grind_option_id'], 'attempted_quantity' => $attempted, 'max_acceptable_quantity' => $max, 'reason' => $attempted > 20 ? 'LINE_QUANTITY_LIMIT' : 'OUT_OF_STOCK'];
            }
            if ($conflicts !== []) throw new CommerceException('Một số dòng giỏ cần được điều chỉnh trước khi gộp.', 'CART_MERGE_CONFLICT', 409, [], ['conflicts' => $conflicts]);
            foreach ($guestItems as $item) {
                $key = $item['variant_id'] . ':' . $item['grind_option_id'];
                if (isset($existing[$key])) {
                    $this->pdo->prepare('UPDATE cart_items SET quantity = quantity + :quantity, updated_at = CURRENT_TIMESTAMP WHERE id = :id')->execute(['quantity' => $item['quantity'], 'id' => $existing[$key]['id']]);
                    $this->pdo->prepare('DELETE FROM cart_items WHERE id = :id')->execute(['id' => $item['id']]);
                } else {
                    $this->pdo->prepare('UPDATE cart_items SET cart_id = :cart_id WHERE id = :id')->execute(['cart_id' => $customer['id'], 'id' => $item['id']]);
                }
            }
            $this->pdo->prepare('DELETE FROM carts WHERE id = :id')->execute(['id' => $guest['id']]);
            $data = $this->cartData((int) $customer['id']);
            $this->pdo->commit();
            return $data;
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $exception;
        }
    }

    private function validateQuantity(int $quantity): void
    {
        if ($quantity < 1 || $quantity > 20) throw new CommerceException('Số lượng phải là số nguyên từ 1 đến 20.', 'VALIDATION_FAILED', 422, ['quantity' => ['Số lượng phải là số nguyên từ 1 đến 20.']]);
    }

    private function conflict(int $variantId, int $grindId, int $attempted, int $max): CommerceException
    {
        return new CommerceException('Không thể gộp số lượng này.', 'CART_MERGE_CONFLICT', 409, [], ['conflicts' => [['variant_id' => (string) $variantId, 'grind_option_id' => (string) $grindId, 'attempted_quantity' => $attempted, 'max_acceptable_quantity' => $max, 'reason' => $attempted > 20 ? 'LINE_QUANTITY_LIMIT' : 'OUT_OF_STOCK']]]);
    }

    /** @return array<string, mixed> */
    private function cartData(int $cartId): array
    {
        $statement = $this->pdo->prepare('SELECT user_id, coupon_id FROM carts WHERE id = :id');
        $statement->execute(['id' => $cartId]);
        $cart = $statement->fetch();
        $items = $this->cartItems($cartId);
        $subtotal = array_sum(array_map(static fn (array $item): int => (int) $item['line_total_vnd'], $items));
        $discount = 0;
        $coupon = null;
        if ($cart['coupon_id'] !== null) {
            $coupon = $this->couponById((int) $cart['coupon_id']);
            $eligibleSubtotal = $coupon === null ? 0 : $this->couponEligibleSubtotal((int) $coupon['id'], $items);
            if ($coupon !== null && $this->couponUsable($coupon) && $eligibleSubtotal >= (int) $coupon['minimum_subtotal_vnd']) {
                $discount = $coupon['coupon_type'] === 'percent'
                    ? intdiv($eligibleSubtotal * (int) $coupon['percent_value'], 100)
                    : min($eligibleSubtotal, (int) $coupon['fixed_value_vnd']);
            }
        }
        $afterDiscount = max(0, $subtotal - $discount);
        $shipping = $afterDiscount === 0 || $afterDiscount >= 500000 ? 0 : 30000;
        return [
            'id' => (string) $cartId,
            'mode' => $cart['user_id'] === null ? 'guest' : 'customer',
            'lines' => $items,
            'coupon' => $coupon === null ? null : ['code' => $coupon['code'], 'type' => $coupon['coupon_type']],
            'pricing' => ['subtotal_vnd' => $subtotal, 'discount_vnd' => $discount, 'shipping_vnd' => $shipping, 'grand_total_vnd' => $afterDiscount + $shipping],
        ];
    }

    /** @return list<array<string, mixed>> */
    private function cartItems(int $cartId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT ci.id, ci.variant_id, ci.grind_option_id, ci.quantity, p.id AS product_id, p.name AS product_name, ' .
            'v.label AS variant_label, v.price_vnd AS unit_price_vnd, g.name AS grind_label, ' .
            'COALESCE((SELECT SUM(l.quantity_on_hand) FROM inventory_lots l WHERE l.variant_id = v.id), 0) AS available_quantity, ' .
            '(v.price_vnd * ci.quantity) AS line_total_vnd ' .
            'FROM cart_items ci JOIN product_variants v ON v.id = ci.variant_id AND v.is_active = TRUE ' .
            'JOIN products p ON p.id = v.product_id AND p.is_active = TRUE ' .
            'JOIN grind_options g ON g.id = ci.grind_option_id AND g.is_active = TRUE ' .
            'WHERE ci.cart_id = :cart_id ORDER BY ci.id'
        );
        $statement->execute(['cart_id' => $cartId]);
        $items = $statement->fetchAll();
        foreach ($items as &$item) {
            foreach (['id', 'variant_id', 'grind_option_id', 'product_id', 'quantity', 'unit_price_vnd', 'available_quantity', 'line_total_vnd'] as $key) {
                $item[$key] = (int) $item[$key];
            }
            $item['available'] = $item['available_quantity'] > 0;
        }
        unset($item);
        return $items;
    }

    /** @return array<string, mixed> */
    private function ensureCart(?int $userId, string $guestKey, bool $lock = false): array
    {
        $existing = $this->findCart($userId, $guestKey, $lock);
        if ($existing !== null) return $existing;
        $statement = $this->pdo->prepare('INSERT INTO carts (user_id, guest_key_hash) VALUES (:user_id, :guest_hash) RETURNING id, user_id, guest_key_hash, coupon_id');
        try {
            $statement->execute(['user_id' => $userId, 'guest_hash' => $userId === null ? hash('sha256', $guestKey) : null]);
        } catch (PDOException $exception) {
            if ($exception->getCode() !== '23505') throw $exception;
            $existing = $this->findCart($userId, $guestKey, $lock);
            if ($existing !== null) return $existing;
            throw $exception;
        }
        return $statement->fetch();
    }

    /** @return array<string, mixed>|null */
    private function findCart(?int $userId, string $guestKey, bool $lock = false): ?array
    {
        $where = $userId === null ? 'guest_key_hash = :identity' : 'user_id = :identity';
        $statement = $this->pdo->prepare('SELECT id, user_id, guest_key_hash, coupon_id FROM carts WHERE ' . $where . ($lock ? ' FOR UPDATE' : ''));
        $statement->execute(['identity' => $userId === null ? hash('sha256', $guestKey) : $userId]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    private function item(int $cartId, int $variantId, int $grindId, bool $lock): ?array
    {
        $statement = $this->pdo->prepare('SELECT * FROM cart_items WHERE cart_id = :cart_id AND variant_id = :variant_id AND grind_option_id = :grind_id' . ($lock ? ' FOR UPDATE' : ''));
        $statement->execute(['cart_id' => $cartId, 'variant_id' => $variantId, 'grind_id' => $grindId]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    private function variant(int $variantId, int $grindId, bool $lock): array
    {
        $statement = $this->pdo->prepare(
            'SELECT v.id FROM product_variants v JOIN products p ON p.id = v.product_id AND p.is_active = TRUE ' .
            'JOIN grind_options g ON g.id = :grind_id AND g.is_active = TRUE ' .
            'WHERE v.id = :variant_id AND v.is_active = TRUE' . ($lock ? ' FOR UPDATE OF v' : '')
        );
        $statement->execute(['variant_id' => $variantId, 'grind_id' => $grindId]);
        if ($statement->fetchColumn() === false) throw new CommerceException('Sản phẩm hoặc kiểu xay không tồn tại.', 'NOT_FOUND', 404);
        return [];
    }

    private function stockForVariant(int $variantId, bool $lock): int
    {
        if ($lock) {
            $locks = $this->pdo->prepare('SELECT id FROM inventory_lots WHERE variant_id = :variant_id ORDER BY id FOR UPDATE');
            $locks->execute(['variant_id' => $variantId]);
        }
        $statement = $this->pdo->prepare('SELECT COALESCE(SUM(quantity_on_hand), 0) FROM inventory_lots WHERE variant_id = :variant_id');
        $statement->execute(['variant_id' => $variantId]);
        return (int) $statement->fetchColumn();
    }

    /** @return list<array<string, mixed>> */
    private function availableLots(int $variantId): array
    {
        $statement = $this->pdo->prepare('SELECT id, quantity_on_hand FROM inventory_lots WHERE variant_id = :variant_id AND quantity_on_hand > 0 ORDER BY pool_kind DESC, roast_batch_id NULLS LAST, id FOR UPDATE');
        $statement->execute(['variant_id' => $variantId]);
        return $statement->fetchAll();
    }

    private function touchCart(int $id): void
    {
        $this->pdo->prepare('UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = :id')->execute(['id' => $id]);
    }

    private function coupon(string $code): ?array
    {
        $statement = $this->pdo->prepare('SELECT * FROM coupons WHERE code = :code');
        $statement->execute(['code' => strtoupper(trim($code))]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    private function couponById(int $id): ?array
    {
        $statement = $this->pdo->prepare('SELECT * FROM coupons WHERE id = :id');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    private function couponUsable(array $coupon): bool
    {
        return $this->dbBool($coupon['is_active']) && strtotime((string) $coupon['starts_at']) <= time()
            && ($coupon['ends_at'] === null || strtotime((string) $coupon['ends_at']) >= time());
    }

    /** @param list<array<string, mixed>> $items */
    private function couponEligibleSubtotal(int $couponId, array $items): int
    {
        $allowlist = $this->pdo->prepare('SELECT 1 FROM coupon_categories WHERE coupon_id = :coupon_id LIMIT 1');
        $allowlist->execute(['coupon_id' => $couponId]);
        if ($allowlist->fetchColumn() === false) {
            return array_sum(array_map(static fn (array $item): int => (int) $item['line_total_vnd'], $items));
        }

        $eligible = 0;
        $matches = $this->pdo->prepare(
            'SELECT EXISTS (SELECT 1 FROM coupon_categories cc JOIN product_categories pc ON pc.category_id = cc.category_id WHERE cc.coupon_id = :coupon_id AND pc.product_id = :product_id)'
        );
        foreach ($items as $item) {
            $matches->execute(['coupon_id' => $couponId, 'product_id' => $item['product_id']]);
            if ($this->dbBool($matches->fetchColumn())) {
                $eligible += (int) $item['line_total_vnd'];
            }
        }
        return $eligible;
    }

    /** @return array<string, mixed> */
    public function createOrder(?int $userId, string $guestKey, array $input, string $idempotencyKey): array
    {
        $keyHash = hash('sha256', $idempotencyKey);
        $existing = $this->findOrderIdByKey($keyHash);
        if ($existing !== null) return $this->orderData($existing, false);

        $this->pdo->beginTransaction();
        try {
            $cart = $this->ensureCart($userId, $guestKey, true);
            $cartData = $this->cartData((int) $cart['id']);
            if ($cartData['lines'] === []) throw new CommerceException('Giỏ hàng đang trống.', 'VALIDATION_FAILED', 422);
            $pricing = $cartData['pricing'];
            $orderCode = $this->newOrderCode();
            $insert = $this->pdo->prepare(
                'INSERT INTO orders (order_code, user_id, recipient_name, phone, email, address_line1, address_line2, province_city, district, ward, shipping_method, payment_method, coupon_id, subtotal_vnd, discount_vnd, shipping_vnd, grand_total_vnd, idempotency_key_hash) ' .
                'VALUES (:code, :user_id, :recipient_name, :phone, :email, :address_line1, :address_line2, :province_city, :district, :ward, :shipping_method, :payment_method, :coupon_id, :subtotal, :discount, :shipping, :grand, :key_hash) RETURNING id'
            );
            $insert->execute([
                'code' => $orderCode, 'user_id' => $userId, 'recipient_name' => $input['recipient_name'],
                'phone' => $input['phone'], 'email' => $input['email'] ?? null, 'address_line1' => $input['address_line1'],
                'address_line2' => $input['address_line2'] ?? null, 'province_city' => $input['province_city'],
                'district' => $input['district'], 'ward' => $input['ward'] ?? null,
                'shipping_method' => $input['shipping_method'], 'payment_method' => $input['payment_method'],
                'coupon_id' => $cart['coupon_id'], 'subtotal' => $pricing['subtotal_vnd'], 'discount' => $pricing['discount_vnd'],
                'shipping' => $pricing['shipping_vnd'], 'grand' => $pricing['grand_total_vnd'], 'key_hash' => $keyHash,
            ]);
            $orderId = (int) $insert->fetchColumn();
            foreach ($cartData['lines'] as $line) {
                $itemInsert = $this->pdo->prepare(
                    'INSERT INTO order_items (order_id, product_id, variant_id, grind_option_id, product_name, variant_label, grind_label, unit_price_vnd, quantity, line_total_vnd) ' .
                    'VALUES (:order_id, :product_id, :variant_id, :grind_id, :product_name, :variant_label, :grind_label, :unit_price, :quantity, :line_total) RETURNING id'
                );
                $itemInsert->execute([
                    'order_id' => $orderId, 'product_id' => $line['product_id'], 'variant_id' => $line['variant_id'],
                    'grind_id' => $line['grind_option_id'], 'product_name' => $line['product_name'],
                    'variant_label' => $line['variant_label'], 'grind_label' => $line['grind_label'],
                    'unit_price' => $line['unit_price_vnd'], 'quantity' => $line['quantity'], 'line_total' => $line['line_total_vnd'],
                ]);
                $itemId = (int) $itemInsert->fetchColumn();
                $remaining = (int) $line['quantity'];
                foreach ($this->availableLots((int) $line['variant_id']) as $lot) {
                    if ($remaining < 1) break;
                    $take = min($remaining, (int) $lot['quantity_on_hand']);
                    $update = $this->pdo->prepare('UPDATE inventory_lots SET quantity_on_hand = quantity_on_hand - :quantity WHERE id = :id AND quantity_on_hand >= :quantity');
                    $update->execute(['quantity' => $take, 'id' => $lot['id']]);
                    if ($update->rowCount() !== 1) throw new CommerceException('Tồn kho vừa thay đổi, vui lòng thử lại.', 'OUT_OF_STOCK', 409);
                    $allocation = $this->pdo->prepare('INSERT INTO order_inventory_allocations (order_id, order_item_id, inventory_lot_id, quantity) VALUES (:order_id, :item_id, :lot_id, :quantity)');
                    $allocation->execute(['order_id' => $orderId, 'item_id' => $itemId, 'lot_id' => $lot['id'], 'quantity' => $take]);
                    $movement = $this->pdo->prepare('INSERT INTO inventory_movements (inventory_lot_id, quantity_delta, movement_type, reason) VALUES (:lot_id, :delta, :type, :reason)');
                    $movement->execute(['lot_id' => $lot['id'], 'delta' => -$take, 'type' => 'order', 'reason' => 'Order ' . $orderCode]);
                    $remaining -= $take;
                }
                if ($remaining > 0) throw new CommerceException('Sản phẩm không đủ tồn kho.', 'OUT_OF_STOCK', 409);
            }
            $history = $this->pdo->prepare('INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by_user_id) VALUES (:order_id, NULL, :to_status, :note, :user_id)');
            $history->execute(['order_id' => $orderId, 'to_status' => 'pending', 'note' => 'Tạo đơn hàng', 'user_id' => $userId]);
            $this->pdo->prepare('DELETE FROM cart_items WHERE cart_id = :cart_id')->execute(['cart_id' => $cart['id']]);
            $this->pdo->commit();
            return $this->orderData($orderId, false);
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            if ($exception instanceof PDOException && $exception->getCode() === '23505') {
                $existing = $this->findOrderIdByKey($keyHash);
                if ($existing !== null) return $this->orderData($existing, false);
            }
            throw $exception;
        }
    }

    /** @return list<array<string, mixed>> */
    public function ordersForUser(int $userId): array
    {
        $statement = $this->pdo->prepare('SELECT order_code, status, payment_status, grand_total_vnd, created_at FROM orders WHERE user_id = :user_id ORDER BY created_at DESC, id DESC');
        $statement->execute(['user_id' => $userId]);
        return array_map(fn (array $row): array => $this->orderSummary($row), $statement->fetchAll());
    }

    /** @return array<string, mixed>|null */
    public function orderForUser(int $userId, string $code): ?array
    {
        $statement = $this->pdo->prepare('SELECT id FROM orders WHERE user_id = :user_id AND order_code = :code');
        $statement->execute(['user_id' => $userId, 'code' => $code]);
        $id = $statement->fetchColumn();
        return $id === false ? null : $this->orderData((int) $id, false);
    }

    /** @return array<string, mixed>|null */
    public function guestOrder(string $code, string $phone): ?array
    {
        $statement = $this->pdo->prepare('SELECT id FROM orders WHERE order_code = :code AND (phone = :phone OR phone = :legacy_phone OR phone = :legacy_phone_no_zero)');
        $legacyPhone = str_starts_with($phone, '0') ? '+84' . substr($phone, 1) : $phone;
        $legacyPhoneNoZero = str_starts_with($phone, '0') ? '84' . substr($phone, 1) : $phone;
        $statement->execute(['code' => $code, 'phone' => $phone, 'legacy_phone' => $legacyPhone, 'legacy_phone_no_zero' => $legacyPhoneNoZero]);
        $id = $statement->fetchColumn();
        return $id === false ? null : $this->orderData((int) $id, true);
    }

    /** @return list<array<string, mixed>> */
    public function adminOrders(?string $status): array
    {
        $sql = 'SELECT order_code, recipient_name, phone, status, payment_status, grand_total_vnd, created_at FROM orders';
        $params = [];
        if ($status !== null) { $sql .= ' WHERE status = :status'; $params['status'] = $status; }
        $sql .= ' ORDER BY created_at DESC, id DESC LIMIT 100';
        $statement = $this->pdo->prepare($sql); $statement->execute($params);
        return array_map(fn (array $row): array => $this->orderSummary($row), $statement->fetchAll());
    }

    /** @return array<string, mixed>|null */
    public function adminOrder(string $code): ?array
    {
        $statement = $this->pdo->prepare('SELECT id FROM orders WHERE order_code = :code');
        $statement->execute(['code' => $code]);
        $id = $statement->fetchColumn();
        return $id === false ? null : $this->orderData((int) $id, false);
    }

    /** @return array<string, mixed> */
    public function updateOrderStatus(string $code, string $status, ?int $userId, ?string $note): array
    {
        $this->pdo->beginTransaction();
        try {
            $statement = $this->pdo->prepare('SELECT * FROM orders WHERE order_code = :code FOR UPDATE');
            $statement->execute(['code' => $code]);
            $order = $statement->fetch();
            if (!is_array($order)) throw new CommerceException('Không tìm thấy đơn hàng.', 'NOT_FOUND', 404);
            $allowed = ['pending' => ['confirmed', 'cancelled'], 'confirmed' => ['roasting', 'cancelled'], 'roasting' => ['shipping'], 'shipping' => ['completed'], 'completed' => [], 'cancelled' => []];
            if (!in_array($status, $allowed[$order['status']] ?? [], true)) throw new CommerceException('Chuyển trạng thái đơn hàng không hợp lệ.', 'INVALID_ORDER_TRANSITION', 409);
            if ($status === 'cancelled') $this->restoreInventory((int) $order['id'], (string) $order['order_code']);
            $paymentStatus = $status === 'completed' && $order['payment_method'] === 'cod' ? 'paid' : $order['payment_status'];
            $update = $this->pdo->prepare('UPDATE orders SET status = :status, payment_status = :payment_status, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
            $update->execute(['status' => $status, 'payment_status' => $paymentStatus, 'id' => $order['id']]);
            $history = $this->pdo->prepare('INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by_user_id) VALUES (:order_id, :from_status, :to_status, :note, :user_id)');
            $history->execute(['order_id' => $order['id'], 'from_status' => $order['status'], 'to_status' => $status, 'note' => $note, 'user_id' => $userId]);
            $this->pdo->commit();
            return $this->orderData((int) $order['id'], false);
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $exception;
        }
    }

    /** @return list<array<string, mixed>> */
    public function inventory(): array
    {
        return $this->pdo->query('SELECT l.id, l.variant_id, v.label AS variant_label, p.name AS product_name, l.pool_kind, l.roast_batch_id, l.quantity_on_hand FROM inventory_lots l JOIN product_variants v ON v.id = l.variant_id JOIN products p ON p.id = l.product_id ORDER BY p.name, v.weight_g, l.id')->fetchAll();
    }

    /** @return array<string, mixed> */
    public function adjustInventory(int $lotId, int $delta, int $userId, string $note): array
    {
        if ($delta === 0 || trim($note) === '') throw new CommerceException('Cần nhập số lượng điều chỉnh và ghi chú.', 'VALIDATION_FAILED', 422);
        $this->pdo->beginTransaction();
        try {
            $lock = $this->pdo->prepare('SELECT quantity_on_hand FROM inventory_lots WHERE id = :id FOR UPDATE');
            $lock->execute(['id' => $lotId]);
            $current = $lock->fetchColumn();
            if ($current === false) throw new CommerceException('Không tìm thấy lô tồn.', 'NOT_FOUND', 404);
            if ((int) $current + $delta < 0) throw new CommerceException('Tồn kho không thể âm.', 'VALIDATION_FAILED', 422);
            $this->pdo->prepare('UPDATE inventory_lots SET quantity_on_hand = quantity_on_hand + :delta WHERE id = :id')->execute(['delta' => $delta, 'id' => $lotId]);
            $audit = $this->pdo->prepare('INSERT INTO admin_inventory_adjustments (inventory_lot_id, user_id, quantity_delta, note) VALUES (:lot_id, :user_id, :delta, :note)');
            $audit->execute(['lot_id' => $lotId, 'user_id' => $userId, 'delta' => $delta, 'note' => trim($note)]);
            $movement = $this->pdo->prepare('INSERT INTO inventory_movements (inventory_lot_id, quantity_delta, movement_type, reason) VALUES (:lot_id, :delta, :type, :reason)');
            $movement->execute(['lot_id' => $lotId, 'delta' => $delta, 'type' => 'admin_adjustment', 'reason' => trim($note)]);
            $this->pdo->commit();
            return ['lot_id' => $lotId, 'quantity_on_hand' => (int) $current + $delta];
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $exception;
        }
    }

    private function findOrderIdByKey(string $keyHash): ?int
    {
        $statement = $this->pdo->prepare('SELECT id FROM orders WHERE idempotency_key_hash = :key_hash');
        $statement->execute(['key_hash' => $keyHash]);
        $id = $statement->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    private function newOrderCode(): string
    {
        do {
            $code = 'SM' . gmdate('ymdHis') . strtoupper(bin2hex(random_bytes(3)));
            $statement = $this->pdo->prepare('SELECT 1 FROM orders WHERE order_code = :code');
            $statement->execute(['code' => $code]);
        } while ($statement->fetchColumn() !== false);
        return $code;
    }

    /** @return array<string, mixed> */
    private function orderData(int $id, bool $guestSafe): array
    {
        $statement = $this->pdo->prepare('SELECT * FROM orders WHERE id = :id');
        $statement->execute(['id' => $id]);
        $order = $statement->fetch();
        if (!is_array($order)) throw new CommerceException('Không tìm thấy đơn hàng.', 'NOT_FOUND', 404);
        $itemsStatement = $this->pdo->prepare('SELECT product_name, variant_label, grind_label, unit_price_vnd, quantity, line_total_vnd FROM order_items WHERE order_id = :id ORDER BY id');
        $itemsStatement->execute(['id' => $id]);
        $items = $itemsStatement->fetchAll();
        foreach ($items as &$item) foreach (['unit_price_vnd', 'quantity', 'line_total_vnd'] as $key) $item[$key] = (int) $item[$key];
        unset($item);
        $result = ['order_code' => $order['order_code'], 'status' => $order['status'], 'subtotal_vnd' => (int) $order['subtotal_vnd'], 'discount_vnd' => (int) $order['discount_vnd'], 'shipping_vnd' => (int) $order['shipping_vnd'], 'grand_total_vnd' => (int) $order['grand_total_vnd'], 'items' => $items, 'created_at' => $order['created_at']];
        if (!$guestSafe) {
            $result['payment_status'] = $order['payment_status'];
            $result['shipping_method'] = $order['shipping_method'];
            $result['payment_method'] = $order['payment_method'];
            $result['shipping'] = ['recipient_name' => $order['recipient_name'], 'phone' => $order['phone'], 'email' => $order['email'], 'address_line1' => $order['address_line1'], 'address_line2' => $order['address_line2'], 'province_city' => $order['province_city'], 'district' => $order['district'], 'ward' => $order['ward']];
        }
        return $result;
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function orderSummary(array $row): array
    {
        return ['order_code' => $row['order_code'], 'recipient_name' => $row['recipient_name'] ?? null, 'phone' => $row['phone'] ?? null, 'status' => $row['status'], 'payment_status' => $row['payment_status'], 'grand_total_vnd' => (int) $row['grand_total_vnd'], 'created_at' => $row['created_at']];
    }

    private function restoreInventory(int $orderId, string $code): void
    {
        $statement = $this->pdo->prepare('SELECT * FROM order_inventory_allocations WHERE order_id = :order_id AND reversed_at IS NULL FOR UPDATE');
        $statement->execute(['order_id' => $orderId]);
        foreach ($statement->fetchAll() as $allocation) {
            $this->pdo->prepare('UPDATE inventory_lots SET quantity_on_hand = quantity_on_hand + :quantity WHERE id = :id')->execute(['quantity' => $allocation['quantity'], 'id' => $allocation['inventory_lot_id']]);
            $movement = $this->pdo->prepare('INSERT INTO inventory_movements (inventory_lot_id, quantity_delta, movement_type, reason) VALUES (:lot_id, :delta, :type, :reason)');
            $movement->execute(['lot_id' => $allocation['inventory_lot_id'], 'delta' => $allocation['quantity'], 'type' => 'cancel', 'reason' => 'Cancel order ' . $code]);
            $this->pdo->prepare('UPDATE order_inventory_allocations SET reversed_at = CURRENT_TIMESTAMP WHERE id = :id')->execute(['id' => $allocation['id']]);
        }
    }

    private function dbBool(mixed $value): bool { return $value === true || $value === 't' || $value === '1' || $value === 1; }
}
