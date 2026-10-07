# TECH_STACK — Sương Mai Coffee Roasters

**Trạng thái:** Proposal P1; chưa phải quyết định triển khai cuối cùng.  
**Ngày:** 2026-10-06  
**Căn cứ:** [SPEC](SPEC.md), [decision log](DECISIONS.md).  
**Gate:** Không cài package, bootstrap ứng dụng hay viết code nghiệp vụ chỉ dựa trên proposal này.

## 1. Stack đề xuất

| Lớp | Đề xuất | Trạng thái/ghi chú |
|---|---|---|
| Runtime | PHP 8.4.x | Hướng đã duyệt; patch và image pin tại P2. |
| Application | Custom MVC mỏng | Hướng đã duyệt; routing, DI, exception boundary cần review. |
| Dependency | Composer 2.x; commit `composer.lock` | Đề xuất; xác nhận Composer version trong build. |
| Database | PostgreSQL 17 | Ứng viên đã duyệt; Render hỗ trợ. Chỉ chốt sau local/container + CI compatibility smoke tests. PostgreSQL là DBMS duy nhất. |
| Access | PDO + `pdo_pgsql`, prepared statements | Hướng đã duyệt; không nối query từ user input. |
| Hosting | Docker Web Service + Render Managed PostgreSQL | Hướng đã duyệt. Bind `0.0.0.0:$PORT`. |
| Frontend | HTML5/CSS3/ES6+, server-rendered templates | Theo SPEC; không thêm build chain nếu chưa có nhu cầu duyệt. |
| Tests | PHPUnit 13.x | Đề xuất constraint `^13.0`; PHPUnit 13 yêu cầu PHP 8.4+. |
| Static analysis | PHPStan 2.x | Đề xuất constraint `^2.0`; level 8 là khởi điểm đề xuất, phải thử trên codebase. |
| Lint/style | PHP_CodeSniffer 4.x + PSR-12 | Đề xuất constraint `^4.0`; xác nhận parser PHP 8.4 bằng smoke test trước khi chốt. |

Custom MVC phù hợp hướng PHP đã duyệt và giữ dependency nhỏ cho MVP. Đổi framework là thay đổi kiến trúc cần approval, không phải lựa chọn ngầm.

## 2. Dependency constraints và command dự kiến

Các constraints là proposal, không phải patch versions đã khóa. Composer resolve patch và ghi kết quả trong lockfile sau compatibility tests.

```bash
composer require --dev 'phpunit/phpunit:^13.0' 'phpstan/phpstan:^2.0' 'squizlabs/php_codesniffer:^4.0'
composer validate --strict
vendor/bin/phpunit
vendor/bin/phpstan analyse src tests --level=8
vendor/bin/phpcs --standard=PSR12 src tests
```

- PHPUnit config dự kiến: `phpunit.xml`; integration test dùng PostgreSQL 17, không thay SQLite.
- PHPStan config dự kiến: `phpstan.neon`; baseline/exclusions cần review, không hạ level chỉ để CI xanh.
- Có thể chuyển PHPCS sang `phpcs.xml`; chưa chọn formatter tự động riêng.
- Các lệnh chưa chạy: repository hiện chưa có ứng dụng/package PHP. Không được báo Pass.
- Version commands sau khi cài: `php --version`, `composer --version`, `vendor/bin/phpunit --version`, `vendor/bin/phpstan --version`, `vendor/bin/phpcs --version`.

## 3. Database và runtime

- Dùng cùng PostgreSQL 17 major trên developer container, CI và Render. Pin patch/image ở P2 sau kiểm thử.
- `pg_trgm` và `unaccent` là ứng viên search, không dependency trước khi search design được duyệt; xác minh extension/query plan trên target.
- Timestamp lưu UTC dạng `TIMESTAMPTZ`; presentation timezone `Asia/Ho_Chi_Minh`. Tiền là integer VND.
- Render không cung cấp native PHP runtime trong hướng đã xác minh; triển khai PHP qua Docker. Web service lắng nghe `0.0.0.0` và port từ `PORT` (mặc định Render `10000`, có thể cấu hình). Entrypoint, health check, migration runbook, backup/rollback thuộc P2/P9; migration chỉ sau P1 approval.
- Credentials qua environment/Render connection string; không để secrets trong image, document root, repository hay logs.

## 4. Acceptance để chốt stack

1. Clean Docker build với PHP 8.4 + Composer; ghi chính xác runtime/Composer/dependency versions.
2. Cài thử PHPUnit 13, PHPStan 2.x, PHPCS 4.x; chạy smoke test, analysis và PSR-12 lint trên sample có cú pháp PHP 8.4.
3. Dựng PostgreSQL 17 local/CI; kiểm tra `pdo_pgsql`, extension được duyệt, timezone, transaction/locking và setup/restore.
4. Xác nhận Render preview/container bind, `PORT`, health check và database connection với PostgreSQL 17.
5. Chốt command/config và evidence trong `PROGRESS.md`; không mở P2 cho business code khi schema, permission, API/view gates còn mở.

**P1 exit criteria:** TL/PD, BE/DB, FE và QA review constraints, compatibility evidence và command cuối. Proposal này chưa tự chốt toàn bộ stack.

## 5. Còn mở

- Exact PHP/Composer patch, base-image digest/update cadence, CI provider/cache.
- Exact resolved PHPUnit/PHPStan/PHPCS versions; PHPCS PHP 8.4 tokenizer smoke test; PHPStan level/config.
- Render plan/region and target compatibility; extensions.
- Web server/start command, health check, deploy/migration, backup/restore.
- Session and shared rate-limit storage, logging/monitoring.

## 6. Tham khảo

- [Render PostgreSQL versions/connection](https://render.com/docs/postgresql-creating-connecting)
- [Render PostgreSQL extensions](https://render.com/docs/postgresql-extensions)
- [Render web services and port binding](https://render.com/docs/web-services)
- [Render PHP via Docker](https://render.com/docs/deploy-php-laravel-docker)
- [PHPUnit 13](https://phpunit.de/getting-started.html)
- [PHPStan getting started](https://phpstan.org/user-guide/getting-started)
- [PHP_CodeSniffer 4.x upgrade guide](https://github.com/PHPCSStandards/PHP_CodeSniffer/wiki/Version-4.0-Developer-Upgrade-Guide)
