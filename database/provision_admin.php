<?php

declare(strict_types=1);

use App\Database\ConnectionFactory;

require_once dirname(__DIR__) . '/src/Database/ConnectionFactory.php';

$email = getenv('ADMIN_EMAIL') ?: '';
$name = getenv('ADMIN_NAME') ?: '';
$phone = getenv('ADMIN_PHONE') ?: '';
$password = getenv('ADMIN_PASSWORD') ?: '';
if ($email === '' || $name === '' || $phone === '' || $password === '') {
    fwrite(STDERR, "Set ADMIN_EMAIL, ADMIN_NAME, ADMIN_PHONE and ADMIN_PASSWORD in the environment.\n");
    exit(1);
}
if (strlen($password) < 8 || preg_match('/\p{L}/u', $password) !== 1 || preg_match('/\p{N}/u', $password) !== 1) {
    fwrite(STDERR, "ADMIN_PASSWORD must be at least 8 characters and contain letters and numbers.\n");
    exit(1);
}
$config = require dirname(__DIR__) . '/config/app.php';
$pdo = (new ConnectionFactory($config['database']))->connect();
$statement = $pdo->prepare(
    'INSERT INTO users (full_name, email_normalized, phone, password_hash, role, status)
     VALUES (:name, :email, :phone, :password_hash, \'admin\', \'active\')
     ON CONFLICT (email_normalized) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, password_hash = EXCLUDED.password_hash, role = \'admin\', status = \'active\''
);
$statement->execute([
    'name' => trim($name),
    'email' => strtolower(trim($email)),
    'phone' => trim($phone),
    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
]);
fwrite(STDOUT, "Admin account provisioned.\n");
