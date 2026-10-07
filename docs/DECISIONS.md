# Decision Log — Sương Mai Coffee Roasters

> Ghi quyết định đã duyệt và các điểm đang mở. Proposal chưa được duyệt không phải requirement triển khai.

## 1. Quy ước

- `Approved`: quyết định được duyệt.
- `Proposed`: đề xuất đang chờ duyệt; không triển khai.
- `Superseded`: quyết định được thay thế, cần ghi quyết định thay thế.
- Ngày dùng định dạng `YYYY-MM-DD`. Approver ghi theo người/vai trò xác nhận thực tế.
- Affected documents ghi tên đường dẫn chính xác; tên contract chưa tồn tại là dự kiến, không hàm ý đã được tạo.

## 2. Quyết định đã duyệt

| ID | Quyết định | Lý do | Ngày | Người duyệt | Tài liệu bị ảnh hưởng |
|---|---|---|---|---|---|
| DEC-001 | MVP gồm M0–M6. | Baseline website bán hàng đầu-cuối. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`, `docs/PLAN.md`, `docs/PROGRESS.md`, `docs/TEST_PLAN.md` |
| DEC-002 | Thêm `FR-CT-05`, `FR-OR-05`, `FR-CN-07`, `FR-AD-12` vào MVP. | Các chức năng S này được chọn rõ ràng. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`, `docs/PLAN.md`, `docs/TEST_PLAN.md` |
| DEC-003 | MVP có dữ liệu roast batch tối thiểu cho `FR-CT-06`; không triển khai full batch management. | Hỗ trợ product detail/freshness mà không mở rộng toàn bộ M8. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`, `docs/PLAN.md`; dự kiến `docs/database-schema-proposal.md`, `docs/TEST_PLAN.md` |
| DEC-004 | PostgreSQL là DBMS duy nhất; không cần MySQL/MariaDB compatibility. | Một DBMS chuẩn; phù hợp mục tiêu Render managed PostgreSQL. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/TECH_STACK.md`, `docs/database-schema-proposal.md` |
| DEC-005 | Local/container và CI dùng PostgreSQL tương thích Render; major version chốt tại P1. | Giảm sai khác giữa dev, CI và deploy. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PLAN.md`, `docs/PROGRESS.md`; dự kiến `docs/TECH_STACK.md` |
| DEC-006 | Trước P1 approval không tạo migration, schema triển khai, schema-dependent seed hoặc business code. | Tránh triển khai trước khi contracts được duyệt. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PLAN.md`, `docs/PROGRESS.md`, `README.md` |
| DEC-007 | Frontend sở hữu templates/styles/JS UI/assets/placeholders; Backend sở hữu routes/controllers/services/schema/migrations/business logic. | Rõ ownership và giảm conflict. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PLAN.md` |
| DEC-008 | Shared contract hoặc ownership cross-boundary phải qua tech lead. | Đồng bộ quyết định FE/BE. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PLAN.md` |
| DEC-009 | Nội dung/asset chưa duyệt chỉ dùng placeholder có nhãn; không seed như thương hiệu chính thức. | Không gây nhầm dữ liệu giả với dữ liệu được xác nhận. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `README.md` |
| DEC-010 | Subscription không thuộc MVP; dashboard hiển thị “Chưa triển khai” hoặc empty state, không seed dữ liệu giả. | Không biến roadmap thành feature bắt buộc. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PRD.md`, `docs/TEST_PLAN.md` |
| DEC-011 | Thứ tự giá: hàng → subscription discount → coupon → points → shipping. | Đồng nhất quy tắc tính tiền. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/database-schema-proposal.md`, `docs/TEST_PLAN.md` |
| DEC-012 | Percent discount làm tròn xuống đến đồng; fixed coupon không vượt giá trị hàng đủ điều kiện; coupon mặc định cộng dồn subscription trừ khi condition loại trừ. | Tránh sai số và giới hạn discount hợp lệ. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/database-schema-proposal.md`, `docs/TEST_PLAN.md` |
| DEC-013 | Redeem points tối đa 20% hàng sau subscription/coupon và trước shipping. | Giới hạn giảm giá bằng điểm. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/TEST_PLAN.md` |
| DEC-014 | Freshness +30 là mốc thưởng thức ngon nhất, không phải hạn an toàn; bỏ nhãn “Còn tốt” đến +45. | Tránh tuyên bố an toàn thực phẩm không có căn cứ. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/TEST_PLAN.md` |
| DEC-015 | Mục tiêu checkout được tính riêng; checkout có ba bước. | Làm rõ không tính tìm kiếm/chọn sản phẩm vào số bước. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`, `docs/TEST_PLAN.md` |
| DEC-016 | Cart line identity là `(variant_id, grind_option_id)`; quantity tối đa 20 mỗi dòng. | Khác grind là dòng riêng; quantity được giới hạn. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/database-schema-proposal.md`, `docs/TEST_PLAN.md` |
| DEC-017 | Không suy ra batch inventory từ `produced_qty_g`. | Sản lượng rang không đại diện tồn khả dụng theo variant. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/database-schema-proposal.md`, `docs/TEST_PLAN.md` |
| DEC-018 | Order creation là transaction; mọi order status transition ghi history; cancel chỉ từ `pending`/`confirmed`. | Giữ đúng order lifecycle và inventory. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/database-schema-proposal.md`, `docs/TEST_PLAN.md` |
| DEC-019 | Product đã có order chỉ được ẩn; order item giữ snapshot product/variant/grind/price. | Bảo toàn lịch sử đơn hàng. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/database-schema-proposal.md`, `docs/TEST_PLAN.md` |
| DEC-020 | Backend enforce session/role/permission/CSRF; hidden UI không phải authorization. | Bảo vệ endpoint server-side. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/TEST_PLAN.md` |
| DEC-021 | Giữ P0 là Done theo `docs/PROGRESS.md`; đồng bộ `docs/PLAN.md` sau xác nhận sign-off, không mở lại P0 vì kế hoạch cũ. | Progress là nguồn trạng thái duy nhất; PLAN phải khớp deliverable đã ký duyệt. | 2026-10-06 | Product owner | `docs/PLAN.md`, `docs/PROGRESS.md` |
| DEC-022 | Chọn hướng PHP 8.4 custom MVC, Composer/PDO, Docker/Render; PostgreSQL 17 là ứng viên cần compatibility validation. | Phù hợp nền tảng PHP/PostgreSQL và deploy mục tiêu, không khóa version/tooling trước test. | 2026-10-06 | Product owner | `docs/TECH_STACK.md`, `docs/PLAN.md`, `docs/PROGRESS.md` |
| DEC-023 | Proposal schema dùng `docs/database-schema-proposal.md`; thiết kế inventory phải nối batch–variant–inventory tường minh, có order allocation; không suy tồn từ `produced_qty_g`. | Theo dõi tồn bán được và lô đã trừ mà không đánh đồng sản lượng rang với stock. | 2026-10-06 | Product owner | `docs/database-schema-proposal.md`, `docs/TEST_PLAN.md` |
| DEC-024 | Coupon MVP dùng category allowlist; allowlist rỗng không giới hạn category; giới hạn Guest theo HMAC số điện thoại; quota được giữ khi tạo order, chỉ giải phóng nếu hủy trước `paid`; đơn đã `paid` giữ quota kể cả khi refund. | Hạn chế eligibility, bảo vệ định danh và giữ quota nhất quán theo order/payment lifecycle. | 2026-10-06 | Product owner | `docs/database-schema-proposal.md`, dự kiến `docs/API_CONTRACT.md`, `docs/TEST_PLAN.md` |
| DEC-025 | Cart merge xử lý atomic reject khi vượt tồn hoặc max 20/dòng; không silent clamp. | Không làm mất/biến đổi giỏ ngoài ý muốn; Frontend cần conflict details. | 2026-10-06 | Product owner | `docs/database-schema-proposal.md`, dự kiến `docs/API_CONTRACT.md`, `docs/TEST_PLAN.md` |
| DEC-026 | Search defaults: tối thiểu 2 ký tự, tối đa 8 gợi ý, debounce 250ms, p95 ≤300ms. | Có giới hạn UX/latency ban đầu; cách đo và xử lý dấu tiếng Việt cần review. | 2026-10-06 | Product owner | `docs/TECH_STACK.md`, `docs/database-schema-proposal.md`, dự kiến `docs/API_CONTRACT.md`, `docs/TEST_PLAN.md` |
| DEC-027 | Guest order lookup: 5 lần/15 phút theo IP hash, cooldown 15 phút; lỗi trung tính nếu order code/SĐT không khớp. | Giảm enumeration và không làm lộ order existence qua lỗi. | 2026-10-06 | Product owner | `docs/database-schema-proposal.md`, dự kiến `docs/API_CONTRACT.md`, `docs/TEST_PLAN.md` |
| DEC-028 | Staff được chuyển order qua trạng thái hợp lệ và điều chỉnh inventory có audit; Admin-only cho giá, coupon, config, role, xác nhận payment; không xóa dữ liệu/lịch sử. | Backend default-deny và bảo toàn audit/order history. | 2026-10-06 | Product owner | `docs/permissions-matrix.md`, `docs/database-schema-proposal.md`, dự kiến `docs/API_CONTRACT.md`, `docs/TEST_PLAN.md` |
| DEC-029 | Refund: mỗi order chỉ có một refund case; các lần xử lý là attempts append-only; retry sau failed tạo attempt mới, không ghi đè lịch sử; restock atomically đúng một lần chỉ khi refund thành công. | Bảo toàn lịch sử refund, tránh hoàn tiền/hoàn tồn lặp lại. | 2026-10-07 | Product owner | `docs/API_CONTRACT.md`, `docs/database-schema-proposal.md`, `docs/permissions-matrix.md`, `docs/TEST_PLAN.md` |
| DEC-030 | PII: Staff chỉ xem đầy đủ địa chỉ và số điện thoại tại order detail khi cần xử lý giao hàng; Guest order lookup không trả PII. Các field-level permissions khác chưa được duyệt toàn bộ. | Giới hạn PII theo tác vụ, tránh mở rộng quyền ngoài quyết định. | 2026-10-07 | Product owner | `docs/API_CONTRACT.md`, `docs/permissions-matrix.md`, `docs/TEST_PLAN.md` |
| DEC-031 | Inventory tách batch/unbatched bằng `pool_kind` có constraint; allocation ghi lot nguồn; ledger ghi biến động; `UNIQUE(allocation_id)` trên reversal ngăn hoàn tồn hai lần. | Phân biệt nguồn tồn và bảo đảm traceability/one-time restock. | 2026-10-07 | Product owner | `docs/API_CONTRACT.md`, `docs/database-schema-proposal.md`, `docs/permissions-matrix.md`, `docs/TEST_PLAN.md` |

## 3. Điểm còn mở — chưa phải quyết định triển khai

| ID | Còn mở sau proposal/decision | Owner đề xuất | Điều kiện đóng |
|---|---|---|---|
| OPEN-001 | PostgreSQL 17 là ứng viên; chưa chốt trước compatibility smoke test local/container, CI, Render. | TL/PD + BE/DB | Ghi versions, evidence và approval trong TECH_STACK/PROGRESS. |
| OPEN-002 | Hướng PHP 8.4 custom MVC, Composer/PDO, Docker/Render đã duyệt; exact constraints/resolved tools và commands cần test/chốt. | TL/PD + BE/DB + FE | `docs/TECH_STACK.md` review + smoke test. |
| OPEN-003 | PK/FK/types/check/index/nullability/delete/retention policy chi tiết. | BE/DB + TL/PD | Review/approval `docs/database-schema-proposal.md`. |
| OPEN-004 | Explicit batch–variant–lot/allocation đã duyệt; FIFO tie-break, exact pool constraints/ledger consistency và implementation constraints còn mở. Các hướng `pool_kind`, allocation theo lot, ledger, unique reversal đã được duyệt tại DEC-031 nhưng chưa phải schema approval cuối. | BE/DB + TL/PD | Schema review + inventory acceptance tests. |
| OPEN-005 | Category allowlist, Guest phone HMAC, quota release on cancel đã duyệt; phone normalization/key rotation, locking và rounding details còn mở. | BE/DB + TL/PD + QA/INT | Schema/API review + concurrency tests. |
| OPEN-006 | Atomic reject, không silent clamp khi merge vượt stock/max 20 đã duyệt; conflict shape/UI error contract còn mở. | BE/DB + FE + QA/INT | API/view contract approval. |
| OPEN-007 | Defaults đã duyệt: min 2 chars, max 8 suggestions, debounce 250ms, p95 ≤300ms; p95 scope và Vietnamese diacritic normalization còn mở. | BE/DB + FE + QA/INT | API/view approval + performance/search acceptance. |
| OPEN-008 | 5 attempts/15 min theo IP hash, cooldown 15 min, neutral mismatch error đã duyệt; window semantics, trusted proxy/storage failure/data fields còn mở. | BE/DB + QA/INT | Security/API acceptance approval. |
| OPEN-009 | Hướng quyền Staff/Admin đã duyệt; exact field-level PII permissions theo role còn cần Product Owner/TL + Backend + QA sign-off. DEC-030 chỉ duyệt hai nguyên tắc đã nêu, không duyệt toàn bộ ma trận fields. | TL/PD + BE/DB + QA/INT | Review/sign-off `docs/permissions-matrix.md`. |
| OPEN-010 | Bank QR source/storage and configuration validation. | BE/DB + FE + TL/PD | API/config decision. |
| OPEN-011 | PHP session/auth design and guest cart identity lifecycle. | BE/DB + TL/PD | TECH_STACK/API/schema approval. |
## 4. Superseded decisions

Chưa có.
