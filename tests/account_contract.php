<?php

declare(strict_types=1);

use App\Http\Response;
use App\Http\Router;

require_once dirname(__DIR__) . '/src/Http/Response.php';
require_once dirname(__DIR__) . '/src/Http/JsonResponder.php';
require_once dirname(__DIR__) . '/src/Http/Router.php';

function assertAuthContract(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$router = new Router();
$router->post('/api/v1/auth/register', static function (string $id, array $parameters, array $query, array $body): Response {
    return new Response(200, [], json_encode(['name' => $body['full_name'] ?? null], JSON_THROW_ON_ERROR));
});
$router->patch('/api/v1/account/me', static function (string $id, array $parameters, array $query, array $body): Response {
    return new Response(200, [], json_encode(['name' => $body['full_name'] ?? null], JSON_THROW_ON_ERROR));
});
$router->put('/api/v1/account/me/password', static fn (): Response => new Response(204, [], ''));

$register = $router->dispatch('POST', '/api/v1/auth/register', 'request-id', [], ['full_name' => 'Khách']);
$registerBody = json_decode($register->body, true, flags: JSON_THROW_ON_ERROR);
assertAuthContract(($registerBody['name'] ?? null) === 'Khách', 'POST body should reach route handlers.');
$profile = $router->dispatch('PATCH', '/api/v1/account/me', 'request-id', [], ['full_name' => 'Tên mới']);
$profileBody = json_decode($profile->body, true, flags: JSON_THROW_ON_ERROR);
assertAuthContract(($profileBody['name'] ?? null) === 'Tên mới', 'PATCH body should reach route handlers.');
assertAuthContract($router->dispatch('GET', '/api/v1/auth/register', 'request-id')->status === 404, 'Unsupported methods should remain not found.');

$service = file_get_contents(dirname(__DIR__) . '/src/Services/AuthService.php');
$repository = file_get_contents(dirname(__DIR__) . '/src/Repositories/UserRepository.php');
$sessionHandler = file_get_contents(dirname(__DIR__) . '/src/Auth/PdoSessionHandler.php');
assertAuthContract(is_string($service) && str_contains($service, 'password_hash('), 'Passwords should be hashed.');
assertAuthContract(is_string($repository) && str_contains($repository, 'email_digest'), 'Login limits should use a digest rather than plaintext email.');
assertAuthContract(is_string($sessionHandler) && str_contains($sessionHandler, "hash('sha256', "), 'Session IDs should be stored as hashes.');

fwrite(STDOUT, "Account contract checks passed.\n");
