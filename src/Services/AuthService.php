<?php

declare(strict_types=1);

namespace App\Services;

use App\Auth\AuthException;
use App\Repositories\UserRepository;
use App\Support\VietnamPhone;
use PDOException;

final class AuthService
{
    private static ?string $dummyPasswordHash = null;

    public function __construct(
        private readonly UserRepository $users,
        private readonly string $rateLimitKey,
    ) {
        if (strlen($rateLimitKey) < 24) {
            throw new \InvalidArgumentException('Authentication rate-limit key is not configured securely.');
        }
    }

    /** @param array<string, mixed> $input
     *  @return array{id: int, full_name: string, email: string, phone: string, role: string}
     */
    public function register(array $input): array
    {
        $fullName = $this->requiredText($input, 'full_name', 120);
        $email = $this->normalizeEmail($input['email'] ?? null);
        $phone = $this->validatePhone($input['phone'] ?? null);
        $password = $this->validatePassword($input['password'] ?? null, 'password');

        try {
            $id = $this->users->create([
                'full_name' => $fullName,
                'email' => $email,
                'phone' => $phone,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            ]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23505') {
                throw new AuthException(
                    'Địa chỉ email đã được sử dụng.',
                    'EMAIL_ALREADY_EXISTS',
                    409,
                    ['email' => ['Email này đã được đăng ký.']],
                );
            }

            throw $exception;
        }

        return $this->publicUser($this->users->findById($id));
    }

    /** @return array{id: int, full_name: string, email: string, phone: string, role: string} */
    public function login(mixed $emailInput, mixed $passwordInput): array
    {
        $email = $this->normalizeEmail($emailInput);
        if (!is_string($passwordInput) || $passwordInput === '' || strlen($passwordInput) > 1024) {
            $this->invalidField('password', 'Nhập email và mật khẩu hợp lệ.');
        }

        $digest = hash_hmac('sha256', $email, $this->rateLimitKey);
        if ($this->users->isLoginBlocked($digest)) {
            throw new AuthException(
                'Bạn đã thử đăng nhập quá nhiều lần. Hãy thử lại sau.',
                'RATE_LIMITED',
                429,
            );
        }

        $user = $this->users->findByEmail($email);
        $hash = is_array($user) ? (string) $user['password_hash'] : $this->dummyHash();
        $passwordMatches = password_verify($passwordInput, $hash);
        if (!$passwordMatches || !is_array($user) || $user['status'] !== 'active') {
            $this->users->recordLoginFailure($digest);
            throw new AuthException(
                'Email hoặc mật khẩu không chính xác.',
                'UNAUTHENTICATED',
                401,
            );
        }

        $this->users->clearLoginFailures($digest);
        if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
            $this->users->updatePasswordHash((int) $user['id'], password_hash($passwordInput, PASSWORD_DEFAULT));
        }

