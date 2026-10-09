<?php

declare(strict_types=1);

namespace App\Support;

use InvalidArgumentException;

final class VietnamPhone
{
    public static function normalize(mixed $value): string
    {
        if (!is_string($value)) {
            throw new InvalidArgumentException('Số điện thoại không hợp lệ.');
        }

        $phone = trim($value);
        $digits = preg_replace('/[\s.()-]+/', '', $phone);
        if (!is_string($digits)) {
            throw new InvalidArgumentException('Số điện thoại không hợp lệ.');
        }

        if (preg_match('/^\+84(0?)([1-9][0-9]{8,9})$/', $digits, $matches) === 1) {
            $digits = '0' . $matches[2];
        } elseif (preg_match('/^84([1-9][0-9]{8,9})$/', $digits, $matches) === 1) {
            $digits = '0' . $matches[1];
        }

        if (preg_match('/^0[35789][0-9]{8}$/', $digits) !== 1) {
            throw new InvalidArgumentException('Nhập số điện thoại Việt Nam gồm 10 chữ số, ví dụ 0901234567.');
        }

        return $digits;
    }
}
