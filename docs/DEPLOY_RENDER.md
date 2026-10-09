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

## 5. Migration, dữ liệu demo và tài khoản admin

Blueprint chạy migration và seed catalog demo trước mỗi deploy khi `SEED_DEMO_DATA=true`. Đây là dữ liệu placeholder để kiểm tra catalog/giỏ hàng, không phải dữ liệu thương mại chính thức.

Thiết lập các biến Secret trên Render để tạo tài khoản admin test:

- `ADMIN_EMAIL` — email đăng nhập, ví dụ `admin@suongmai.example`
- `ADMIN_NAME` — tên hiển thị
- `ADMIN_PHONE` — số điện thoại hợp lệ
- `ADMIN_PASSWORD` — mật khẩu tự đặt, ít nhất 8 ký tự gồm chữ và số

Khi đủ bốn biến, pre-deploy sẽ chạy `database/provision_admin.php` và cập nhật tài khoản admin theo các giá trị đó. Không ghi mật khẩu vào repository hoặc chat công khai.

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
