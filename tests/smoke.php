<?php

declare(strict_types=1);

use App\Controllers\HealthController;
use App\Http\JsonResponder;
use App\Http\Response;
use App\Http\Router;

require_once dirname(__DIR__) . '/src/Http/Response.php';
require_once dirname(__DIR__) . '/src/Http/JsonResponder.php';
require_once dirname(__DIR__) . '/src/Http/Router.php';
require_once dirname(__DIR__) . '/src/Controllers/HealthController.php';

function assertSameValue(mixed $expected, mixed $actual, string $message): void
{
    if ($expected !== $actual) {
        throw new RuntimeException($message);
    }
}

$router = new Router();
$router->get('/api/v1/health', static function (string $requestId): Response {
    return (new HealthController(static function (): void {
    }))->handle($requestId);
});

$requestId = 'smoke-test-request-id';
$healthy = $router->dispatch('GET', '/api/v1/health', $requestId);
$healthyBody = json_decode($healthy->body, true, flags: JSON_THROW_ON_ERROR);
assertSameValue(200, $healthy->status, 'Health route should return HTTP 200.');
assertSameValue('ok', $healthyBody['data']['status'] ?? null, 'Health response should report app status.');
assertSameValue('connected', $healthyBody['data']['database'] ?? null, 'Health response should report a successful database check.');

$unhealthyController = new HealthController(static function (): void {
    throw new RuntimeException('simulated database failure');
});
$unhealthy = $unhealthyController->handle($requestId);
$unhealthyBody = json_decode($unhealthy->body, true, flags: JSON_THROW_ON_ERROR);
assertSameValue(503, $unhealthy->status, 'Database failure should return HTTP 503.');
assertSameValue('DATABASE_UNAVAILABLE', $unhealthyBody['error']['code'] ?? null, 'Database failure should use the expected error code.');
assertSameValue($requestId, $unhealthyBody['error']['request_id'] ?? null, 'Error response should include the request ID.');

$missing = $router->dispatch('GET', '/not-found', $requestId);
$missingBody = json_decode($missing->body, true, flags: JSON_THROW_ON_ERROR);
assertSameValue(404, $missing->status, 'Unknown route should return HTTP 404.');
assertSameValue('NOT_FOUND', $missingBody['error']['code'] ?? null, 'Unknown route should use the JSON error envelope.');

$methodMismatch = $router->dispatch('POST', '/api/v1/health', $requestId);
assertSameValue(404, $methodMismatch->status, 'Unsupported route method should not match the GET health endpoint.');

$encodedSuccess = JsonResponder::success(['status' => 'ok'], []);
$encodedBody = json_decode($encodedSuccess->body, true, flags: JSON_THROW_ON_ERROR);
assertSameValue(['data' => ['status' => 'ok'], 'meta' => []], $encodedBody, 'Success response should use the API envelope.');

fwrite(STDOUT, "Bootstrap smoke checks passed.\n");