        return $this->publicUser($user);
    }

    /** @return array{id: int, full_name: string, email: string, phone: string, role: string} */
    public function currentUser(int $id): array
    {
        $user = $this->users->findById($id);
        if (!is_array($user)) {
            throw new AuthException('Phiên đăng nhập không còn hợp lệ.', 'UNAUTHENTICATED', 401);
        }
        if ($user['status'] !== 'active') {
            throw new AuthException('Tài khoản hiện không thể đăng nhập.', 'FORBIDDEN', 403);
        }

        return $this->publicUser($user);
    }

    /** @param array<string, mixed> $input
     *  @return array{id: int, full_name: string, email: string, phone: string, role: string}
     */
    public function updateProfile(int $id, array $input): array
    {
        $allowed = ['full_name', 'phone'];
        if ($input === [] || array_diff(array_keys($input), $allowed) !== []) {
            throw new AuthException(
                'Chỉ được cập nhật họ tên và số điện thoại.',
                'VALIDATION_FAILED',
                422,
            );
        }

        $values = [];
        if (array_key_exists('full_name', $input)) {
            $values['full_name'] = $this->requiredText($input, 'full_name', 120);
        }
        if (array_key_exists('phone', $input)) {
            $values['phone'] = $this->validatePhone($input['phone']);
        }

        $this->currentUser($id);
        $this->users->updateProfile($id, $values);

        return $this->currentUser($id);
    }

    public function changePassword(int $id, array $input, string $currentSessionHash): void
    {
        $currentPassword = $input['current_password'] ?? null;
        if (!is_string($currentPassword) || $currentPassword === '' || strlen($currentPassword) > 1024) {
            $this->invalidField('current_password', 'Nhập mật khẩu hiện tại.');
        }
        $newPassword = $this->validatePassword($input['new_password'] ?? null, 'new_password');
        $user = $this->users->findByIdForPasswordCheck($id);
        if (!is_array($user) || $user['status'] !== 'active' || !password_verify($currentPassword, (string) $user['password_hash'])) {
            $this->invalidField('current_password', 'Mật khẩu hiện tại không chính xác.');
        }
        if (password_verify($newPassword, (string) $user['password_hash'])) {
            $this->invalidField('new_password', 'Mật khẩu mới phải khác mật khẩu hiện tại.');
        }

        $this->users->updatePasswordHash($id, password_hash($newPassword, PASSWORD_DEFAULT));
        $this->users->revokeOtherSessions($id, $currentSessionHash);
    }

    private function dummyHash(): string
    {
        self::$dummyPasswordHash ??= password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);

        return self::$dummyPasswordHash;
    }

    private function normalizeEmail(mixed $value): string
    {
        if (!is_string($value)) {
            $this->invalidField('email', 'Nhập địa chỉ email hợp lệ.');
        }
        $email = strtolower(trim($value));
        if (strlen($email) > 254 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $this->invalidField('email', 'Nhập địa chỉ email hợp lệ.');
        }

        return $email;
    }

    private function validatePhone(mixed $value): string
    {
        try {
            return VietnamPhone::normalize($value);
        } catch (\InvalidArgumentException) {
            $this->invalidField('phone', 'Nhập số điện thoại Việt Nam gồm 10 chữ số, ví dụ 0901234567.');
        }
    }

    /** @param array<string, mixed> $input */
    private function requiredText(array $input, string $field, int $maximum): string
    {
        $value = $input[$field] ?? null;
        if (!is_string($value)) {
            $this->invalidField($field, 'Trường này là bắt buộc.');
        }
        $value = trim($value);
        if ($value === '' || mb_strlen($value, 'UTF-8') > $maximum) {
            $this->invalidField($field, 'Giá trị không hợp lệ.');
        }

        return $value;
    }

    private function validatePassword(mixed $value, string $field): string
    {
        if (!is_string($value) || mb_strlen($value, 'UTF-8') < 8 || strlen($value) > 1024
            || preg_match('/\p{L}/u', $value) !== 1 || preg_match('/\p{N}/u', $value) !== 1
        ) {
            $this->invalidField($field, 'Mật khẩu cần tối thiểu 8 ký tự và có cả chữ lẫn số.');
        }

        return $value;
    }

    private function invalidField(string $field, string $message): never
    {
        throw new AuthException(
            'Một số trường cần được kiểm tra.',
            'VALIDATION_FAILED',
            422,
            [$field => [$message]],
        );
    }

    /** @param array<string, mixed>|null $user
     *  @return array{id: int, full_name: string, email: string, phone: string, role: string}
     */
    private function publicUser(?array $user): array
    {
        if (!is_array($user)) {
            throw new AuthException('Không thể tải tài khoản.', 'INTERNAL_ERROR', 500);
        }

        return [
            'id' => (int) $user['id'],
            'full_name' => (string) $user['full_name'],
            'email' => (string) $user['email'],
            'phone' => (string) $user['phone'],
            'role' => (string) $user['role'],
        ];
    }
}
