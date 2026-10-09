<?php

declare(strict_types=1);

use App\Auth\AuthException;
use App\Auth\PdoSessionHandler;
use App\Database\ConnectionFactory;
use App\Repositories\UserRepository;
use App\Services\AuthService;

require_once dirname(__DIR__) . '/src/Auth/AuthException.php';
require_once dirname(__DIR__) . '/src/Auth/PdoSessionHandler.php';
require_once dirname(__DIR__) . '/src/Database/ConnectionFactory.php';
require_once dirname(__DIR__) . '/src/Support/VietnamPhone.php';
require_once dirname(__DIR__) . '/src/Repositories/UserRepository.php';
require_once dirname(__DIR__) . '/src/Services/AuthService.php';

function assertAuth(bool $condition, string $message): void
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
    fwrite(STDOUT, "BLOCKED: pdo_pgsql is required for Account integration tests.\n");
    exit(2);
}

$config = require dirname(__DIR__) . '/config/app.php';
$config['database']['url'] = $databaseUrl;
$pdo = (new ConnectionFactory($config['database']))->connect();
$schema = 'account_test_' . bin2hex(random_bytes(5));
$pdo->exec('CREATE SCHEMA ' . $schema);
$pdo->exec('SET search_path TO ' . $schema);

try {
    $migration = file_get_contents(dirname(__DIR__) . '/database/migrations/002_accounts.sql');
    assertAuth(is_string($migration), 'Account migration could not be read.');
    $pdo->exec($migration);

    $repository = new UserRepository($pdo);
    $service = new AuthService($repository, 'integration-test-rate-limit-key-2026');
    $user = $service->register([
        'full_name' => 'Khách hàng thử nghiệm',
        'email' => '  Auth.Test@example.com ',
        'phone' => '0901234567',
        'password' => 'CoffeePass123',
    ]);
    assertAuth($user['email'] === 'auth.test@example.com', 'Registration should normalize the email.');
    assertAuth($user['role'] === 'customer', 'Self-registration must assign Customer role server-side.');
    $stored = $repository->findByEmail('auth.test@example.com');
    assertAuth(is_array($stored) && password_verify('CoffeePass123', $stored['password_hash']), 'Password should be stored as a valid password hash.');
    assertAuth($stored['password_hash'] !== 'CoffeePass123', 'Plaintext password must never be stored.');

    $loggedIn = $service->login('AUTH.TEST@example.com', 'CoffeePass123');
    assertAuth($loggedIn['id'] === $user['id'], 'Login should resolve the normalized account.');

    $badLoginRejected = false;
    try {
        $service->login('auth.test@example.com', 'WrongPass123');
    } catch (AuthException $exception) {
        $badLoginRejected = $exception->status === 401;
    }
    assertAuth($badLoginRejected, 'Invalid password must return an authentication error.');

    assertAuth($user['phone'] === '0901234567', 'Registration should normalize Vietnamese phone numbers.');
    assertAuth($service->updateProfile($user['id'], ['phone' => '+84909876543'])['phone'] === '0909876543', 'Profile should accept and normalize international legacy Vietnamese phone format.');

    $service->changePassword($user['id'], ['current_password' => 'CoffeePass123', 'new_password' => 'NewCoffee123'], hash('sha256', 'active-session'));
    $service->login('auth.test@example.com', 'NewCoffee123');

    $limitEmail = 'lockout@example.com';
    $digest = hash_hmac('sha256', $limitEmail, 'integration-test-rate-limit-key-2026');
    for ($attempt = 0; $attempt < 5; $attempt++) {
        try {
            $service->login($limitEmail, 'WrongPass123');
        } catch (AuthException) {
        }
    }
    $limitEnforced = false;
    try {
        $service->login($limitEmail, 'WrongPass123');
    } catch (AuthException $exception) {
        $limitEnforced = $exception->status === 429;
    }
    assertAuth($limitEnforced, 'Fifth failed login should block further attempts.');
    assertAuth($repository->isLoginBlocked($digest), 'Login failure lockout should be persisted using the digest.');

    $handler = new PdoSessionHandler($pdo);
    $handler->setUserId($user['id']);
    assertAuth($handler->write('test-session-id', 'user_id|i:1;'), 'Session handler should persist data.');
    assertAuth($handler->read('test-session-id') === 'user_id|i:1;', 'Session handler should read saved session data.');
    assertAuth($handler->validateId('test-session-id'), 'Session handler should validate an existing ID.');
    $handler->setUserId(null);
    assertAuth($handler->updateTimestamp('test-session-id', 'user_id|i:1;'), 'Session handler should update activity.');
    assertAuth($handler->destroy('test-session-id'), 'Session handler should destroy a session.');

    fwrite(STDOUT, "Account PostgreSQL integration checks passed.\n");
} finally {
    $pdo->exec('SET search_path TO public');
    $pdo->exec('DROP SCHEMA ' . $schema . ' CASCADE');
}
