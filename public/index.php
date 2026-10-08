<?php

declare(strict_types=1);

use App\Auth\AuthException;
use App\Auth\PdoSessionHandler;
use App\Controllers\AuthController;
use App\Controllers\CatalogController;
use App\Controllers\HealthController;
use App\Database\ConnectionFactory;
use App\Http\JsonResponder;
use App\Http\Response;
use App\Http\Router;
use App\Repositories\CatalogRepository;
use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\CatalogService;

require_once dirname(__DIR__) . '/src/Http/Response.php';
require_once dirname(__DIR__) . '/src/Http/JsonResponder.php';
require_once dirname(__DIR__) . '/src/Http/Router.php';
require_once dirname(__DIR__) . '/src/Database/ConnectionFactory.php';
require_once dirname(__DIR__) . '/src/Auth/AuthException.php';
require_once dirname(__DIR__) . '/src/Auth/PdoSessionHandler.php';
require_once dirname(__DIR__) . '/src/Repositories/UserRepository.php';
require_once dirname(__DIR__) . '/src/Services/AuthService.php';
require_once dirname(__DIR__) . '/src/Controllers/AuthController.php';
require_once dirname(__DIR__) . '/src/Controllers/HealthController.php';
require_once dirname(__DIR__) . '/src/Repositories/CatalogReadRepository.php';
require_once dirname(__DIR__) . '/src/Repositories/CatalogRepository.php';
require_once dirname(__DIR__) . '/src/Services/CatalogService.php';
require_once dirname(__DIR__) . '/src/Controllers/CatalogController.php';

$config = require dirname(__DIR__) . '/config/app.php';
$requestId = bin2hex(random_bytes(16));

try {
    $connectionFactory = new ConnectionFactory($config['database']);
    $sessionHandler = new PdoSessionHandler($connectionFactory->connect());
    session_name('SMSESSID');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_set_save_handler($sessionHandler, true);
    if (!session_start()) {
        throw new RuntimeException('Unable to start session.');
    }
    $sessionHandler->setUserId(isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null);

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
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

    $body = [];
    if ($method !== 'GET' && $method !== 'HEAD') {
        $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
        if ($contentLength > 65536) {
            $response = JsonResponder::error(
                'INVALID_REQUEST',
                'Yêu cầu vượt quá kích thước cho phép.',
                400,
                $requestId,
            );
        } else {
            $rawBody = file_get_contents('php://input');
            if (is_string($rawBody) && $rawBody !== '') {
                $decoded = json_decode($rawBody);
                if (!$decoded instanceof stdClass) {
                    $response = JsonResponder::error(
                        'INVALID_REQUEST',
                        'Dữ liệu JSON không hợp lệ.',
                        400,
                        $requestId,
                    );
                } else {
                    $body = get_object_vars($decoded);
                }
            }
        }
    }

    if (!isset($response) && !in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $expectedToken = $_SESSION['csrf_token'] ?? '';
        if (!is_string($csrfToken) || !is_string($expectedToken) || $expectedToken === ''
            || !hash_equals($expectedToken, $csrfToken)
        ) {
            $response = JsonResponder::error(
                'CSRF_INVALID',
                'Phiên không hợp lệ. Vui lòng tải lại trang và thử lại.',
                403,
                $requestId,
            );
        }
    }

    if (!isset($response)) {
        $router = new Router();
        $healthController = new HealthController(static function () use ($connectionFactory): void {
            $result = $connectionFactory->connect()->query('SELECT 1')->fetchColumn();
            if ((string) $result !== '1') {
                throw new RuntimeException('Database health query returned an unexpected result.');
            }
        });
        $router->get('/api/v1/health', static fn (string $id): Response => $healthController->handle($id));

        $rateLimitKey = $config['auth']['rate_limit_key'] ?? '';
        $authController = static fn (): AuthController => new AuthController(
            new AuthService(new UserRepository($connectionFactory->connect()), is_string($rateLimitKey) ? $rateLimitKey : ''),
            $sessionHandler,
        );

        $router->get('/api/v1/session', static fn (string $id): Response =>
            $authController()->session($id, $_SESSION));
        $router->post('/api/v1/auth/register', static fn (string $id, array $parameters, array $query, array $body): Response =>
            $authController()->register($id, $body, $_SESSION));
        $router->post('/api/v1/auth/login', static fn (string $id, array $parameters, array $query, array $body): Response =>
            $authController()->login($id, $body, $_SESSION));
        $router->post('/api/v1/auth/logout', static fn (string $id): Response =>
            $authController()->logout($id, $_SESSION));
        $router->get('/api/v1/account/me', static fn (string $id): Response =>
            $authController()->currentUser($id, $_SESSION));
        $router->patch('/api/v1/account/me', static fn (string $id, array $parameters, array $query, array $body): Response =>
            $authController()->updateProfile($id, $body, $_SESSION));
        $router->put('/api/v1/account/me/password', static fn (string $id, array $parameters, array $query, array $body): Response =>
            $authController()->changePassword($id, $body, $_SESSION));

        $catalogResponse = static function (string $id, callable $operation) use ($connectionFactory): Response {
            try {
                $controller = new CatalogController(
                    new CatalogService(new CatalogRepository($connectionFactory->connect())),
                );

                return $operation($controller, $id);
            } catch (Throwable) {
                return JsonResponder::error(
                    'DATABASE_UNAVAILABLE',
                    'Dịch vụ hiện không khả dụng.',
                    503,
                    $id,
                );
            }
        };

        $router->get('/api/v1/categories', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
            return $catalogResponse($id, static fn (CatalogController $controller, string $requestId): Response =>
                $controller->categories($requestId, $parameters, $query));
        });
        $router->get('/api/v1/origins', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
            return $catalogResponse($id, static fn (CatalogController $controller, string $requestId): Response =>
                $controller->origins($requestId, $parameters, $query));
        });
        $router->get('/api/v1/products', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
            return $catalogResponse($id, static fn (CatalogController $controller, string $requestId): Response =>
                $controller->products($requestId, $parameters, $query));
        });
        $router->get('/api/v1/products/{slug}', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
            return $catalogResponse($id, static fn (CatalogController $controller, string $requestId): Response =>
                $controller->product($requestId, $parameters, $query));
        });
        $router->get('/api/v1/search/suggestions', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
            return $catalogResponse($id, static fn (CatalogController $controller, string $requestId): Response =>
                $controller->suggestions($requestId, [], $query));
        });

        $response = $router->dispatch($method, $path, $requestId, $query, $body);
    }
} catch (Throwable) {
    $response = JsonResponder::error(
        'INTERNAL_ERROR',
        'Đã xảy ra lỗi máy chủ.',
        500,
        $requestId,
    );
}

$response->send();
