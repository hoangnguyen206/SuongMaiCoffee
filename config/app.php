<?php

declare(strict_types=1);

return [
    'environment' => getenv('APP_ENV') ?: 'production',
    'database' => [
        'url' => getenv('DATABASE_URL') ?: null,
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => getenv('DB_PORT') ?: '5432',
        'name' => getenv('DB_NAME') ?: '',
        'user' => getenv('DB_USER') ?: '',
        'password' => getenv('DB_PASSWORD') ?: '',
        'sslmode' => getenv('DB_SSLMODE') ?: null,
        'connect_timeout' => max(1, (int) (getenv('DB_CONNECT_TIMEOUT') ?: 3)),
    ],
    'auth' => [
        'rate_limit_key' => getenv('AUTH_RATE_LIMIT_KEY') ?: null,
    ],
];
