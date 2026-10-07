<?php

declare(strict_types=1);

use App\Controllers\CatalogController;
use App\Controllers\HealthController;
use App\Database\ConnectionFactory;
use App\Http\JsonResponder;
use App\Http\Response;
use App\Http\Router;
use App\Repositories\CatalogRepository;
use App\Services\CatalogService;

require_once dirname(__DIR__) . '/src/Http/Response.php';
require_once dirname(__DIR__) . '/src/Http/JsonResponder.php';
require_once dirname(__DIR__) . '/src/Http/Router.php';
require_once dirname(__DIR__) . '/src/Database/ConnectionFactory.php';
require_once dirname(__DIR__) . '/src/Controllers/HealthController.php';
require_once dirname(__DIR__) . '/src/Repositories/CatalogReadRepository.php';
require_once dirname(__DIR__) . '/src/Repositories/CatalogRepository.php';
require_once dirname(__DIR__) . '/src/Services/CatalogService.php';
require_once dirname(__DIR__) . '/src/Controllers/CatalogController.php';

$config = require dirname(__DIR__) . '/config/app.php';
$requestId = bin2hex(random_bytes(16));

try {
    $connectionFactory = new ConnectionFactory($config['database']);
    $healthController = new HealthController(static function () use ($connectionFactory): void {
        $connection = $connectionFactory->connect();
        $result = $connection->query('SELECT 1')->fetchColumn();

        if ((string) $result !== '1') {
            throw new RuntimeException('Database health query returned an unexpected result.');
        }
    });

    $router = new Router();
    $router->get('/api/v1/health', static fn (string $id): Response => $healthController->handle($id));

    $catalogResponse = static function (string $requestId, callable $operation) use ($connectionFactory): Response {
        try {
            $controller = new CatalogController(
                new CatalogService(new CatalogRepository($connectionFactory->connect())),
            );

            return $operation($controller, $requestId);
        } catch (Throwable) {
            return JsonResponder::error(
                'DATABASE_UNAVAILABLE',
                'Dịch vụ hiện không khả dụng.',
                503,
                $requestId,
            );
        }
    };

    $router->get('/api/v1/categories', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
        return $catalogResponse($id, static function (CatalogController $controller, string $requestId) use ($parameters, $query): Response {
            return $controller->categories($requestId, $parameters, $query);
        });
    });
    $router->get('/api/v1/origins', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
        return $catalogResponse($id, static function (CatalogController $controller, string $requestId) use ($parameters, $query): Response {
            return $controller->origins($requestId, $parameters, $query);
        });
    });
    $router->get('/api/v1/products', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
        return $catalogResponse($id, static function (CatalogController $controller, string $requestId) use ($parameters, $query): Response {
            return $controller->products($requestId, $parameters, $query);
        });
    });
    $router->get('/api/v1/products/{slug}', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
        return $catalogResponse($id, static function (CatalogController $controller, string $requestId) use ($parameters, $query): Response {
            return $controller->product($requestId, $parameters, $query);
        });
    });
    $router->get('/api/v1/search/suggestions', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
        return $catalogResponse($id, static function (CatalogController $controller, string $requestId) use ($query): Response {
            return $controller->suggestions($requestId, [], $query);
        });
    });

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $path = parse_url($requestUri, PHP_URL_PATH);
    $path = is_string($path) ? $path : '/';
    $rawQuery = parse_url($requestUri, PHP_URL_QUERY);
    $query = [];
    if (is_string($rawQuery)) {
        parse_str($rawQuery, $parsedQuery);
        foreach ($parsedQuery as $key => $value) {
            if (is_string($key) && is_scalar($value)) {
                $query[$key] = (string) $value;
            }
        }
    }

    $response = $router->dispatch($method, $path, $requestId, $query);
} catch (Throwable) {
    $response = JsonResponder::error(
        'INTERNAL_ERROR',
        'Đã xảy ra lỗi máy chủ.',
        500,
        $requestId,
    );
}

$response->send();
