<?php

declare(strict_types=1);

use App\Controllers\CatalogController;
use App\Http\JsonResponder;
use App\Http\Response;
use App\Http\Router;
use App\Repositories\CatalogReadRepository;
use App\Services\CatalogService;

require_once dirname(__DIR__) . '/src/Http/Response.php';
require_once dirname(__DIR__) . '/src/Http/JsonResponder.php';
require_once dirname(__DIR__) . '/src/Http/Router.php';
require_once dirname(__DIR__) . '/src/Repositories/CatalogReadRepository.php';
require_once dirname(__DIR__) . '/src/Repositories/CatalogRepository.php';
require_once dirname(__DIR__) . '/src/Services/CatalogService.php';
require_once dirname(__DIR__) . '/src/Controllers/CatalogController.php';

function assertSameValue(mixed $expected, mixed $actual, string $message): void
{
    if ($expected !== $actual) {
        throw new RuntimeException($message);
    }
}

final class FakeCatalogRepository implements CatalogReadRepository
{
    public function categories(): array
    {
        return [['slug' => 'demo', 'name' => 'Demo']];
    }

    public function origins(): array
    {
        return [['slug' => 'origin-demo', 'name' => 'Origin demo', 'region' => 'PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC.']];
    }

    public function flavorTags(): array
    {
        return [['slug' => 'flavor-demo', 'name' => 'Flavor demo']];
    }

    public function products(array $filters, int $page, int $perPage, string $sort): array
    {
        return [
            'items' => [[
                'id' => '1',
                'slug' => 'demo-product',
                'name' => 'Demo product',
                'description' => 'Demo description',
                'available' => true,
                'images' => [],
            ]],
            'total_items' => 1,
        ];
    }

    public function productBySlug(string $slug, ?int $variantId = null): ?array
    {
        return $slug === 'demo-product' ? [
            'id' => '1',
            'slug' => $slug,
            'name' => 'Demo product',
            'variants' => [['id' => '2', 'price_vnd' => 185000, 'available' => true]],
            'freshness' => null,
        ] : null;
    }

    public function suggestions(string $query, int $limit): array
    {
        return $query === 'de' ? [['id' => '1', 'slug' => 'demo-product', 'name' => 'Demo product', 'available' => true]] : [];
    }
}

$service = new CatalogService(new FakeCatalogRepository());
$controller = new CatalogController($service);
$requestId = 'catalog-test-request-id';

$products = $service->products(['per_page' => '1']);
assertSameValue(1, count($products['data']), 'Product list should return fixture data.');
assertSameValue(1, $products['meta']['total_items'], 'Product list should include total count.');
assertSameValue([], $service->suggestions('d'), 'Short search query should return no suggestions.');
assertSameValue(1, count($service->suggestions('de')), 'Valid search query should return suggestions.');
assertSameValue(null, $service->product('missing'), 'Unknown product should return null.');

$productResponse = $controller->product($requestId, ['slug' => 'demo-product']);
$productBody = json_decode($productResponse->body, true, flags: JSON_THROW_ON_ERROR);
assertSameValue(200, $productResponse->status, 'Product detail should return HTTP 200.');
assertSameValue('demo-product', $productBody['data']['slug'] ?? null, 'Product detail should use public product fields.');

$invalid = $controller->products($requestId, [], ['per_page' => '101']);
assertSameValue(422, $invalid->status, 'Invalid pagination should return HTTP 422.');

$router = new Router();
$router->get('/api/v1/products/{slug}', [$controller, 'product']);
$routerResponse = $router->dispatch('GET', '/api/v1/products/demo-product', $requestId);
assertSameValue(200, $routerResponse->status, 'Router should dispatch product slug parameters.');

$encodedSuccess = JsonResponder::success(['name' => '<text>'], []);
$encodedBody = json_decode($encodedSuccess->body, true, flags: JSON_THROW_ON_ERROR);
assertSameValue('<text>', $encodedBody['data']['name'] ?? null, 'JSON response should preserve text for client-side text rendering.');

fwrite(STDOUT, "Catalog contract smoke checks passed.\n");
