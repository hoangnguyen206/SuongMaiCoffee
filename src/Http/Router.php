<?php

declare(strict_types=1);

namespace App\Http;

final class Router
{
    /** @var list<array{path: string, pattern: string, handler: callable}> */
    private array $routes = [];

    /**
     * @param callable(string, array<string, string>, array<string, string>): Response $handler
     */
    public function get(string $path, callable $handler): void
    {
        $quotedPath = preg_quote($path, '#');
        $pattern = preg_replace_callback(
            '#\\\\\{([a-zA-Z_][a-zA-Z0-9_]*)\\\\\}#',
            static fn (array $matches): string => '(?P<' . $matches[1] . '>[^/]+)',
            $quotedPath,
        );

        if (!is_string($pattern)) {
            throw new \InvalidArgumentException('Invalid route pattern.');
        }

        $this->routes[] = [
            'path' => $path,
            'pattern' => '#^' . $pattern . '$#',
            'handler' => $handler,
        ];
    }

    /**
     * @param array<string, string> $query
     */
    public function dispatch(string $method, string $path, string $requestId, array $query = []): Response
    {
        if (strtoupper($method) !== 'GET') {
            return JsonResponder::error(
                'NOT_FOUND',
                'Không tìm thấy tài nguyên.',
                404,
                $requestId,
            );
        }

        foreach ($this->routes as $route) {
            $matches = [];
            if (preg_match($route['pattern'], $path, $matches) !== 1) {
                continue;
            }

            $parameters = [];
            foreach ($matches as $key => $value) {
                if (is_string($key)) {
                    $parameters[$key] = rawurldecode($value);
                }
            }

            return ($route['handler'])($requestId, $parameters, $query);
        }

        return JsonResponder::error(
            'NOT_FOUND',
            'Không tìm thấy tài nguyên.',
            404,
            $requestId,
        );
    }
}
