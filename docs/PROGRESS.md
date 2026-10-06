# Tiến độ dự án — Sương Mai Coffee Roasters

> Đây là nguồn duy nhất của trạng thái động. Tài liệu khác chỉ liên kết tới đây, không sao chép tiến độ.

## 1. Quy ước

Trạng thái hợp lệ: `Todo`, `In progress`, `Blocked`, `Done`.

Mỗi milestone/task ghi owner (vai trò hoặc người xác nhận thực tế), branch/worktree thực tế (`N/A` nếu chưa tạo), dependencies, kiểm thử gần nhất, ngày cập nhật và evidence/blocker/next action. Không tự đặt tên người hoặc khai báo worktree chưa tồn tại.

Chỉ ghi `Done` khi tiêu chí nghiệm thu liên quan đã đạt và có evidence. Nếu test chưa chạy, ghi rõ `Not run` hoặc `Blocked`; không coi là Pass.

## 2. Trạng thái milestone

| Milestone | Tên | Trạng thái | Owner | Branch/worktree | Phụ thuộc | Kiểm thử gần nhất | Ngày cập nhật | Evidence/blocker/next action |
|---|---|---|---|---|---|---|---|---|
| P0 | Chuẩn hóa đặc tả | Done | TL/PD | `main` | PRD và source | Kiểm tra SPEC/source và liên kết tài liệu | 2026-10-06 | `docs/SPEC.md` được tạo; source không bị sửa. |
| P1 | Schema, quyền, API/view contracts | Todo | TL/PD + BE/DB + FE + QA/INT | N/A | P0 Done | Chưa chạy | 2026-10-06 | Chờ proposal và approval; chưa tạo migration/schema triển khai/code nghiệp vụ. |
| P2 | Bootstrap PHP/PostgreSQL | Todo | BE/DB + FE | N/A | P1 approval | Chưa chạy | 2026-10-06 | Bị khóa đến khi P1 được duyệt. |
| P3 | Public content và UI shell | Todo | FE + BE | N/A | P2; view contract | Chưa chạy | 2026-10-06 | Chỉ dùng placeholder có nhãn nếu asset chưa duyệt. |
| P4 | Catalog, search, product và freshness | Todo | BE/DB + FE | N/A | P2/P3; schema/API/view | Chưa chạy | 2026-10-06 | Cần batch–variant–inventory contract. |
| P5 | Auth, account và session security | Todo | BE/DB + FE + QA/INT | N/A | P2; permission/API/view | Chưa chạy | 2026-10-06 | Cần auth/session/permission contract. |
| P6 | Cart, pricing, coupon và merge | Todo | BE/DB + FE + QA/INT | N/A | P1; P5 | Chưa chạy | 2026-10-06 | Cần coupon redemption và merge behavior approval. |
| P7 | Checkout, order lifecycle và guest lookup | Todo | BE/DB + FE + QA/INT | N/A | P1; P5; P6 | Chưa chạy | 2026-10-06 | Cần order/stock transaction, idempotency, guest lookup limits. |
| P8 | Admin core và system configuration | Todo | BE/DB + FE + QA/INT | N/A | P4–P7; permissions | Chưa chạy | 2026-10-06 | Subscription widget phải là “Chưa triển khai”. |
| P9 | Integration, acceptance, deploy readiness | Todo | QA/INT + ALL | N/A | P2–P8 | Chưa chạy | 2026-10-06 | Cần evidence từ TEST_PLAN và môi trường PostgreSQL tương thích Render. |

## 3. Task chi tiết

