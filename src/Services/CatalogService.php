<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\CatalogReadRepository;
use InvalidArgumentException;

final class CatalogService
{
    public function __construct(private readonly CatalogReadRepository $catalog)
    {
    }

    /** @return list<array<string, mixed>> */
    public function categories(): array
    {
        return $this->catalog->categories();
    }

    /** @return list<array<string, mixed>> */
    public function origins(): array
    {
        return $this->catalog->origins();
    }

    /** @return list<array<string, mixed>> */
    public function flavorTags(): array
    {
        return $this->catalog->flavorTags();
    }
    public function products(array $query): array
    {
        $allowed = ['page', 'per_page', 'sort', 'category_slug', 'origin_slug', 'min_price_vnd', 'max_price_vnd', 'in_stock', 'flavor_tag_slug'];
        if (array_diff(array_keys($query), $allowed) !== []) {
            throw new InvalidArgumentException('Unsupported catalog filter.');
        }

        $page = $this->integer($query, 'page', 1, 1, 1000000);
        $perPage = $this->integer($query, 'per_page', 20, 1, 100);
        $sort = $query['sort'] ?? 'newest';
        if (!in_array($sort, ['newest', 'price_asc', 'price_desc', 'name_asc'], true)) {
            throw new InvalidArgumentException('Invalid sort value.');
        }

        $filters = [];
        foreach (['category_slug', 'origin_slug'] as $key) {
            if (isset($query[$key]) && trim($query[$key]) !== '') {
                $filters[$key] = trim($query[$key]);
            }
        }
        foreach (['min_price_vnd', 'max_price_vnd'] as $key) {
            if (isset($query[$key])) {
                $filters[$key] = $this->integer($query, $key, 0, 0, PHP_INT_MAX);
            }
        }
        if (isset($query['in_stock'])) {
            $filters['in_stock'] = match ($query['in_stock']) {
                'true', '1' => true,
                'false', '0' => false,
                default => throw new InvalidArgumentException('Invalid stock filter.'),
            };
        }
        if (isset($query['flavor_tag_slug']) && trim($query['flavor_tag_slug']) !== '') {
            $filters['flavor_tag_slug'] = trim($query['flavor_tag_slug']);
        }

        if (isset($filters['min_price_vnd'], $filters['max_price_vnd']) && $filters['min_price_vnd'] > $filters['max_price_vnd']) {
            throw new InvalidArgumentException('Invalid price range.');
        }

        $result = $this->catalog->products($filters, $page, $perPage, $sort);
        $totalPages = (int) ceil($result['total_items'] / $perPage);

        return [
            'data' => $result['items'],
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total_items' => $result['total_items'],
                'total_pages' => $totalPages,
            ],
        ];
    }

    /** @param array<string, string> $query @return array<string, mixed>|null */
    public function product(string $slug, array $query = []): ?array
    {
        if ($slug === '' || strlen($slug) > 160) {
            throw new InvalidArgumentException('Invalid product slug.');
        }

        $variantId = null;
        if (isset($query['variant_id'])) {
            $variantId = $this->integer($query, 'variant_id', 0, 1, PHP_INT_MAX);
        }

        return $this->catalog->productBySlug($slug, $variantId);
    }

    /** @return list<array<string, mixed>> */
    public function suggestions(string $query): array
    {
        $query = trim($query);
        $characterCount = preg_match_all('/./us', $query);
        if ($characterCount === false || $characterCount < 2) {
            return [];
        }

        return $this->catalog->suggestions($query, 8);
    }

    /** @param array<string, string> $query */
    private function integer(array $query, string $key, int $default, int $minimum, int $maximum): int
    {
        if (!isset($query[$key])) {
            return $default;
        }

        $value = filter_var($query[$key], FILTER_VALIDATE_INT);
        if (!is_int($value) || $value < $minimum || $value > $maximum) {
            throw new InvalidArgumentException('Invalid integer query parameter.');
        }

        return $value;
    }
}
