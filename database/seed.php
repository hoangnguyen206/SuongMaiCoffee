<?php

declare(strict_types=1);

use App\Database\ConnectionFactory;

require_once dirname(__DIR__) . '/src/Database/ConnectionFactory.php';

$config = require dirname(__DIR__) . '/config/app.php';
$pdo = (new ConnectionFactory($config['database']))->connect();

$seedFile = __DIR__ . '/seeds/001_catalog_demo.sql';
$sql = file_get_contents($seedFile);
if (!is_string($sql)) {
    throw new RuntimeException('Unable to read Catalog demo seed.');
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

fwrite(STDOUT, "Catalog demo seed applied. All records are learning placeholders.\n");