| Task ID | Milestone | Task | Trạng thái | Owner | Branch/worktree | Phụ thuộc | Kiểm thử gần nhất | Ngày cập nhật | Evidence/blocker/next action |
|---|---|---|---|---|---|---|---|---|---|
| P0-01 | P0 | Tạo canonical `docs/SPEC.md` từ source | Done | TL/PD | `main` | PRD, source | Kiểm tra file/link; source không sửa | 2026-10-06 | SPEC được tạo và các quyết định đã duyệt phản ánh. |
| P0-02 | P0 | Ghi scope MVP và quyết định đã duyệt | Done | TL/PD | `main` | P0-01 | Rà soát scope/override | 2026-10-06 | Các nội dung nằm trong `docs/SPEC.md`. |
| P0-03 | P0 | Giữ nguyên file nguồn | Done | TL/PD | `main` | P0-01 | Kiểm tra phạm vi file thay đổi | 2026-10-06 | Không có thao tác sửa/đổi tên/di chuyển source. |
| P1-01 | P1 | Chốt PostgreSQL major version và compatibility | Todo | TL/PD + BE/DB | N/A | P0 Done | Chưa chạy | 2026-10-06 | Local/container, CI và Render phải tương thích. |
| P1-02 | P1 | Đề xuất schema MVP và migration design | Todo | BE/DB + TL/PD | N/A | P1-01 | Chưa chạy | 2026-10-06 | Chưa tạo migration hoặc schema triển khai. |
| P1-03 | P1 | Chốt batch–variant–inventory | Todo | BE/DB + TL/PD | N/A | P1-02 | Chưa chạy | 2026-10-06 | Không suy ra tồn từ `produced_qty_g`. |
| P1-04 | P1 | Chốt ma trận quyền Staff/Admin | Todo | TL/PD + BE/DB + QA/INT | N/A | P0 Done | Chưa chạy | 2026-10-06 | Phải xác định quyền backend theo thao tác. |
| P1-05 | P1 | Chốt API contract | Todo | TL/PD + BE/FE + QA/INT | N/A | P1-02, P1-04 | Chưa chạy | 2026-10-06 | Bao gồm auth, CSRF, idempotency, pagination, errors. |
| P1-06 | P1 | Chốt view contract | Todo | FE + BE + TL/PD | N/A | P1-05 | Chưa chạy | 2026-10-06 | Bao gồm loading/empty/error/permission/freshness states. |
| P1-07 | P1 | Chốt coupon redemption và cart merge | Todo | BE/DB + FE + QA/INT | N/A | P1-02, P1-05 | Chưa chạy | 2026-10-06 | Quyết định concurrency, per-customer limit, stock collision. |
| P1-08 | P1 | Chốt search và guest lookup limits | Todo | BE/DB + FE + QA/INT | N/A | P1-05 | Chưa chạy | 2026-10-06 | Tiếng Việt normalization, anti-enumeration/rate limit. |
| P1-09 | P1 | Review/approval toàn bộ P1 contracts | Todo | TL/PD + BE/DB + FE + QA/INT | N/A | P1-01–P1-08 | Chưa chạy | 2026-10-06 | Gate mở khóa P2. |
| P2+ | P2–P9 | Task chi tiết implementation và QA | Todo | Theo `docs/PLAN.md` | N/A | P1 approval | Chưa chạy | 2026-10-06 | Bổ sung task cụ thể khi milestone được mở khóa. |

## 4. Blocker

| Blocker | Ảnh hưởng | Owner xử lý | Điều kiện mở khóa | Ngày cập nhật |
|---|---|---|---|---|
| P1 chưa có approval | Chặn migration, schema triển khai, schema-dependent seed và business code | TL/PD + BE/DB + FE + QA/INT | Duyệt schema/migration design, permissions, API/view contracts và các business rules mở | 2026-10-06 |

## 5. Lịch sử cập nhật

| Ngày | Thay đổi | Owner | Evidence |
|---|---|---|---|
| 2026-10-06 | P0 SPEC hoàn tất; P1 được ghi nhận là Todo, không tạo implementation artifact | TL/PD | `docs/SPEC.md`; source giữ nguyên |
| 2026-10-06 | Tạo decision/test-plan khung và chuẩn hóa bảng milestone/task theo trạng thái yêu cầu | TL/PD | `docs/DECISIONS.md`, `docs/TEST_PLAN.md` |
