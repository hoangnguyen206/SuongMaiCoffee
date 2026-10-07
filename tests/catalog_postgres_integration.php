<?php

declare(strict_types=1);

use App\Controllers\CatalogController;
use App\Database\ConnectionFactory;
use App\Repositories\CatalogReadRepository;
use App\Repositories\CatalogRepository;
use App\Services\CatalogService;

require_once dirname(__DIR__) . '/src/Http/Response.php';
require_once dirname(__DIR__) . '/src/Http/JsonResponder.php';
require_once dirname(__DIR__) . '/src/Repositories/CatalogReadRepository.php';
require_once dirname(__DIR__) . '/src/Repositories/CatalogRepository.php';
require_once dirname(__DIR__) . '/src/Services/CatalogService.php';
require_once dirname(__DIR__) . '/src/Controllers/CatalogController.php';
require_once dirname(__DIR__) . '/src/Database/ConnectionFactory.php';

function assertCatalog(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$databaseUrl = getenv('CATALOG_TEST_DATABASE_URL');
if (!is_string($databaseUrl) || $databaseUrl === '') {
    fwrite(STDOUT, "SKIP: Set CATALOG_TEST_DATABASE_URL to a disposable PostgreSQL 17 database.\n");
    exit(0);
}

if (!extension_loaded('pdo_pgsql')) {
    fwrite(STDOUT, "BLOCKED: pdo_pgsql is required for Catalog PostgreSQL integration tests.\n");
    exit(2);
}

$config = require dirname(__DIR__) . '/config/app.php';
$config['database']['url'] = $databaseUrl;
$pdo = (new ConnectionFactory($config['database']))->connect();

$schema = 'catalog_test_' . bin2hex(random_bytes(5));
$pdo->exec('CREATE SCHEMA ' . $schema);
$pdo->exec('SET search_path TO ' . $schema);

try {
    $migration = file_get_contents(dirname(__DIR__) . '/database/migrations/001_catalog.sql');
    $seed = file_get_contents(dirname(__DIR__) . '/database/seeds/001_catalog_demo.sql');
    assertCatalog(is_string($migration) && is_string($seed), 'Migration or seed file could not be read.');
    $pdo->exec($migration);
    $pdo->exec($seed);

    $repository = new CatalogRepository($pdo);
    $service = new CatalogService($repository);
    $controller = new CatalogController($service);

    assertCatalog(count($service->categories()) === 2, 'Expected demo category rows.');
    assertCatalog(count($service->origins()) === 1, 'Expected demo origin rows.');

    $list = $service->products(['in_stock' => 'true']);
    assertCatalog(count($list['data']) === 2, 'Expected two available demo products.');
    assertCatalog(($list['data'][0]['available'] ?? null) === true, 'Availability must be a boolean.');
    assertCatalog(!array_key_exists('quantity_on_hand', $list['data'][0]), 'Public listing must not expose stock quantity.');

    $detail = $service->product('ca-phe-demo-01');
    assertCatalog(is_array($detail), 'Product detail should be available by slug.');
    assertCatalog(($detail['freshness']['age_days'] ?? null) === 5, 'Freshness should be based on the demo batch date.');
    assertCatalog(($detail['freshness']['label'] ?? null) === 'Rất tươi', 'Five-day batch should be labeled Rất tươi.');
    assertCatalog(!array_key_exists('roast_batch_id', $detail), 'Public product detail must not expose batch identifiers.');
    assertCatalog(!array_key_exists('quantity_on_hand', $detail), 'Public product detail must not expose stock quantities.');

    $variant = $detail['variants'][0]['id'] ?? null;
    assertCatalog(is_string($variant), 'Variant IDs should be returned as strings.');
    $variantDetail = $service->product('ca-phe-demo-01', ['variant_id' => $variant]);
    assertCatalog(($variantDetail['freshness']['age_days'] ?? null) === 5, 'Variant-specific freshness should select its batch.');

    assertCatalog($service->suggestions('c') === [], 'Search under two characters must return no suggestions.');
    assertCatalog(count($service->suggestions('cà')) <= 8, 'Search must cap suggestions at eight.');

    $invalid = $controller->products('catalog-test', [], ['per_page' => '101']);
    assertCatalog($invalid->status === 422, 'Invalid pagination must return 422.');

    fwrite(STDOUT, "Catalog PostgreSQL integration checks passed.\n");
} finally {
    $pdo->exec('DROP SCHEMA ' . $schema . ' CASCADE');
}
