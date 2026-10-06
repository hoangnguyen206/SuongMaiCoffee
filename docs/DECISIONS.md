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
| DEC-003 | MVP có dữ liệu roast batch tối thiểu cho `FR-CT-06`; không triển khai full batch management. | Hỗ trợ product detail/freshness mà không mở rộng toàn bộ M8. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`, `docs/PLAN.md`; dự kiến `docs/DATA_MODEL.md`, `docs/TEST_PLAN.md` |
| DEC-004 | PostgreSQL là DBMS duy nhất; không cần MySQL/MariaDB compatibility. | Một DBMS chuẩn; phù hợp mục tiêu Render managed PostgreSQL. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/TECH_STACK.md`, `docs/DATA_MODEL.md` |
| DEC-005 | Local/container và CI dùng PostgreSQL tương thích Render; major version chốt tại P1. | Giảm sai khác giữa dev, CI và deploy. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PLAN.md`, `docs/PROGRESS.md`; dự kiến `docs/TECH_STACK.md` |
| DEC-006 | Trước P1 approval không tạo migration, schema triển khai, schema-dependent seed hoặc business code. | Tránh triển khai trước khi contracts được duyệt. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PLAN.md`, `docs/PROGRESS.md`, `README.md` |
| DEC-007 | Frontend sở hữu templates/styles/JS UI/assets/placeholders; Backend sở hữu routes/controllers/services/schema/migrations/business logic. | Rõ ownership và giảm conflict. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PLAN.md` |
| DEC-008 | Shared contract hoặc ownership cross-boundary phải qua tech lead. | Đồng bộ quyết định FE/BE. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PLAN.md` |
| DEC-009 | Nội dung/asset chưa duyệt chỉ dùng placeholder có nhãn; không seed như thương hiệu chính thức. | Không gây nhầm dữ liệu giả với dữ liệu được xác nhận. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `README.md` |
| DEC-010 | Subscription không thuộc MVP; dashboard hiển thị “Chưa triển khai” hoặc empty state, không seed dữ liệu giả. | Không biến roadmap thành feature bắt buộc. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PRD.md`, `docs/TEST_PLAN.md` |
| DEC-011 | Thứ tự giá: hàng → subscription discount → coupon → points → shipping. | Đồng nhất quy tắc tính tiền. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/DATA_MODEL.md`, `docs/TEST_PLAN.md` |
| DEC-012 | Percent discount làm tròn xuống đến đồng; fixed coupon không vượt giá trị hàng đủ điều kiện; coupon mặc định cộng dồn subscription trừ khi condition loại trừ. | Tránh sai số và giới hạn discount hợp lệ. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/DATA_MODEL.md`, `docs/TEST_PLAN.md` |
| DEC-013 | Redeem points tối đa 20% hàng sau subscription/coupon và trước shipping. | Giới hạn giảm giá bằng điểm. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/TEST_PLAN.md` |
| DEC-014 | Freshness +30 là mốc thưởng thức ngon nhất, không phải hạn an toàn; bỏ nhãn “Còn tốt” đến +45. | Tránh tuyên bố an toàn thực phẩm không có căn cứ. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/TEST_PLAN.md` |
| DEC-015 | Mục tiêu checkout được tính riêng; checkout có ba bước. | Làm rõ không tính tìm kiếm/chọn sản phẩm vào số bước. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`, `docs/TEST_PLAN.md` |
| DEC-016 | Cart line identity là `(variant_id, grind_option_id)`; quantity tối đa 20 mỗi dòng. | Khác grind là dòng riêng; quantity được giới hạn. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/DATA_MODEL.md`, `docs/TEST_PLAN.md` |
| DEC-017 | Không suy ra batch inventory từ `produced_qty_g`. | Sản lượng rang không đại diện tồn khả dụng theo variant. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/DATA_MODEL.md`, `docs/TEST_PLAN.md` |
| DEC-018 | Order creation là transaction; mọi order status transition ghi history; cancel chỉ từ `pending`/`confirmed`. | Giữ đúng order lifecycle và inventory. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/DATA_MODEL.md`, `docs/TEST_PLAN.md` |
| DEC-019 | Product đã có order chỉ được ẩn; order item giữ snapshot product/variant/grind/price. | Bảo toàn lịch sử đơn hàng. | 2026-10-06 | Product owner | `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/DATA_MODEL.md`, `docs/TEST_PLAN.md` |
| DEC-020 | Backend enforce session/role/permission/CSRF; hidden UI không phải authorization. | Bảo vệ endpoint server-side. | 2026-10-06 | Product owner | `CLAUDE.md`, `docs/SPEC.md`, `docs/PRD.md`; dự kiến `docs/API_CONTRACT.md`, `docs/TEST_PLAN.md` |

## 3. Điểm còn mở — chưa phải quyết định triển khai

| ID | Cần quyết định | Owner đề xuất | Điều kiện đóng |
|---|---|---|---|
| OPEN-001 | PostgreSQL major version | TL/PD + BE/DB | Compatibility review local/container, CI, Render. |
| OPEN-002 | PHP version, framework/custom MVC, dependency, tests, lint/format/assets/env | TL/PD + BE/DB + FE | `TECH_STACK.md` proposal and approval. |
| OPEN-003 | MVP PK/FK/types/check/index/nullability/delete policy | BE/DB + TL/PD | `DATA_MODEL.md` proposal and approval. |
| OPEN-004 | Batch–variant–inventory relationship and latest-available definition | BE/DB + TL/PD | Data model review and acceptance tests. |
| OPEN-005 | Coupon eligibility, customer limit, redemption persistence, concurrency and rounding boundaries | BE/DB + TL/PD + QA/INT | API/data model review. |
| OPEN-006 | Cart merge conflict, stock collision, reject-vs-clamp and final UI state | BE/DB + FE + QA/INT | API/view contract approval. |
| OPEN-007 | Vietnamese search normalization, minimum query, debounce, suggestion limit and latency | BE/DB + FE + QA/INT | API/view contract approval. |
| OPEN-008 | Guest lookup inputs, rate limit, retries, cooldown and data disclosure | BE/DB + QA/INT | Security/API acceptance approval. |
| OPEN-009 | Staff/Admin permissions by action and sensitive-data scope | TL/PD + BE/DB + QA/INT | Permission matrix approval. |
| OPEN-010 | Bank QR source/storage and configuration validation | BE/DB + FE + TL/PD | API/config decision. |
| OPEN-011 | PHP session/auth design and guest cart identity lifecycle | BE/DB + TL/PD | TECH_STACK/API/data model approval. |

## 4. Superseded decisions

Chưa có.
