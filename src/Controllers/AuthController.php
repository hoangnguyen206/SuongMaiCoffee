<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\AuthException;
use App\Auth\PdoSessionHandler;
use App\Http\JsonResponder;
use App\Http\Response;
use App\Services\AuthService;

final class AuthController
{
    public function __construct(
        private readonly AuthService $auth,
        private readonly PdoSessionHandler $sessionHandler,
    ) {
    }

    /** @param array<string, mixed> $session */
    public function session(string $requestId, array &$session): Response
    {
        return $this->respond($requestId, function () use (&$session): array {
            $user = null;
            $userId = $session['user_id'] ?? null;
            if (is_int($userId) || (is_string($userId) && ctype_digit($userId))) {
                try {
                    $user = $this->auth->currentUser((int) $userId);
                } catch (AuthException $exception) {
                    if ($exception->status !== 401 && $exception->status !== 403) {
                        throw $exception;
                    }
                    unset($session['user_id']);
                    $this->sessionHandler->setUserId(null);
                }
            }

            if (!isset($session['csrf_token']) || !is_string($session['csrf_token'])) {
                $session['csrf_token'] = bin2hex(random_bytes(32));
            }

            return [
                'authenticated' => $user !== null,
                'csrf_token' => $session['csrf_token'],
                'user' => $user,
            ];
        }, 200);
    }

    /** @param array<string, mixed> $input
     *  @param array<string, mixed> $session
     */
    public function register(string $requestId, array $input, array &$session): Response
    {
        return $this->respond($requestId, function () use ($input, &$session): array {
            $user = $this->auth->register($input);
            $this->establishSession($user, $session);

            return $this->sessionData($user, $session);
        }, 201);
    }

    /** @param array<string, mixed> $input
     *  @param array<string, mixed> $session
     */
    public function login(string $requestId, array $input, array &$session): Response
    {
        return $this->respond($requestId, function () use ($input, &$session): array {
            $user = $this->auth->login($input['email'] ?? null, $input['password'] ?? null);
            $this->establishSession($user, $session);

            return $this->sessionData($user, $session);
        }, 200);
    }

    /** @param array<string, mixed> $session */
    public function logout(string $requestId, array &$session): Response
    {
        return $this->respond($requestId, function () use (&$session): array {
            $_SESSION = [];
            $session = [];
            $this->sessionHandler->setUserId(null);
            if (!session_regenerate_id(true)) {
                throw new AuthException('Không thể làm mới phiên.', 'INTERNAL_ERROR', 500);
            }
            $session['csrf_token'] = bin2hex(random_bytes(32));

            return [
                'authenticated' => false,
                'csrf_token' => $session['csrf_token'],
                'user' => null,
            ];
        }, 200);
    }

    /** @param array<string, mixed> $session */
    public function currentUser(string $requestId, array $session): Response
    {
        return $this->respond($requestId, function () use ($session): array {
            return $this->auth->currentUser($this->authenticatedId($session));
        });
    }

    /** @param array<string, mixed> $input
     *  @param array<string, mixed> $session
     */
    public function updateProfile(string $requestId, array $input, array $session): Response
    {
        return $this->respond($requestId, function () use ($input, $session): array {
            return $this->auth->updateProfile($this->authenticatedId($session), $input);
        });
    }

    /** @param array<string, mixed> $input
     *  @param array<string, mixed> $session
     */
    public function changePassword(string $requestId, array $input, array $session): Response
    {
        return $this->respond($requestId, function () use ($input, $session): array {
            $userId = $this->authenticatedId($session);
            $this->auth->changePassword($userId, $input, hash('sha256', session_id()));

            return ['changed' => true];
        });
    }

    /** @param array<string, mixed> $user
     *  @param array<string, mixed> $session
     */
    private function establishSession(array $user, array &$session): void
    {
        if (!session_regenerate_id(true)) {
            throw new AuthException('Không thể làm mới phiên.', 'INTERNAL_ERROR', 500);
        }
        $session['user_id'] = (int) $user['id'];
        $session['csrf_token'] = bin2hex(random_bytes(32));
        $this->sessionHandler->setUserId((int) $user['id']);
    }

    /** @param array<string, mixed> $user
     *  @param array<string, mixed> $session
     *  @return array<string, mixed>
     */
    private function sessionData(array $user, array $session): array
    {
        return [
            'authenticated' => true,
            'csrf_token' => $session['csrf_token'],
            'user' => $user,
        ];
    }

    /** @param array<string, mixed> $session */
    private function authenticatedId(array $session): int
    {
        $userId = $session['user_id'] ?? null;
        if (!is_int($userId) && !(is_string($userId) && ctype_digit($userId))) {
            throw new AuthException('Vui lòng đăng nhập để tiếp tục.', 'UNAUTHENTICATED', 401);
        }

        return (int) $userId;
    }

    /** @param callable(): array<string, mixed> $operation */
    private function respond(string $requestId, callable $operation, int $successStatus = 200): Response
    {
        try {
            return JsonResponder::success($operation(), [], $successStatus);
        } catch (AuthException $exception) {
            return JsonResponder::error(
                $exception->errorCode,
                $exception->getMessage(),
                $exception->status,
                $requestId,
                $exception->fields,
            );
        }
    }
}
