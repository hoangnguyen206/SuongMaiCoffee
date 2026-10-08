<?php

declare(strict_types=1);

namespace App\Auth;

use PDO;
use SessionHandlerInterface;
use SessionUpdateTimestampHandlerInterface;

final class PdoSessionHandler implements SessionHandlerInterface, SessionUpdateTimestampHandlerInterface
{
    private ?int $userId = null;

    public function __construct(private readonly PDO $pdo)
    {
    }

    public function setUserId(?int $userId): void
    {
        $this->userId = $userId;
    }

    public function open(string $path, string $name): bool
    {
        return true;
    }

    public function close(): bool
    {
        return true;
    }

    public function read(string $id): string|false
    {
        $statement = $this->pdo->prepare(
            'SELECT session_data FROM user_sessions ' .
            'WHERE session_id_hash = :session_id_hash ' .
            'AND last_activity >= CURRENT_TIMESTAMP - INTERVAL \'2 hours\'',
        );
        $statement->execute(['session_id_hash' => hash('sha256', $id)]);
        $data = $statement->fetchColumn();

        return is_string($data) ? $data : '';
    }

    public function validateId(string $id): bool
    {
        $statement = $this->pdo->prepare(
            'SELECT 1 FROM user_sessions WHERE session_id_hash = :session_id_hash ' .
            'AND last_activity >= CURRENT_TIMESTAMP - INTERVAL \'2 hours\'',
        );
        $statement->execute(['session_id_hash' => hash('sha256', $id)]);

        return $statement->fetchColumn() !== false;
    }

    public function updateTimestamp(string $id, string $data): bool
    {
        $statement = $this->pdo->prepare(
            'UPDATE user_sessions SET user_id = :user_id, session_data = :session_data, ' .
            'last_activity = CURRENT_TIMESTAMP WHERE session_id_hash = :session_id_hash',
        );
        $statement->execute([
            'user_id' => $this->userId,
            'session_data' => $data,
            'session_id_hash' => hash('sha256', $id),
        ]);

        return $statement->rowCount() > 0;
    }

    public function write(string $id, string $data): bool
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO user_sessions (session_id_hash, user_id, session_data, last_activity) ' .
            'VALUES (:session_id_hash, :user_id, :session_data, CURRENT_TIMESTAMP) ' .
            'ON CONFLICT (session_id_hash) DO UPDATE SET ' .
            'user_id = EXCLUDED.user_id, session_data = EXCLUDED.session_data, ' .
            'last_activity = CURRENT_TIMESTAMP',
        );

        return $statement->execute([
            'session_id_hash' => hash('sha256', $id),
            'user_id' => $this->userId,
            'session_data' => $data,
        ]);
    }

    public function destroy(string $id): bool
    {
        $statement = $this->pdo->prepare(
            'DELETE FROM user_sessions WHERE session_id_hash = :session_id_hash',
        );

        return $statement->execute(['session_id_hash' => hash('sha256', $id)]);
    }

    public function gc(int $max_lifetime): int|false
    {
        $statement = $this->pdo->prepare(
            'DELETE FROM user_sessions WHERE last_activity < CURRENT_TIMESTAMP - (:max_lifetime * INTERVAL \'1 second\')',
        );
        $statement->execute(['max_lifetime' => max(1, $max_lifetime)]);

        return $statement->rowCount();
    }
}
