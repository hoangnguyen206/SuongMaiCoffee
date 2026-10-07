# Sương Mai Coffee Roasters

Tài liệu và kế hoạch cho website thương mại điện tử Sương Mai Coffee Roasters.

## Tài liệu dự án

- [Đặc tả chuẩn](docs/SPEC.md) — canonical requirements, scope MVP và các quy tắc đã duyệt.
- [PRD](docs/PRD.md) — yêu cầu sản phẩm dẫn xuất từ đặc tả.
- [Kế hoạch milestone](docs/PLAN.md) — milestone, ownership, dependencies và gates.
- [Tiến độ](docs/PROGRESS.md) — nguồn duy nhất của trạng thái/task/evidence.
- [Quyết định](docs/DECISIONS.md) — decision log và các điểm đang mở.
- [Kế hoạch kiểm thử](docs/TEST_PLAN.md) — acceptance criteria và traceability tới test.
- [Đề xuất stack](docs/TECH_STACK.md) — proposal P1 PHP/PostgreSQL/container và toolchain.
- [Đề xuất schema](docs/database-schema-proposal.md) — proposal P1 cho data model MVP, chưa phải migration.
- [Đề xuất ma trận quyền](docs/permissions-matrix.md) — proposal P1 về authorization theo thao tác.
- [Đặc tả nguồn gốc](docs/source/S%C6%AF%C6%A0NG%20MAI%20COFFEE%20ROASTERS_%20%C4%90%E1%BA%B6C%20T%E1%BA%A2%20D%E1%BB%B0%20%C3%81N%20WEBSITE.md) — nguồn bất biến; không sửa, đổi tên hoặc di chuyển.

`docs/API_CONTRACT.md` đã có bản Draft P1 để review; `docs/view-contract.md` và `docs/traceability.md` chưa có. Draft và các proposal P1 chưa phải approval cuối cùng hay cho phép viết implementation.

## MVP

MVP gồm M0–M6, cộng `FR-CT-05` (gợi ý tìm kiếm), `FR-OR-05` (Guest tra cứu đơn), `FR-CN-07` (404/500), `FR-AD-12` (cấu hình quản trị) và dữ liệu roast batch tối thiểu cho `FR-CT-06`. Các module roadmap không tự động thuộc MVP.

PostgreSQL là DBMS duy nhất. PostgreSQL major version và chi tiết stack/schema/API/view/permissions phải được duyệt trước khi implementation theo gate P1.

## Quy tắc làm việc

Đọc `CLAUDE.md`, `docs/SPEC.md`, `docs/PROGRESS.md` và các contract liên quan trước khi bắt đầu task. Không tạo migration, schema triển khai, schema-dependent seed hoặc code nghiệp vụ trước khi P1 được duyệt. Frontend sở hữu templates/styles/JavaScript UI/assets; Backend sở hữu routes/controllers/services/schema/migrations/business logic; shared contracts cần tech lead duyệt.

Asset/nội dung chưa được duyệt phải ghi `PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC.` Subscription không triển khai trong MVP; dashboard phải hiển thị “Chưa triển khai”, không seed số liệu giả.

## Trạng thái

Xem [docs/PROGRESS.md](docs/PROGRESS.md) để biết trạng thái hiện tại; README này không lưu bản sao tiến độ động.
