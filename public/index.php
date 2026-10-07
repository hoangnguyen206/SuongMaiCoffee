<?php

declare(strict_types=1);

use App\Controllers\HealthController;
use App\Database\ConnectionFactory;
use App\Http\JsonResponder;
use App\Http\Response;
use App\Http\Router;

require_once dirname(__DIR__) . '/src/Http/Response.php';
require_once dirname(__DIR__) . '/src/Http/JsonResponder.php';
require_once dirname(__DIR__) . '/src/Http/Router.php';
require_once dirname(__DIR__) . '/src/Database/ConnectionFactory.php';
require_once dirname(__DIR__) . '/src/Controllers/HealthController.php';

$config = require dirname(__DIR__) . '/config/app.php';
$requestId = bin2hex(random_bytes(16));

try {
    $databaseFactory = new ConnectionFactory($config['database']);
    $healthController = new HealthController(static function () use ($databaseFactory): void {
        $connection = $databaseFactory->connect();
        $result = $connection->query('SELECT 1')->fetchColumn();

        if ((string) $result !== '1') {
            throw new RuntimeException('Database health query returned an unexpected result.');
        }
    });

    $router = new Router();
    $router->get('/api/v1/health', static fn (string $id): Response => $healthController->handle($id));

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $path = parse_url($requestUri, PHP_URL_PATH);
    $path = is_string($path) ? $path : '/';

    $response = $router->dispatch($method, $path, $requestId);
} catch (Throwable) {
    $response = JsonResponder::error(
        'INTERNAL_ERROR',
        'Đã xảy ra lỗi máy chủ.',
        500,
        $requestId,
    );
}

$response->send();
