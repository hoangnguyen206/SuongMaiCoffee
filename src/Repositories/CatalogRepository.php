<?php

declare(strict_types=1);

namespace App\Repositories;

use DateTimeImmutable;
use DateTimeZone;
use InvalidArgumentException;
use PDO;
use PDOStatement;

final class CatalogRepository implements CatalogReadRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function categories(): array
    {
        return $this->pdo->query(
            'SELECT slug, name FROM categories WHERE is_active = TRUE ORDER BY display_order, name, id'
        )->fetchAll();
    }

    public function origins(): array
    {
        return $this->pdo->query(
            'SELECT slug, name, region FROM origins WHERE is_active = TRUE ORDER BY name, id'
        )->fetchAll();
    }

    public function flavorTags(): array
    {
        return $this->pdo->query(
            'SELECT slug, name FROM flavor_tags WHERE is_active = TRUE ORDER BY name, id'
        )->fetchAll();
    }

    public function products(array $filters, int $page, int $perPage, string $sort): array
    {
        [$where, $parameters] = $this->productFilters($filters);
        $orderBy = match ($sort) {
            'price_asc' => 'minimum_price ASC NULLS LAST, p.name ASC, p.id ASC',
            'price_desc' => 'minimum_price DESC NULLS LAST, p.name ASC, p.id ASC',
            'name_asc' => 'p.name ASC, p.id ASC',
            default => 'p.created_at DESC, p.id DESC',
        };

        $count = $this->pdo->prepare(
            'SELECT COUNT(*) FROM products p ' .
            'JOIN origins o ON o.id = p.origin_id AND o.is_active = TRUE ' .
            'WHERE p.is_active = TRUE' . $where
        );
        $this->bindFilters($count, $parameters);
        $count->execute();
        $totalItems = (int) $count->fetchColumn();

        $statement = $this->pdo->prepare(
            'SELECT p.id, p.slug, p.name, p.description, ' .
            'o.slug AS origin_slug, o.name AS origin_name, o.region AS origin_region, ' .
            '(SELECT MIN(v.price_vnd) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = TRUE) AS minimum_price, ' .
            'COALESCE((SELECT BOOL_OR(l.quantity_on_hand > 0) FROM inventory_lots l ' .
            'JOIN product_variants v ON v.id = l.variant_id AND v.product_id = p.id AND v.is_active = TRUE), FALSE) AS available ' .
            'FROM products p JOIN origins o ON o.id = p.origin_id AND o.is_active = TRUE ' .
            'WHERE p.is_active = TRUE' . $where .
            ' ORDER BY ' . $orderBy . ' LIMIT :limit OFFSET :offset'
        );
        $this->bindFilters($statement, $parameters);
        $statement->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $statement->bindValue(':offset', ($page - 1) * $perPage, PDO::PARAM_INT);
        $statement->execute();

        $items = $statement->fetchAll();
        foreach ($items as &$item) {
            $id = (int) $item['id'];
            $item['id'] = (string) $id;
            $item['origin'] = [
                'slug' => $item['origin_slug'],
                'name' => $item['origin_name'],
                'region' => $item['origin_region'],
            ];
            unset($item['origin_slug'], $item['origin_name'], $item['origin_region']);
            $item['minimum_price_vnd'] = $item['minimum_price'] === null ? null : (int) $item['minimum_price'];
            unset($item['minimum_price']);
            $item['available'] = $this->databaseBoolean($item['available']);
            $item['categories'] = $this->productCategories($id);
            $item['flavor_tags'] = $this->productFlavorTags($id);
            $item['flavor_profile'] = $this->flavorProfile($id);
            $item['freshness'] = $this->freshness($id);
            $item['images'] = [];
        }
        unset($item);

        return ['items' => $items, 'total_items' => $totalItems];
    }

    public function productBySlug(string $slug, ?int $variantId = null): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT p.id, p.slug, p.name, p.description, ' .
            'o.slug AS origin_slug, o.name AS origin_name, o.region AS origin_region ' .
            'FROM products p JOIN origins o ON o.id = p.origin_id AND o.is_active = TRUE ' .
            'WHERE p.slug = :slug AND p.is_active = TRUE'
        );
        $statement->execute(['slug' => $slug]);
        $product = $statement->fetch();

        if (!is_array($product)) {
            return null;
        }

        $id = (int) $product['id'];
        $product['id'] = (string) $id;
        $product['origin'] = [
            'slug' => $product['origin_slug'],
            'name' => $product['origin_name'],
            'region' => $product['origin_region'],
        ];
        unset($product['origin_slug'], $product['origin_name'], $product['origin_region']);
        $product['categories'] = $this->productCategories($id);
        $product['flavor_tags'] = $this->productFlavorTags($id);
        $product['flavor_profile'] = $this->flavorProfile($id);
        $product['images'] = [];
        $product['variants'] = $this->variants($id);
        if ($variantId !== null && !$this->hasActiveVariant($id, $variantId)) {
            throw new InvalidArgumentException('Variant does not belong to the product.');
        }
        $product['freshness'] = $this->freshness($id, $variantId);

        return $product;
    }

    public function suggestions(string $query, int $limit): array
    {
        $statement = $this->pdo->prepare(
            'SELECT p.id, p.slug, p.name, o.slug AS origin_slug, o.name AS origin_name, o.region AS origin_region, ' .
            '(SELECT MIN(v.price_vnd) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = TRUE) AS starting_price_vnd, ' .
            'COALESCE((SELECT BOOL_OR(l.quantity_on_hand > 0) FROM inventory_lots l ' .
            'JOIN product_variants v ON v.id = l.variant_id AND v.product_id = p.id AND v.is_active = TRUE), FALSE) AS available ' .
            'FROM products p JOIN origins o ON o.id = p.origin_id AND o.is_active = TRUE ' .
            'WHERE p.is_active = TRUE AND (' .
            'p.name ILIKE :name_query ESCAPE CHR(92) OR o.name ILIKE :origin_query ESCAPE CHR(92) OR o.region ILIKE :region_query ESCAPE CHR(92) OR EXISTS (' .
            'SELECT 1 FROM product_flavor_tags pft JOIN flavor_tags ft ON ft.id = pft.flavor_tag_id AND ft.is_active = TRUE ' .
            'WHERE pft.product_id = p.id AND ft.name ILIKE :tag_query ESCAPE CHR(92))) ' .
            'ORDER BY p.name, p.id LIMIT :limit'
        );
        $pattern = '%' . $this->escapeLikePattern($query) . '%';
        $statement->bindValue(':name_query', $pattern);
        $statement->bindValue(':origin_query', $pattern);
        $statement->bindValue(':region_query', $pattern);
        $statement->bindValue(':tag_query', $pattern);
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->execute();

        $items = $statement->fetchAll();
        foreach ($items as &$item) {
            $id = (int) $item['id'];
            $item['id'] = (string) $id;
            $item['origin'] = [
                'slug' => $item['origin_slug'],
                'name' => $item['origin_name'],
                'region' => $item['origin_region'],
            ];
            unset($item['origin_slug'], $item['origin_name'], $item['origin_region']);
            $item['starting_price_vnd'] = $item['starting_price_vnd'] === null ? null : (int) $item['starting_price_vnd'];
            $item['available'] = $this->databaseBoolean($item['available']);
            $item['flavor_tags'] = $this->productFlavorTags($id);
        }
        unset($item);

        return $items;
    }

    /** @param array<string, mixed> $filters @return array{string, array<string, mixed>} */
    private function productFilters(array $filters): array
    {
        $conditions = [];
        $parameters = [];

        if (isset($filters['category_slug'])) {
            $conditions[] = ' AND EXISTS (SELECT 1 FROM product_categories pc JOIN categories c ON c.id = pc.category_id AND c.is_active = TRUE WHERE pc.product_id = p.id AND c.slug = :category_slug)';
            $parameters['category_slug'] = $filters['category_slug'];
        }
        if (isset($filters['origin_slug'])) {
            $conditions[] = ' AND o.slug = :origin_slug';
            $parameters['origin_slug'] = $filters['origin_slug'];
        }

        $priceConditions = [];
        if (isset($filters['min_price_vnd'])) {
            $priceConditions[] = 'v.price_vnd >= :min_price_vnd';
            $parameters['min_price_vnd'] = $filters['min_price_vnd'];
        }
        if (isset($filters['max_price_vnd'])) {
            $priceConditions[] = 'v.price_vnd <= :max_price_vnd';
            $parameters['max_price_vnd'] = $filters['max_price_vnd'];
        }
        if ($priceConditions !== []) {
            $conditions[] = ' AND EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.is_active = TRUE AND ' . implode(' AND ', $priceConditions) . ')';
        }
        if (isset($filters['in_stock'])) {
            $conditions[] = ' AND EXISTS (SELECT 1 FROM inventory_lots l JOIN product_variants v ON v.id = l.variant_id AND v.product_id = p.id AND v.is_active = TRUE WHERE l.quantity_on_hand > 0) = :in_stock';
            $parameters['in_stock'] = $filters['in_stock'];
        }
        if (isset($filters['flavor_tag_slug'])) {
            $conditions[] = ' AND EXISTS (SELECT 1 FROM product_flavor_tags pft JOIN flavor_tags ft ON ft.id = pft.flavor_tag_id AND ft.is_active = TRUE WHERE pft.product_id = p.id AND ft.slug = :flavor_tag_slug)';
            $parameters['flavor_tag_slug'] = $filters['flavor_tag_slug'];
        }

        return [implode('', $conditions), $parameters];
    }

    /** @param array<string, mixed> $parameters */
    private function bindFilters(PDOStatement $statement, array $parameters): void
    {
        foreach ($parameters as $key => $value) {
            $type = match (true) {
                is_int($value) => PDO::PARAM_INT,
                is_bool($value) => PDO::PARAM_BOOL,
                default => PDO::PARAM_STR,
            };
            $statement->bindValue(':' . $key, $value, $type);
        }
    }

    /** @return list<array{slug: string, name: string}> */
    private function productCategories(int $productId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT c.slug, c.name FROM categories c JOIN product_categories pc ON pc.category_id = c.id ' .
            'WHERE pc.product_id = :product_id AND c.is_active = TRUE ORDER BY c.display_order, c.name, c.id'
        );
        $statement->execute(['product_id' => $productId]);

        return $statement->fetchAll();
    }

    /** @return list<array{slug: string, name: string}> */
    private function productFlavorTags(int $productId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT ft.slug, ft.name FROM flavor_tags ft JOIN product_flavor_tags pft ON pft.flavor_tag_id = ft.id ' .
            'WHERE pft.product_id = :product_id AND ft.is_active = TRUE ORDER BY ft.name, ft.id'
        );
        $statement->execute(['product_id' => $productId]);

        return $statement->fetchAll();
    }

    /** @return array{acidity: int, body: int, sweetness: int, bitterness: int, aroma: int} */
    private function flavorProfile(int $productId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT acidity, body, sweetness, bitterness, aroma FROM products WHERE id = :product_id'
        );
        $statement->execute(['product_id' => $productId]);
        $profile = $statement->fetch();

        if (!is_array($profile)) {
            return ['acidity' => 3, 'body' => 3, 'sweetness' => 3, 'bitterness' => 3, 'aroma' => 3];
        }

        return array_map('intval', $profile);
    }

    private function hasActiveVariant(int $productId, int $variantId): bool
    {
        $statement = $this->pdo->prepare(
            'SELECT 1 FROM product_variants WHERE id = :variant_id AND product_id = :product_id AND is_active = TRUE'
        );
        $statement->execute(['variant_id' => $variantId, 'product_id' => $productId]);

        return $statement->fetchColumn() !== false;
    }

    /** @return list<array<string, mixed>> */
    private function variants(int $productId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT v.id, v.label, v.weight_g, v.price_vnd, ' .
            'COALESCE((SELECT SUM(l.quantity_on_hand) > 0 FROM inventory_lots l WHERE l.variant_id = v.id), FALSE) AS available ' .
            'FROM product_variants v WHERE v.product_id = :product_id AND v.is_active = TRUE ORDER BY v.weight_g, v.id'
        );
        $statement->execute(['product_id' => $productId]);
        $variants = $statement->fetchAll();

        foreach ($variants as &$variant) {
            $variant['id'] = (string) $variant['id'];
            $variant['weight_g'] = (int) $variant['weight_g'];
            $variant['price_vnd'] = (int) $variant['price_vnd'];
            $variant['available'] = $this->databaseBoolean($variant['available']);
        }
        unset($variant);

        return $variants;
    }

    /** @return array<string, mixed>|null */
    private function freshness(int $productId, ?int $variantId = null): ?array
    {
        $variantClause = $variantId === null ? '' : ' AND l.variant_id = :variant_id';
        $statement = $this->pdo->prepare(
            "SELECT b.roast_date FROM roast_batches b " .
            "JOIN inventory_lots l ON l.roast_batch_id = b.id AND l.product_id = b.product_id " .
            "JOIN product_variants v ON v.id = l.variant_id AND v.product_id = b.product_id AND v.is_active = TRUE " .
            "WHERE b.product_id = :product_id AND l.pool_kind = 'batch' AND l.quantity_on_hand > 0" . $variantClause . ' ' .
            'ORDER BY b.roast_date DESC, b.id DESC LIMIT 1'
        );
        $statement->bindValue(':product_id', $productId, PDO::PARAM_INT);
        if ($variantId !== null) {
            $statement->bindValue(':variant_id', $variantId, PDO::PARAM_INT);
        }
        $statement->execute();
        $roastDate = $statement->fetchColumn();

        if (!is_string($roastDate)) {
            return null;
        }

        $timezone = new DateTimeZone('Asia/Ho_Chi_Minh');
        $today = new DateTimeImmutable('today', $timezone);
        $roastedAt = new DateTimeImmutable($roastDate, $timezone);
        $ageDays = (int) $roastedAt->diff($today)->format('%r%a');
        $bestEnjoyedUntil = $roastedAt->modify('+30 days');
        $label = match (true) {
            $ageDays >= 0 && $ageDays <= 7 => 'Rất tươi',
            $ageDays >= 0 && $ageDays <= 21 => 'Tươi',
            default => null,
        };
        $message = $today > $bestEnjoyedUntil ? 'Đã qua mốc thưởng thức ngon nhất.' : null;

        return [
            'roast_date' => $roastedAt->format('Y-m-d'),
            'best_enjoyed_until' => $bestEnjoyedUntil->format('Y-m-d'),
            'age_days' => $ageDays,
            'label' => $label,
            'message' => $message,
        ];
    }

    private function escapeLikePattern(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    private function databaseBoolean(mixed $value): bool
    {
        return $value === true || $value === 1 || $value === '1' || $value === 't' || $value === 'true';
    }
}
