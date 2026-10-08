<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;

final class UserRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return array{id: int, full_name: string, email: string, phone: string, role: string, status: string, password_hash: string}|null */
    public function findByEmail(string $email): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, full_name, email_normalized AS email, phone, role, status, password_hash ' .
            'FROM users WHERE email_normalized = :email',
        );
        $statement->execute(['email' => $email]);
        $user = $statement->fetch();

        return is_array($user) ? $this->normalizeUser($user, true) : null;
    }

    /** @return array{id: int, full_name: string, email: string, phone: string, role: string, status: string}|null */
    public function findById(int $id): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, full_name, email_normalized AS email, phone, role, status ' .
            'FROM users WHERE id = :id',
        );
        $statement->execute(['id' => $id]);
        $user = $statement->fetch();

        return is_array($user) ? $this->normalizeUser($user, false) : null;
    }

    /** @return array{id: int, full_name: string, email: string, phone: string, role: string, status: string, password_hash: string}|null */
    public function findByIdForPasswordCheck(int $id): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, full_name, email_normalized AS email, phone, role, status, password_hash ' .
            'FROM users WHERE id = :id',
        );
        $statement->execute(['id' => $id]);
        $user = $statement->fetch();

        return is_array($user) ? $this->normalizeUser($user, true) : null;
    }

    /** @param array{full_name: string, email: string, phone: string, password_hash: string} $values */
    public function create(array $values): int
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO users (full_name, email_normalized, phone, password_hash) ' .
            'VALUES (:full_name, :email, :phone, :password_hash) RETURNING id',
        );
        $statement->execute($values);

        return (int) $statement->fetchColumn();
    }

    /** @param array{full_name?: string, phone?: string} $values */
    public function updateProfile(int $id, array $values): void
    {
        $statement = $this->pdo->prepare(
            'UPDATE users SET full_name = COALESCE(:full_name, full_name), ' .
            'phone = COALESCE(:phone, phone), updated_at = CURRENT_TIMESTAMP WHERE id = :id',
        );
        $statement->execute([
            'id' => $id,
            'full_name' => $values['full_name'] ?? null,
            'phone' => $values['phone'] ?? null,
        ]);
    }

    public function updatePasswordHash(int $id, string $passwordHash): void
    {
        $statement = $this->pdo->prepare(
            'UPDATE users SET password_hash = :password_hash, updated_at = CURRENT_TIMESTAMP WHERE id = :id',
        );
        $statement->execute(['id' => $id, 'password_hash' => $passwordHash]);
    }

    public function isLoginBlocked(string $emailDigest): bool
    {
        $statement = $this->pdo->prepare(
            'SELECT blocked_until > CURRENT_TIMESTAMP FROM auth_login_attempts WHERE email_digest = :email_digest',
        );
        $statement->execute(['email_digest' => $emailDigest]);
        $blocked = $statement->fetchColumn();

        return $blocked === true || $blocked === 't' || $blocked === '1';
    }

    public function recordLoginFailure(string $emailDigest): void
    {
        $this->pdo->beginTransaction();
        try {
            $lock = $this->pdo->prepare(
                'SELECT email_digest FROM auth_login_attempts WHERE email_digest = :email_digest FOR UPDATE',
            );
            $lock->execute(['email_digest' => $emailDigest]);

            $statement = $this->pdo->prepare(
                'INSERT INTO auth_login_attempts (email_digest, window_started_at, attempt_count, blocked_until, updated_at) ' .
                'VALUES (:email_digest, CURRENT_TIMESTAMP, 1, NULL, CURRENT_TIMESTAMP) ' .
                'ON CONFLICT (email_digest) DO UPDATE SET ' .
                'attempt_count = CASE WHEN auth_login_attempts.window_started_at <= CURRENT_TIMESTAMP - INTERVAL \'15 minutes\' ' .
                'THEN 1 ELSE LEAST(5, auth_login_attempts.attempt_count + 1) END, ' .
                'window_started_at = CASE WHEN auth_login_attempts.window_started_at <= CURRENT_TIMESTAMP - INTERVAL \'15 minutes\' ' .
                'THEN CURRENT_TIMESTAMP ELSE auth_login_attempts.window_started_at END, ' .
                'blocked_until = CASE WHEN auth_login_attempts.window_started_at <= CURRENT_TIMESTAMP - INTERVAL \'15 minutes\' ' .
                'THEN NULL WHEN auth_login_attempts.attempt_count + 1 >= 5 ' .
                'THEN CURRENT_TIMESTAMP + INTERVAL \'15 minutes\' ELSE auth_login_attempts.blocked_until END, ' .
                'updated_at = CURRENT_TIMESTAMP',
            );
            $statement->execute(['email_digest' => $emailDigest]);
            $this->pdo->commit();
        } catch (\Throwable $exception) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $exception;
        }

        if (random_int(1, 100) === 1) {
            $this->pdo->exec(
                'DELETE FROM auth_login_attempts WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL \'24 hours\'',
            );
        }
    }

    public function clearLoginFailures(string $emailDigest): void
    {
        $statement = $this->pdo->prepare(
            'DELETE FROM auth_login_attempts WHERE email_digest = :email_digest',
        );
        $statement->execute(['email_digest' => $emailDigest]);
    }

    public function revokeOtherSessions(int $userId, string $currentSessionHash): void
    {
        $statement = $this->pdo->prepare(
            'DELETE FROM user_sessions WHERE user_id = :user_id AND session_id_hash <> :session_id_hash',
        );
        $statement->execute([
            'user_id' => $userId,
            'session_id_hash' => $currentSessionHash,
        ]);
    }

    /** @param array<string, mixed> $user
     *  @return array<string, mixed>
     */
    private function normalizeUser(array $user, bool $includePasswordHash): array
    {
        $normalized = [
            'id' => (int) $user['id'],
            'full_name' => (string) $user['full_name'],
            'email' => (string) $user['email'],
            'phone' => (string) $user['phone'],
            'role' => (string) $user['role'],
            'status' => (string) $user['status'],
        ];

        if ($includePasswordHash) {
            $normalized['password_hash'] = (string) $user['password_hash'];
        }

        return $normalized;
    }
}
