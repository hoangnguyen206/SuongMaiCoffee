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
| P1 | Schema, quyền, API/view contracts | In progress | TL/PD + BE/DB + FE + QA/INT | N/A | P0 Done | Chưa chạy acceptance tests | 2026-10-07 | TECH_STACK/schema/permissions proposals và API Draft tồn tại, chờ review; view contract và P1 sign-off còn mở. |
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
| P1-01 | P1 | Chốt PostgreSQL major version và compatibility | In progress | TL/PD + BE/DB | N/A | Chưa chạy compatibility test | 2026-10-07 | PostgreSQL 17 xác minh Render-supported và là ứng viên; local/container + CI smoke test còn chờ. |
| P1-02 | P1 | Đề xuất schema MVP và migration design | In progress | BE/DB + TL/PD | N/A | Chưa chạy schema tests | 2026-10-07 | `docs/database-schema-proposal.md` được tạo để review; không phải DDL/approval; không tạo migration/schema triển khai. |
| P1-03 | P1 | Chốt batch–variant–inventory | In progress | BE/DB + TL/PD | N/A | Chưa chạy inventory tests | 2026-10-07 | Proposal lot/allocation được ghi; FIFO, unroasted lot và constraints chờ review. Không suy tồn từ `produced_qty_g`. |
| P1-04 | P1 | Chốt ma trận quyền Staff/Admin | In progress | TL/PD + BE/DB + QA/INT | N/A | Chưa chạy authorization tests | 2026-10-07 | `docs/permissions-matrix.md` proposal tạo xong; chi tiết chờ review/sign-off. |
| P1-05 | P1 | Chốt API contract | Blocked | TL/PD + BE/FE + QA/INT | N/A | Chưa chạy | 2026-10-07 | `docs/API_CONTRACT.md` Draft P1 đã tạo; chờ schema/permission review, reconcile và final approval. |
| P1-06 | P1 | Chốt view contract | Blocked | FE + BE + TL/PD | N/A | Chưa chạy | 2026-10-07 | Chờ API contract và permission decisions; chưa tạo view contract. |
| P1-07 | P1 | Chốt coupon redemption và cart merge | In progress | BE/DB + FE + QA/INT | N/A | Chưa chạy concurrency tests | 2026-10-07 | Hướng category allowlist/HMAC/release-on-cancel và atomic reject ghi trong proposal; concurrency/API details chờ review. |
| P1-08 | P1 | Chốt search và guest lookup limits | In progress | BE/DB + FE + QA/INT | N/A | Chưa chạy performance/security tests | 2026-10-07 | Defaults được ghi trong DECISIONS; p95 scope, Vietnamese normalization và rate-limit mechanics còn mở. |
| P1-09 | P1 | Review/approval toàn bộ P1 contracts | Todo | TL/PD + BE/DB + FE + QA/INT | N/A | Chưa chạy | 2026-10-07 | Gate mở khóa P2 sau sign-off toàn bộ contracts. |
| P2+ | P2–P9 | Task chi tiết implementation và QA | Todo | Theo `docs/PLAN.md` | N/A | P1 approval | Chưa chạy | 2026-10-06 | Bổ sung task cụ thể khi milestone được mở khóa. |

## 4. Blocker

| Blocker | Ảnh hưởng | Owner xử lý | Điều kiện mở khóa | Ngày cập nhật |
|---|---|---|---|---|
| P1 chưa có approval | Chặn migration, schema triển khai, schema-dependent seed và business code | TL/PD + BE/DB + FE + QA/INT | Duyệt schema/migration design, permissions, API/view contracts và business rules mở | 2026-10-07 |

## 5. Lịch sử cập nhật

| Ngày | Thay đổi | Owner | Evidence |
|---|---|---|---|
| 2026-10-06 | P0 SPEC hoàn tất; P1 được ghi nhận là Todo, không tạo implementation artifact | TL/PD | `docs/SPEC.md`; source giữ nguyên |
| 2026-10-06 | Tạo decision/test-plan khung và chuẩn hóa bảng milestone/task theo trạng thái yêu cầu | TL/PD | `docs/DECISIONS.md`, `docs/TEST_PLAN.md` |
| 2026-10-07 | Tạo P1 TECH_STACK/schema/permissions proposals; đồng bộ PLAN với P0 Done. Tests chưa chạy, proposals chờ approval. | TL/PD | `docs/TECH_STACK.md`, `docs/database-schema-proposal.md`, `docs/permissions-matrix.md`; không có implementation artifacts |
| 2026-10-07 | Tạo API contract Draft P1 để review; acceptance tests và final P1 approval chưa chạy/chưa đạt. | TL/PD | `docs/API_CONTRACT.md`; không có implementation artifacts |
