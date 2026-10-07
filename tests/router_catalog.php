<?php

declare(strict_types=1);

use App\Http\Response;
use App\Http\Router;

require_once dirname(__DIR__) . '/src/Http/Response.php';
require_once dirname(__DIR__) . '/src/Http/JsonResponder.php';
require_once dirname(__DIR__) . '/src/Http/Router.php';

function assertRouter(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$router = new Router();
$router->get('/api/v1/products/{slug}', static function (string $requestId, array $parameters, array $query): Response {
    return new Response(200, [], json_encode(['slug' => $parameters['slug'], 'q' => $query['q'] ?? null], JSON_THROW_ON_ERROR));
});
$router->get('/api/v1/search/suggestions', static function (string $requestId, array $parameters, array $query): Response {
    return new Response(200, [], json_encode(['q' => $query['q'] ?? null], JSON_THROW_ON_ERROR));
});

$detail = $router->dispatch('GET', '/api/v1/products/demo%20slug', 'request-id', ['variant_id' => '7']);
$detailBody = json_decode($detail->body, true, flags: JSON_THROW_ON_ERROR);
assertRouter(($detailBody['slug'] ?? null) === 'demo slug', 'Route parameters should be decoded once.');
assertRouter(($detailBody['q'] ?? null) === null, 'Product route should not invent query fields.');

$suggestions = $router->dispatch('GET', '/api/v1/search/suggestions', 'request-id', ['q' => 'cà phê']);
$suggestionsBody = json_decode($suggestions->body, true, flags: JSON_THROW_ON_ERROR);
assertRouter(($suggestionsBody['q'] ?? null) === 'cà phê', 'Query values should reach route handlers.');

fwrite(STDOUT, "Router route-parameter checks passed.\n");
