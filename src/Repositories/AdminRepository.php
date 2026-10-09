<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Commerce\CommerceException;
use PDO;

final class AdminRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function dashboard(): array
    {
        $summary = $this->pdo->query(
            "SELECT COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS orders_today,
                    COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed', 'roasting', 'shipping')) AS active_orders,
                    COALESCE(SUM(grand_total_vnd) FILTER (WHERE status <> 'cancelled'), 0) AS revenue,
                    COALESCE(AVG(grand_total_vnd) FILTER (WHERE status <> 'cancelled'), 0) AS average_order
             FROM orders"
        )->fetch() ?: [];
        $lowStock = $this->pdo->query(
            'SELECT COUNT(*) FROM inventory_lots WHERE quantity_on_hand <= low_stock_threshold'
        )->fetchColumn();
        return [
            'orders_today' => (int) ($summary['orders_today'] ?? 0),
            'active_orders' => (int) ($summary['active_orders'] ?? 0),
            'revenue_vnd' => (int) ($summary['revenue'] ?? 0),
            'average_order_vnd' => (int) round((float) ($summary['average_order'] ?? 0)),
            'low_stock_lots' => (int) $lowStock,
        ];
    }

    public function products(?string $search = null): array
    {
        $statement = $this->pdo->prepare(
            "SELECT p.id, p.slug, p.name, p.description, p.is_active, o.name AS origin_name,
                    COALESCE(MIN(v.price_vnd), 0) AS minimum_price_vnd,
                    COALESCE(SUM(l.quantity_on_hand), 0) AS quantity_on_hand
             FROM products p JOIN origins o ON o.id = p.origin_id
             LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_active = TRUE
             LEFT JOIN inventory_lots l ON l.variant_id = v.id
             WHERE (:search = '' OR p.name ILIKE :pattern_name OR p.slug ILIKE :pattern_slug)
             GROUP BY p.id, o.name ORDER BY p.is_active DESC, p.name, p.id"
        );
        $term = trim((string) $search);
        $statement->bindValue(':search', $term);
        $statement->bindValue(':pattern_name', '%' . $term . '%');
        $statement->bindValue(':pattern_slug', '%' . $term . '%');
        $statement->execute();
        return array_map(static function (array $row): array {
            $row['id'] = (int) $row['id'];
            $row['minimum_price_vnd'] = (int) $row['minimum_price_vnd'];
            $row['quantity_on_hand'] = (int) $row['quantity_on_hand'];
            $row['is_active'] = in_array($row['is_active'], [true, 1, '1', 't', 'true'], true);
            return $row;
        }, $statement->fetchAll());
    }

    public function productOptions(): array
    {
        return [
            'categories' => $this->pdo->query('SELECT id, slug, name FROM categories WHERE is_active = TRUE ORDER BY display_order, name')->fetchAll(),
            'origins' => $this->pdo->query('SELECT id, slug, name, region FROM origins WHERE is_active = TRUE ORDER BY name')->fetchAll(),
            'flavor_tags' => $this->pdo->query('SELECT id, slug, name FROM flavor_tags WHERE is_active = TRUE ORDER BY name')->fetchAll(),
        ];
    }

    public function saveProduct(array $input, ?int $id = null): array
    {
        $name = trim((string) ($input['name'] ?? ''));
        $slug = trim((string) ($input['slug'] ?? ''));
        $description = trim((string) ($input['description'] ?? ''));
        $originId = filter_var($input['origin_id'] ?? null, FILTER_VALIDATE_INT);
        $profile = array_map(static fn (string $key): int => (int) ($input[$key] ?? 3), ['acidity', 'body', 'sweetness', 'bitterness', 'aroma']);
        if ($name === '' || mb_strlen($name) > 200 || !is_int($originId) || $originId < 1 || $slug === '' || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            throw new CommerceException('Thông tin sản phẩm chưa hợp lệ.', 'VALIDATION_FAILED', 422);
        }
        foreach ($profile as $value) if ($value < 1 || $value > 5) throw new CommerceException('Flavor profile phải từ 1 đến 5.', 'VALIDATION_FAILED', 422);
        if ($id === null) {
            $statement = $this->pdo->prepare('INSERT INTO products (origin_id, slug, name, description, acidity, body, sweetness, bitterness, aroma) VALUES (:origin_id, :slug, :name, :description, :acidity, :body, :sweetness, :bitterness, :aroma) RETURNING id');
        } else {
            $statement = $this->pdo->prepare('UPDATE products SET origin_id = :origin_id, slug = :slug, name = :name, description = :description, acidity = :acidity, body = :body, sweetness = :sweetness, bitterness = :bitterness, aroma = :aroma, updated_at = CURRENT_TIMESTAMP WHERE id = :id RETURNING id');
            $statement->bindValue(':id', $id, PDO::PARAM_INT);
        }
        $statement->execute(['origin_id' => $originId, 'slug' => $slug, 'name' => $name, 'description' => $description, 'acidity' => $profile[0], 'body' => $profile[1], 'sweetness' => $profile[2], 'bitterness' => $profile[3], 'aroma' => $profile[4]]);
        $productId = $statement->fetchColumn();
        if ($productId === false) throw new CommerceException('Không tìm thấy sản phẩm.', 'NOT_FOUND', 404);
        return ['id' => (int) $productId];
    }

    public function setProductActive(int $id, bool $active): array
    {
        $statement = $this->pdo->prepare('UPDATE products SET is_active = :active, updated_at = CURRENT_TIMESTAMP WHERE id = :id RETURNING id, is_active');
        $statement->execute(['id' => $id, 'active' => $active]);
        $row = $statement->fetch();
        if (!is_array($row)) throw new CommerceException('Không tìm thấy sản phẩm.', 'NOT_FOUND', 404);
        return ['id' => (int) $row['id'], 'is_active' => in_array($row['is_active'], [true, 1, '1', 't', 'true'], true)];
    }

    public function coupons(): array
    {
        return $this->pdo->query('SELECT id, code, coupon_type, percent_value, fixed_value_vnd, minimum_subtotal_vnd, is_active, starts_at, ends_at FROM coupons ORDER BY id DESC')->fetchAll();
    }

    public function saveCoupon(array $input, ?int $id = null): array
    {
        $code = strtoupper(trim((string) ($input['code'] ?? '')));
        $type = (string) ($input['coupon_type'] ?? '');
        $percent = filter_var($input['percent_value'] ?? null, FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE);
        $fixed = filter_var($input['fixed_value_vnd'] ?? null, FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE);
        $minimum = filter_var($input['minimum_subtotal_vnd'] ?? 0, FILTER_VALIDATE_INT);
        if (!preg_match('/^[A-Z0-9_-]{3,80}$/', $code) || !in_array($type, ['percent', 'fixed'], true) || !is_int($minimum) || $minimum < 0 || ($type === 'percent' && (!is_int($percent) || $percent < 1 || $percent > 100)) || ($type === 'fixed' && (!is_int($fixed) || $fixed < 0))) {
            throw new CommerceException('Thông tin mã giảm giá chưa hợp lệ.', 'VALIDATION_FAILED', 422);
        }
        $statement = $id === null
            ? $this->pdo->prepare('INSERT INTO coupons (code, coupon_type, percent_value, fixed_value_vnd, minimum_subtotal_vnd) VALUES (:code, :type, :percent, :fixed, :minimum) RETURNING id')
            : $this->pdo->prepare('UPDATE coupons SET code = :code, coupon_type = :type, percent_value = :percent, fixed_value_vnd = :fixed, minimum_subtotal_vnd = :minimum WHERE id = :id RETURNING id');
        $parameters = ['code' => $code, 'type' => $type, 'percent' => $type === 'percent' ? $percent : null, 'fixed' => $type === 'fixed' ? $fixed : null, 'minimum' => $minimum];
        if ($id !== null) $parameters['id'] = $id;
        $statement->execute($parameters);
        $saved = $statement->fetchColumn();
        if ($saved === false) throw new CommerceException('Không tìm thấy mã giảm giá.', 'NOT_FOUND', 404);
        return ['id' => (int) $saved];
    }

    public function setCouponActive(int $id, bool $active): array
    {
        $statement = $this->pdo->prepare('UPDATE coupons SET is_active = :active WHERE id = :id RETURNING id, is_active');
        $statement->execute(['id' => $id, 'active' => $active]);
        $row = $statement->fetch();
        if (!is_array($row)) throw new CommerceException('Không tìm thấy mã giảm giá.', 'NOT_FOUND', 404);
        return ['id' => (int) $row['id'], 'is_active' => in_array($row['is_active'], [true, 1, '1', 't', 'true'], true)];
    }

    public function content(): array
    {
        return $this->pdo->query('SELECT content_key, content_value, updated_at FROM store_content ORDER BY content_key')->fetchAll();
    }

    public function saveContent(array $input, int $userId): array
    {
        $allowed = ['home_intro', 'home_contact', 'home_notice'];
        $this->pdo->beginTransaction();
        try {
            foreach ($input as $key => $value) {
                if (!in_array($key, $allowed, true) || !is_string($value) || mb_strlen($value) > 1000) throw new CommerceException('Nội dung cửa hàng chưa hợp lệ.', 'VALIDATION_FAILED', 422);
                $statement = $this->pdo->prepare('INSERT INTO store_content (content_key, content_value, updated_by_user_id) VALUES (:key, :value, :user_id) ON CONFLICT (content_key) DO UPDATE SET content_value = EXCLUDED.content_value, updated_at = CURRENT_TIMESTAMP, updated_by_user_id = EXCLUDED.updated_by_user_id');
                $statement->execute(['key' => $key, 'value' => trim($value), 'user_id' => $userId]);
            }
            $this->pdo->commit();
            return $this->content();
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $exception;
        }
    }
}
