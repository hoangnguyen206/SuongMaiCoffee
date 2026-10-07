<?php

declare(strict_types=1);

namespace App\Http;

final class JsonResponder
{
    /**
     * @param array<string, mixed> $data
     * @param array<string, mixed> $meta
     */
    public static function success(array $data, array $meta, int $status = 200): Response
    {
        return self::json($status, [
            'data' => $data,
            'meta' => $meta,
        ]);
    }

    /**
     * @param array<string, list<string>> $fields
     * @param array<string, mixed> $details
     */
    public static function error(
        string $code,
        string $message,
        int $status,
        string $requestId,
        array $fields = [],
        array $details = [],
    ): Response {
        $error = [
            'code' => $code,
            'message' => $message,
        ];

        if ($fields !== []) {
            $error['fields'] = $fields;
        }

        $error['details'] = $details;
        $error['request_id'] = $requestId;

        return self::json($status, ['error' => $error]);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private static function json(int $status, array $payload): Response
    {
        return new Response(
            $status,
            ['Content-Type' => 'application/json; charset=utf-8'],
            json_encode(
                $payload,
                JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
            ),
        );
    }
}
