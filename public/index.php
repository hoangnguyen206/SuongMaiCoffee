<?php

declare(strict_types=1);

use App\Auth\PdoSessionHandler;
use App\Controllers\AuthController;
use App\Controllers\AdminController;
use App\Controllers\CatalogController;
use App\Controllers\CommerceController;
use App\Controllers\HealthController;
use App\Database\ConnectionFactory;
use App\Http\JsonResponder;
use App\Http\Response;
use App\Http\Router;
use App\Repositories\CatalogRepository;
use App\Repositories\AdminRepository;
use App\Repositories\CommerceRepository;
use App\Repositories\UserRepository;
use App\Services\AuthService;
use App\Services\AdminService;
use App\Services\CatalogService;
use App\Services\CommerceService;

require_once dirname(__DIR__) . '/src/Http/Response.php';
require_once dirname(__DIR__) . '/src/Http/JsonResponder.php';
require_once dirname(__DIR__) . '/src/Http/Router.php';
require_once dirname(__DIR__) . '/src/Support/VietnamPhone.php';
require_once dirname(__DIR__) . '/src/Database/ConnectionFactory.php';
require_once dirname(__DIR__) . '/src/Auth/AuthException.php';
require_once dirname(__DIR__) . '/src/Auth/PdoSessionHandler.php';
require_once dirname(__DIR__) . '/src/Repositories/UserRepository.php';
require_once dirname(__DIR__) . '/src/Services/AuthService.php';
require_once dirname(__DIR__) . '/src/Controllers/AuthController.php';
require_once dirname(__DIR__) . '/src/Repositories/AdminRepository.php';
require_once dirname(__DIR__) . '/src/Services/AdminService.php';
require_once dirname(__DIR__) . '/src/Controllers/AdminController.php';
require_once dirname(__DIR__) . '/src/Controllers/HealthController.php';
require_once dirname(__DIR__) . '/src/Repositories/CatalogReadRepository.php';
require_once dirname(__DIR__) . '/src/Repositories/CatalogRepository.php';
require_once dirname(__DIR__) . '/src/Services/CatalogService.php';
require_once dirname(__DIR__) . '/src/Controllers/CatalogController.php';
require_once dirname(__DIR__) . '/src/Commerce/CommerceException.php';
require_once dirname(__DIR__) . '/src/Repositories/CommerceRepository.php';
require_once dirname(__DIR__) . '/src/Services/CommerceService.php';
require_once dirname(__DIR__) . '/src/Controllers/CommerceController.php';

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
        'secure' => ($config['session']['cookie_secure'] ?? false) || (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
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
    $query = [];
    $rawQuery = parse_url($requestUri, PHP_URL_QUERY);
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
            $response = JsonResponder::error('INVALID_REQUEST', 'Yêu cầu vượt quá kích thước cho phép.', 400, $requestId);
        } else {
            $rawBody = file_get_contents('php://input');
            if (is_string($rawBody) && $rawBody !== '') {
                $decoded = json_decode($rawBody);
                if (!$decoded instanceof stdClass) {
                    $response = JsonResponder::error('INVALID_REQUEST', 'Dữ liệu JSON không hợp lệ.', 400, $requestId);
                } else {
                    $body = get_object_vars($decoded);
                }
            }
        }
    }

    if (!isset($response) && !in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $expectedToken = $_SESSION['csrf_token'] ?? '';
        if (!is_string($csrfToken) || !is_string($expectedToken) || $expectedToken === '' || !hash_equals($expectedToken, $csrfToken)) {
            $response = JsonResponder::error('CSRF_INVALID', 'Phiên không hợp lệ. Vui lòng tải lại trang và thử lại.', 403, $requestId);
        }
    }

    if (!isset($response)) {
        $router = new Router();
        $healthController = new HealthController(static function () use ($connectionFactory): void {
            $result = $connectionFactory->connect()->query('SELECT 1')->fetchColumn();
            if ((string) $result !== '1') throw new RuntimeException('Database health query returned an unexpected result.');
        });
        $router->get('/api/v1/health', static fn (string $id): Response => $healthController->handle($id));

        $rateLimitKey = $config['auth']['rate_limit_key'] ?? '';
        $authController = static fn (): AuthController => new AuthController(
            new AuthService(new UserRepository($connectionFactory->connect()), is_string($rateLimitKey) ? $rateLimitKey : ''),
            $sessionHandler,
        );
        $router->get('/api/v1/session', static fn (string $id): Response => $authController()->session($id, $_SESSION));
        $router->post('/api/v1/auth/register', static fn (string $id, array $parameters, array $query, array $body): Response => $authController()->register($id, $body, $_SESSION));
        $router->post('/api/v1/auth/login', static fn (string $id, array $parameters, array $query, array $body): Response => $authController()->login($id, $body, $_SESSION));
        $router->post('/api/v1/auth/logout', static fn (string $id): Response => $authController()->logout($id, $_SESSION));
        $router->get('/api/v1/account/me', static fn (string $id): Response => $authController()->currentUser($id, $_SESSION));
        $router->patch('/api/v1/account/me', static fn (string $id, array $parameters, array $query, array $body): Response => $authController()->updateProfile($id, $body, $_SESSION));
        $router->put('/api/v1/account/me/password', static fn (string $id, array $parameters, array $query, array $body): Response => $authController()->changePassword($id, $body, $_SESSION));

        $guestKey = (string) ($_SESSION['guest_cart_key'] ??= bin2hex(random_bytes(32)));
        $currentUserId = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
        $commerceResponse = static function (string $id, callable $operation) use ($connectionFactory): Response {
            try {
                $controller = new CommerceController(new CommerceService(new CommerceRepository($connectionFactory->connect())));
                return $operation($controller, $id);
            } catch (Throwable) {
                return JsonResponder::error('DATABASE_UNAVAILABLE', 'Dịch vụ hiện không khả dụng.', 503, $id);
            }
        };
        $adminAllowed = static function (?int $userId) use ($connectionFactory): bool {
            if ($userId === null) return false;
            $statement = $connectionFactory->connect()->prepare("SELECT 1 FROM users WHERE id = :id AND role = 'admin' AND status = 'active'");
            $statement->execute(['id' => $userId]);
            return $statement->fetchColumn() !== false;
        };

        $router->get('/api/v1/grind-options', static function (string $id) use ($commerceResponse): Response {
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->grindOptions($requestId));
        });
        $router->get('/api/v1/cart', static function (string $id) use ($commerceResponse, $currentUserId, $guestKey): Response {
            return $commerceResponse($id, static function (CommerceController $controller, string $requestId) use ($currentUserId, $guestKey): Response {
                return $controller->cart($requestId, $currentUserId, $guestKey);
            });
        });
        $router->post('/api/v1/cart/items', static function (string $id, array $parameters, array $query, array $body) use ($commerceResponse, $currentUserId, $guestKey): Response {
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->add($requestId, $currentUserId, $guestKey, $body));
        });
        $router->patch('/api/v1/cart/items/{lineId}', static function (string $id, array $parameters, array $query, array $body) use ($commerceResponse, $currentUserId, $guestKey): Response {
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->update($requestId, $currentUserId, $guestKey, $parameters, $body));
        });
        $router->delete('/api/v1/cart/items/{lineId}', static function (string $id, array $parameters) use ($commerceResponse, $currentUserId, $guestKey): Response {
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->remove($requestId, $currentUserId, $guestKey, $parameters));
        });
        $router->post('/api/v1/cart/coupon', static function (string $id, array $parameters, array $query, array $body) use ($commerceResponse, $currentUserId, $guestKey): Response {
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->applyCoupon($requestId, $currentUserId, $guestKey, $body));
        });
        $router->delete('/api/v1/cart/coupon', static function (string $id) use ($commerceResponse, $currentUserId, $guestKey): Response {
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->clearCoupon($requestId, $currentUserId, $guestKey));
        });
        $router->post('/api/v1/cart/merge', static function (string $id) use ($commerceResponse, $currentUserId, $guestKey): Response {
            if ($currentUserId === null) return JsonResponder::error('UNAUTHENTICATED', 'Vui lòng đăng nhập để tiếp tục.', 401, $id);
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->merge($requestId, $currentUserId, $guestKey));
        });
        $router->post('/api/v1/checkout/orders', static function (string $id, array $parameters, array $query, array $body) use ($commerceResponse, $currentUserId, $guestKey): Response {
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->checkout($requestId, $currentUserId, $guestKey, $body, (string) ($_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? '')));
        });
        $router->get('/api/v1/account/orders', static function (string $id) use ($commerceResponse, $currentUserId): Response {
            if ($currentUserId === null) return JsonResponder::error('UNAUTHENTICATED', 'Vui lòng đăng nhập để tiếp tục.', 401, $id);
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->orders($requestId, $currentUserId));
        });
        $router->get('/api/v1/account/orders/{code}', static function (string $id, array $parameters) use ($commerceResponse, $currentUserId): Response {
            if ($currentUserId === null) return JsonResponder::error('UNAUTHENTICATED', 'Vui lòng đăng nhập để tiếp tục.', 401, $id);
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->order($requestId, $currentUserId, $parameters));
        });
        $lookupRateLimit = static function (string $requestId) use ($connectionFactory, $config): ?Response {
            $clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $clientIp = is_string($clientIp) ? trim($clientIp) : 'unknown';
            if (filter_var($clientIp, FILTER_VALIDATE_IP) === false) {
                $clientIp = 'unknown';
            }
            $rateKey = (string) ($config['auth']['rate_limit_key'] ?? '');
            $digest = hash_hmac('sha256', $clientIp, $rateKey);
            $pdo = null;
            try {
                $pdo = $connectionFactory->connect();
                $pdo->beginTransaction();
                $insert = $pdo->prepare("INSERT INTO guest_lookup_attempts (ip_digest, window_started_at, attempt_count) VALUES (:digest, CURRENT_TIMESTAMP, 1) ON CONFLICT (ip_digest) DO NOTHING RETURNING ip_digest");
                $insert->execute(['digest' => $digest]);
                if ($insert->fetchColumn() !== false) {
                    $pdo->commit();
                    return null;
                }

                $lock = $pdo->prepare('SELECT window_started_at, attempt_count, blocked_until FROM guest_lookup_attempts WHERE ip_digest = :digest FOR UPDATE');
                $lock->execute(['digest' => $digest]);
                $row = $lock->fetch();
                if (!is_array($row)) {
                    throw new RuntimeException('Guest lookup rate-limit record is unavailable.');
                }
                if ($row['blocked_until'] !== null && strtotime((string) $row['blocked_until']) > time()) {
                    $pdo->commit();
                    return JsonResponder::error('RATE_LIMITED', 'Vui lòng thử lại sau.', 429, $requestId);
                }
                if (strtotime((string) $row['window_started_at']) <= time() - 900) {
                    $reset = $pdo->prepare("UPDATE guest_lookup_attempts SET window_started_at = CURRENT_TIMESTAMP, attempt_count = 1, blocked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE ip_digest = :digest");
                    $reset->execute(['digest' => $digest]);
                } elseif ((int) $row['attempt_count'] >= 5) {
                    $block = $pdo->prepare("UPDATE guest_lookup_attempts SET blocked_until = CURRENT_TIMESTAMP + INTERVAL '15 minutes', updated_at = CURRENT_TIMESTAMP WHERE ip_digest = :digest");
                    $block->execute(['digest' => $digest]);
                    $pdo->commit();
                    return JsonResponder::error('RATE_LIMITED', 'Vui lòng thử lại sau.', 429, $requestId);
                } else {
                    $increment = $pdo->prepare('UPDATE guest_lookup_attempts SET attempt_count = attempt_count + 1, updated_at = CURRENT_TIMESTAMP WHERE ip_digest = :digest');
                    $increment->execute(['digest' => $digest]);
                }
                $pdo->commit();
                return null;
            } catch (Throwable) {
                if ($pdo instanceof PDO && $pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                return JsonResponder::error('LOOKUP_UNAVAILABLE', 'Dịch vụ tra cứu hiện không khả dụng.', 503, $requestId);
            }
        };
        $router->post('/api/v1/orders/lookup', static function (string $id, array $parameters, array $query, array $body) use ($commerceResponse, $lookupRateLimit): Response {
            $limited = $lookupRateLimit($id);
            if ($limited !== null) return $limited;
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->guestLookup($requestId, $body));
        });

        $router->get('/api/v1/admin/orders', static function (string $id, array $parameters, array $query) use ($commerceResponse, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->adminOrders($requestId, $query['status'] ?? null));
        });
        $router->get('/api/v1/admin/orders/{code}', static function (string $id, array $parameters) use ($commerceResponse, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->adminOrder($requestId, $parameters));
        });
        $router->patch('/api/v1/admin/orders/{code}', static function (string $id, array $parameters, array $query, array $body) use ($commerceResponse, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->updateStatus($requestId, $parameters, $body, $currentUserId));
        });
        $router->get('/api/v1/admin/inventory', static function (string $id) use ($commerceResponse, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->inventory($requestId));
        });
        $router->post('/api/v1/admin/inventory/adjust', static function (string $id, array $parameters, array $query, array $body) use ($commerceResponse, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            return $commerceResponse($id, static fn (CommerceController $controller, string $requestId): Response => $controller->adjustInventory($requestId, $body, $currentUserId));
        });

        $router->get('/api/v1/admin/dashboard', static function (string $id) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            return $controller->handle($id, static fn (AdminService $service): array => $service->dashboard());
        });
        $router->get('/api/v1/admin/products', static function (string $id, array $parameters, array $query) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            return $controller->handle($id, static fn (AdminService $service): array => $service->products($query['q'] ?? null));
        });
        $router->get('/api/v1/admin/product-options', static function (string $id) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            return $controller->handle($id, static fn (AdminService $service): array => $service->productOptions());
        });
        $router->post('/api/v1/admin/products', static function (string $id, array $parameters, array $query, array $body) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            return $controller->handle($id, static fn (AdminService $service): array => $service->saveProduct($body));
        });
        $router->patch('/api/v1/admin/products/{id}', static function (string $id, array $parameters, array $query, array $body) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            $entityId = filter_var($parameters['id'] ?? null, FILTER_VALIDATE_INT);
            if (!is_int($entityId) || $entityId < 1) return JsonResponder::error('VALIDATION_FAILED', 'Mã sản phẩm không hợp lệ.', 422, $id);
            return $controller->handle($id, static fn (AdminService $service): array => $service->saveProduct($body, $entityId));
        });
        $router->post('/api/v1/admin/products/{id}/active', static function (string $id, array $parameters, array $query, array $body) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            $entityId = filter_var($parameters['id'] ?? null, FILTER_VALIDATE_INT);
            if (!is_int($entityId) || $entityId < 1 || !is_bool($body['is_active'] ?? null)) return JsonResponder::error('VALIDATION_FAILED', 'Thông tin hiển thị sản phẩm không hợp lệ.', 422, $id);
            return $controller->handle($id, static fn (AdminService $service): array => $service->setProductActive($entityId, $body['is_active']));
        });
        $router->get('/api/v1/admin/coupons', static function (string $id) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            return $controller->handle($id, static fn (AdminService $service): array => $service->coupons());
        });
        $router->post('/api/v1/admin/coupons', static function (string $id, array $parameters, array $query, array $body) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            return $controller->handle($id, static fn (AdminService $service): array => $service->saveCoupon($body));
        });
        $router->patch('/api/v1/admin/coupons/{id}', static function (string $id, array $parameters, array $query, array $body) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            $entityId = filter_var($parameters['id'] ?? null, FILTER_VALIDATE_INT);
            if (!is_int($entityId) || $entityId < 1) return JsonResponder::error('VALIDATION_FAILED', 'Mã ưu đãi không hợp lệ.', 422, $id);
            return $controller->handle($id, static fn (AdminService $service): array => $service->saveCoupon($body, $entityId));
        });
        $router->post('/api/v1/admin/coupons/{id}/active', static function (string $id, array $parameters, array $query, array $body) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            $entityId = filter_var($parameters['id'] ?? null, FILTER_VALIDATE_INT);
            if (!is_int($entityId) || $entityId < 1 || !is_bool($body['is_active'] ?? null)) return JsonResponder::error('VALIDATION_FAILED', 'Thông tin trạng thái ưu đãi không hợp lệ.', 422, $id);
            return $controller->handle($id, static fn (AdminService $service): array => $service->setCouponActive($entityId, $body['is_active']));
        });
        $router->get('/api/v1/admin/content', static function (string $id) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            return $controller->handle($id, static fn (AdminService $service): array => $service->content());
        });
        $router->put('/api/v1/admin/content', static function (string $id, array $parameters, array $query, array $body) use ($connectionFactory, $currentUserId, $adminAllowed): Response {
            if (!$adminAllowed($currentUserId)) return JsonResponder::error($currentUserId === null ? 'UNAUTHENTICATED' : 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', $currentUserId === null ? 401 : 403, $id);
            if ($currentUserId === null) return JsonResponder::error('UNAUTHENTICATED', 'Vui lòng đăng nhập để tiếp tục.', 401, $id);
            $controller = new AdminController(new AdminService(new AdminRepository($connectionFactory->connect())));
            return $controller->handle($id, static fn (AdminService $service): array => $service->saveContent($body, $currentUserId));
        });
        $catalogResponse = static function (string $id, callable $operation) use ($connectionFactory): Response {
            try {
                $controller = new CatalogController(new CatalogService(new CatalogRepository($connectionFactory->connect())));
                return $operation($controller, $id);
            } catch (Throwable) {
                return JsonResponder::error('DATABASE_UNAVAILABLE', 'Dịch vụ hiện không khả dụng.', 503, $id);
            }
        };
        $router->get('/api/v1/categories', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
            return $catalogResponse($id, static fn (CatalogController $controller, string $requestId): Response => $controller->categories($requestId, $parameters, $query));
        });
        $router->get('/api/v1/origins', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
            return $catalogResponse($id, static fn (CatalogController $controller, string $requestId): Response => $controller->origins($requestId, $parameters, $query));
        });
        $router->get('/api/v1/flavors', static function (string $id) use ($catalogResponse): Response {
            return $catalogResponse($id, static fn (CatalogController $controller, string $requestId): Response => $controller->flavors($requestId));
        });
        $router->get('/api/v1/products', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
            return $catalogResponse($id, static fn (CatalogController $controller, string $requestId): Response => $controller->products($requestId, $parameters, $query));
        });
        $router->get('/api/v1/products/{slug}', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
            return $catalogResponse($id, static fn (CatalogController $controller, string $requestId): Response => $controller->product($requestId, $parameters, $query));
        });
        $router->get('/api/v1/search/suggestions', static function (string $id, array $parameters, array $query) use ($catalogResponse): Response {
            return $catalogResponse($id, static fn (CatalogController $controller, string $requestId): Response => $controller->suggestions($requestId, [], $query));
        });
        $response = $router->dispatch($method, $path, $requestId, $query, $body);
        if ($response->status === 404 && $method === 'GET' && !str_starts_with($path, '/api/v1/')) {
            $notFoundPage = file_get_contents(__DIR__ . '/404.html');
            if (is_string($notFoundPage)) {
                $response = new Response(404, ['Content-Type' => 'text/html; charset=utf-8'], $notFoundPage);
            }
        }
    }
} catch (Throwable) {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
    $path = parse_url($requestUri, PHP_URL_PATH);
    if ($method === 'GET' && (!is_string($path) || !str_starts_with($path, '/api/v1/'))) {
        $errorPage = file_get_contents(__DIR__ . '/500.html');
        $response = is_string($errorPage)
            ? new Response(500, ['Content-Type' => 'text/html; charset=utf-8'], $errorPage)
            : JsonResponder::error('INTERNAL_ERROR', 'Đã xảy ra lỗi máy chủ.', 500, $requestId);
    } else {
        $response = JsonResponder::error('INTERNAL_ERROR', 'Đã xảy ra lỗi máy chủ.', 500, $requestId);
    }
}

$response->send();
