<?php

declare(strict_types=1);

namespace App\Http;

final class Router
{
    /** @var array<string, callable(string): Response> */
    private array $routes = [];

    /**
     * @param callable(string): Response $handler
     */
    public function get(string $path, callable $handler): void
    {
        $this->routes['GET ' . $path] = $handler;
    }

    public function dispatch(string $method, string $path, string $requestId): Response
    {
        $handler = $this->routes[strtoupper($method) . ' ' . $path] ?? null;

        if ($handler === null) {
            return JsonResponder::error(
                'NOT_FOUND',
                'Không tìm thấy tài nguyên.',
                404,
                $requestId,
            );
        }

        return $handler($requestId);
    }
}
