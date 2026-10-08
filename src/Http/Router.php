<?php

declare(strict_types=1);

namespace App\Http;

final class Router
{
    /** @var list<array{method: string, path: string, pattern: string, handler: callable}> */
    private array $routes = [];

    /** @param callable(string, array<string, string>, array<string, string>): Response $handler */
    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    /** @param callable(string, array<string, string>, array<string, string>, array<string, mixed>): Response $handler */
    public function post(string $path, callable $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    /** @param callable(string, array<string, string>, array<string, string>, array<string, mixed>): Response $handler */
    public function patch(string $path, callable $handler): void
    {
        $this->add('PATCH', $path, $handler);
    }

    /** @param callable(string, array<string, string>, array<string, string>, array<string, mixed>): Response $handler */
    public function put(string $path, callable $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    /** @param callable(string, array<string, string>, array<string, string>, array<string, mixed>): Response $handler */
    public function delete(string $path, callable $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    /** @param array<string, string> $query
     *  @param array<string, mixed> $body
     */
    public function dispatch(
        string $method,
        string $path,
        string $requestId,
        array $query = [],
        array $body = [],
    ): Response {
        $method = strtoupper($method);
        foreach ($this->routes as $route) {
            $matches = [];
            if ($route['method'] !== $method || preg_match($route['pattern'], $path, $matches) !== 1) {
                continue;
            }

            $parameters = [];
            foreach ($matches as $key => $value) {
                if (is_string($key)) {
                    $parameters[$key] = rawurldecode($value);
                }
            }

            if ($method === 'GET') {
                return ($route['handler'])($requestId, $parameters, $query);
            }

            return ($route['handler'])($requestId, $parameters, $query, $body);
        }

        return JsonResponder::error(
            'NOT_FOUND',
            'Không tìm thấy tài nguyên.',
            404,
            $requestId,
        );
    }

    private function add(string $method, string $path, callable $handler): void
    {
        $quotedPath = preg_quote($path, '#');
        $pattern = preg_replace_callback(
            '#\\\{([a-zA-Z_][a-zA-Z0-9_]*)\\\}#',
            static fn (array $matches): string => '(?P<' . $matches[1] . '>[^/]+)',
            $quotedPath,
        );

        if (!is_string($pattern)) {
            throw new \InvalidArgumentException('Invalid route pattern.');
        }

        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'pattern' => '#^' . $pattern . '$#',
            'handler' => $handler,
        ];
    }
}
