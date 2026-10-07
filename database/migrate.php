<?php

declare(strict_types=1);

use App\Database\ConnectionFactory;

require_once dirname(__DIR__) . '/src/Database/ConnectionFactory.php';

$config = require dirname(__DIR__) . '/config/app.php';
$pdo = (new ConnectionFactory($config['database']))->connect();

$migrationDirectory = __DIR__ . '/migrations';
$files = glob($migrationDirectory . '/*.sql');
sort($files, SORT_STRING);

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (' .
    'version VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)'
);

foreach ($files as $file) {
    $version = basename($file);
    $check = $pdo->prepare('SELECT 1 FROM schema_migrations WHERE version = :version');
    $check->execute(['version' => $version]);

    if ($check->fetchColumn() !== false) {
        continue;
    }

    $sql = file_get_contents($file);
    if (!is_string($sql)) {
        throw new RuntimeException('Unable to read migration file.');
    }

    $pdo->beginTransaction();
    try {
        $pdo->exec($sql);
        $record = $pdo->prepare('INSERT INTO schema_migrations (version) VALUES (:version)');
        $record->execute(['version' => $version]);
        $pdo->commit();
        fwrite(STDOUT, "Applied {$version}.\n");
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        throw $exception;
    }
}

fwrite(STDOUT, "Catalog migrations are up to date.\n");
