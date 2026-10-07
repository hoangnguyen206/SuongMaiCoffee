<?php

declare(strict_types=1);

namespace App\Database;

use InvalidArgumentException;
use PDO;

final class ConnectionFactory
{
    /** @param array<string, mixed> $configuration */
    public function __construct(private readonly array $configuration)
    {
    }

    public function connect(): PDO
    {
        [$dsn, $username, $password] = $this->connectionParameters();

        return new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }

    /**
     * @return array{string, ?string, ?string}
     */
    private function connectionParameters(): array
    {
        $url = $this->configuration['url'] ?? null;

        if (is_string($url) && $url !== '') {
            return $this->parametersFromUrl($url);
        }

        $host = $this->requiredString('host');
        $port = $this->requiredString('port');
        $name = $this->requiredString('name');
        $username = $this->requiredString('user');
        $password = $this->configuration['password'] ?? '';
        $sslmode = $this->configuration['sslmode'] ?? null;
        $timeout = max(1, (int) ($this->configuration['connect_timeout'] ?? 3));

        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s;connect_timeout=%d',
            $host,
            $port,
            $name,
            $timeout,
        );

        if (is_string($sslmode) && $sslmode !== '') {
            $dsn .= ';sslmode=' . $this->validatedSslMode($sslmode);
        }

        return [$dsn, $username, is_string($password) ? $password : ''];
    }

    /**
     * @return array{string, ?string, ?string}
     */
    private function parametersFromUrl(string $url): array
    {
        $parts = parse_url($url);

        if (!is_array($parts) || !isset($parts['scheme'], $parts['host'], $parts['path'])) {
            throw new InvalidArgumentException('Invalid PostgreSQL connection URL.');
        }

        if (!in_array(strtolower($parts['scheme']), ['postgres', 'postgresql'], true)) {
            throw new InvalidArgumentException('Unsupported database URL scheme.');
        }

        $database = ltrim($parts['path'], '/');
        if ($database === '') {
            throw new InvalidArgumentException('Database name is required.');
        }

        $query = [];
        parse_str($parts['query'] ?? '', $query);
        $sslmode = $query['sslmode'] ?? null;
        $timeout = max(1, (int) ($query['connect_timeout'] ?? $this->configuration['connect_timeout'] ?? 3));

        $host = $parts['host'];
        if (str_contains($host, ':') && !str_starts_with($host, '[')) {
            $host = '[' . $host . ']';
        }

        $dsn = sprintf(
            'pgsql:host=%s;port=%d;dbname=%s;connect_timeout=%d',
            $host,
            $parts['port'] ?? 5432,
            $database,
            $timeout,
        );

        if (is_string($sslmode) && $sslmode !== '') {
            $dsn .= ';sslmode=' . $this->validatedSslMode($sslmode);
        }

        return [
            $dsn,
            isset($parts['user']) ? rawurldecode($parts['user']) : null,
            isset($parts['pass']) ? rawurldecode($parts['pass']) : null,
        ];
    }

    private function requiredString(string $key): string
    {
        $value = $this->configuration[$key] ?? null;

        if (!is_string($value) || $value === '') {
            throw new InvalidArgumentException('Missing database configuration.');
        }

        return $value;
    }

    private function validatedSslMode(string $sslmode): string
    {
        $allowed = ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'];

        if (!in_array($sslmode, $allowed, true)) {
            throw new InvalidArgumentException('Invalid PostgreSQL SSL mode.');
        }

        return $sslmode;
    }
}
