# Triển khai Sương Mai trên Render

Hướng dẫn triển khai website Sương Mai Coffee Roasters. Docker local và Render dùng **hai database khác nhau**; không trỏ Render vào PostgreSQL local.

## 1. Chuẩn bị repository

1. Push repository lên GitHub.
2. Không commit `.env`, password thật, session secret hoặc token.
3. Có thể dùng `render.yaml` làm Blueprint hoặc tạo Web Service thủ công.

## 2. Tạo PostgreSQL

Tạo PostgreSQL database trên Render cùng region với Web Service. Nếu dùng Blueprint, database `suongmai-coffee-db` được khai báo trong `render.yaml`.

## 3. Tạo Web Service

- Chọn repository GitHub.
- Runtime: Docker.
- Dockerfile: `./Dockerfile`.
- Health check path: `/api/v1/health`.
- Render cung cấp `PORT`; entrypoint cấu hình Apache nghe trên biến này. `HOST_PORT` chỉ dùng khi ánh xạ cổng máy local trong Docker Compose.

## 4. Environment variables

Thiết lập tối thiểu:

- `APP_ENV=production`
- `APP_URL=https://<ten-service>.onrender.com`
- `DATABASE_URL` — lấy từ Render PostgreSQL, không chép giá trị vào repository
- `AUTH_RATE_LIMIT_KEY` — chuỗi ngẫu nhiên dài, lưu trong Render Secret
- `SESSION_COOKIE_SECURE=1`
- `DB_CONNECT_TIMEOUT=5`

Khi dùng `DATABASE_URL`, không cần đặt `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` hoặc `DB_PASSWORD`. Không dùng host `db` của Docker Compose local trên Render.

## 5. Migration và nạp dữ liệu ban đầu

Migration không chạy tự động khi container restart. Sau khi Web Service và database sẵn sàng, chạy migration bằng Shell/one-off command của Render:

```sh
php database/migrate.php
```

Không chạy `database/seed.php` trên production: script này tạo dữ liệu danh mục, coupon và tài khoản phát triển; bản thân script từ chối chạy khi `APP_ENV=production`. Seed chỉ dành cho local hoặc staging cô lập. Trên production, hãy nạp danh mục đã được duyệt và tạo tài khoản quản trị riêng bằng quy trình bảo mật.

Migration và seed đều không chạy tự động khi container khởi động/restart.

## 6. Kiểm tra sau deploy

Mở lần lượt:

- `/`
- `/catalog/`
- `/cart/`
- `/checkout/`
- `/api/v1/health`

Health trả HTTP 200 khi database kết nối. Khi database không khả dụng, health trả HTTP 503 với thông báo trung lập, không trả DSN, password hoặc stack trace.

## 7. Xem log khi deploy lỗi

Mở tab **Logs** của Web Service trên Render. Kiểm tra lỗi build Docker, biến môi trường thiếu, migration chưa chạy và kết nối PostgreSQL. Không dán `DATABASE_URL`, password hoặc session secret vào issue/chat/log công khai.

## 8. Bảo vệ secret

- Chỉ nhập secret trong Render Environment/Secret Files.
- Không thêm `.env` vào commit.
- Không dùng password local trong production.
- Định kỳ thay `AUTH_RATE_LIMIT_KEY` nếu nghi ngờ bị lộ.
