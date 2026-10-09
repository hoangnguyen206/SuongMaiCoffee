<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\JsonResponder;
use App\Http\Response;
use App\Services\CatalogService;
use InvalidArgumentException;
use Throwable;

final class CatalogController
{
    public function __construct(private readonly CatalogService $catalog)
    {
    }

    public function categories(string $requestId, array $parameters = [], array $query = []): Response
    {
        try {
            return JsonResponder::success($this->catalog->categories(), []);
        } catch (Throwable) {
            return $this->unavailable($requestId);
        }
    }

    /** @param array<string, string> $parameters @param array<string, string> $query */
    public function origins(string $requestId, array $parameters = [], array $query = []): Response
    {
        try {
            return JsonResponder::success($this->catalog->origins(), []);
        } catch (Throwable) {
            return $this->unavailable($requestId);
        }
    }

    public function flavors(string $requestId): Response
    {
        try {
            return JsonResponder::success($this->catalog->flavorTags(), []);
        } catch (Throwable) {
            return $this->unavailable($requestId);
        }
    }
    /** @param array<string, string> $parameters @param array<string, string> $query */
    public function products(string $requestId, array $parameters = [], array $query = []): Response
    {
        try {
            $result = $this->catalog->products($query);
            return JsonResponder::success($result['data'], $result['meta']);
        } catch (InvalidArgumentException) {
            return JsonResponder::error('VALIDATION_FAILED', 'Tham số lọc hoặc phân trang không hợp lệ.', 422, $requestId);
        } catch (Throwable) {
            return $this->unavailable($requestId);
        }
    }

    /** @param array<string, string> $parameters @param array<string, string> $query */
    public function product(string $requestId, array $parameters, array $query = []): Response
    {
        try {
            $product = $this->catalog->product((string) ($parameters['slug'] ?? ''), $query);
            if ($product === null) {
                return JsonResponder::error('NOT_FOUND', 'Không tìm thấy sản phẩm.', 404, $requestId);
            }

            return JsonResponder::success($product, []);
        } catch (InvalidArgumentException) {
            return JsonResponder::error('VALIDATION_FAILED', 'Mã sản phẩm không hợp lệ.', 422, $requestId);
        } catch (Throwable) {
            return $this->unavailable($requestId);
        }
    }

    /** @param array<string, string> $parameters @param array<string, string> $query */
    public function suggestions(string $requestId, array $parameters = [], array $query = []): Response
    {
        try {
            $term = $query['q'] ?? '';
            if (strlen($term) > 200) {
                return JsonResponder::error('VALIDATION_FAILED', 'Từ khóa tìm kiếm quá dài.', 422, $requestId);
            }

            return JsonResponder::success($this->catalog->suggestions($term), []);
        } catch (Throwable) {
            return $this->unavailable($requestId);
        }
    }

    private function unavailable(string $requestId): Response
    {
        return JsonResponder::error('DATABASE_UNAVAILABLE', 'Dịch vụ hiện không khả dụng.', 503, $requestId);
    }
}
