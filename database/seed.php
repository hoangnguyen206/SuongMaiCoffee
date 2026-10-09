<?php

declare(strict_types=1);

use App\Database\ConnectionFactory;

if ((getenv('APP_ENV') ?: 'production') === 'production') {
    fwrite(STDERR, "Development seeds are disabled in production.
");
    exit(1);
}

require_once dirname(__DIR__) . '/src/Database/ConnectionFactory.php';

$config = require dirname(__DIR__) . '/config/app.php';
$pdo = (new ConnectionFactory($config['database']))->connect();

foreach (['001_catalog_demo.sql', '002_commerce_demo.sql'] as $seedName) {
    $seedFile = __DIR__ . '/seeds/' . $seedName;
    $sql = file_get_contents($seedFile);
    if (!is_string($sql)) {
        throw new RuntimeException('Unable to read demo seed.');
    }

    $pdo->beginTransaction();
    try {
        $pdo->exec($sql);
        $pdo->commit();
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        throw $exception;
    }
}

fwrite(STDOUT, "Catalog, commerce coupons and accounts seeded.\n");
