<?php

declare(strict_types=1);

namespace App\Repositories;

interface CatalogReadRepository
{
    /** @return list<array<string, mixed>> */
    public function categories(): array;

    /** @return list<array<string, mixed>> */
    public function origins(): array;

    /**
     * @param array{category_slug?: string, origin_slug?: string, min_price_vnd?: int, max_price_vnd?: int, in_stock?: bool} $filters
     * @return array{items: list<array<string, mixed>>, total_items: int}
     */
    public function products(array $filters, int $page, int $perPage, string $sort): array;

    /** @return array<string, mixed>|null */
    public function productBySlug(string $slug, ?int $variantId = null): ?array;

    /** @return list<array<string, mixed>> */
    public function suggestions(string $query, int $limit): array;
}
