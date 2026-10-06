# Kế hoạch triển khai Sương Mai Coffee Roasters

> **Mục đích:** kế hoạch tĩnh cho các milestone, đầu việc, trách nhiệm, phụ thuộc và điều kiện bàn giao.
>
> **Nguồn tiến độ duy nhất:** [docs/PROGRESS.md](PROGRESS.md). `PLAN.md` không lưu bản sao trạng thái động; cột trạng thái bên dưới luôn trỏ về `PROGRESS.md`.
>
> **Trạng thái tài liệu:** kế hoạch đã được duyệt ở cấp phạm vi. P0 chưa bắt đầu. Việc ghi tên người cụ thể hoặc tạo branch thực tế chỉ thực hiện khi milestone tương ứng được khởi động.

## 1. Quy ước điều hành

### 1.1. Nguồn tài liệu

| Tài liệu | Vai trò | Tình trạng |
|---|---|---|
| [docs/PROGRESS.md](PROGRESS.md) | **Nguồn duy nhất của tiến độ và trạng thái thực tế** | Đang sử dụng |
| [docs/PRD.md](PRD.md) | PRD và các quyết định sản phẩm đã được duyệt | Đã tạo |
| [docs/SPEC.md](SPEC.md) | Đặc tả chuẩn/canonical sau khi hoàn tất P0 | Chưa tạo; deliverable của P0 |
| [docs/source/](source/) | Nguồn đặc tả gốc, phải được giữ nguyên | Đã có; không chỉnh sửa |
| [docs/traceability.md](traceability.md) | Ma trận truy xuất nguồn → PRD → test → triển khai | Chưa tạo; deliverable của P1 |
| [docs/decisions.md](decisions.md) | Nhật ký quyết định và các điểm đã chốt | Chưa tạo; deliverable của P1 |
| [docs/database-schema-proposal.md](database-schema-proposal.md) | Đề xuất schema/migration PostgreSQL để duyệt | Chưa tạo; deliverable của P1 |
| [docs/permissions-matrix.md](permissions-matrix.md) | Ma trận quyền backend theo vai trò và thao tác | Chưa tạo; deliverable của P1 |
| [docs/api-contract.md](api-contract.md) | Hợp đồng route/request/response/error/CSRF | Chưa tạo; deliverable của P1 |
| [docs/view-contract.md](view-contract.md) | Hợp đồng dữ liệu giữa backend và template/frontend | Chưa tạo; deliverable của P1 |

Các tài liệu có trạng thái “chưa tạo” là liên kết kế hoạch, không phải bằng chứng rằng file đã tồn tại.

### 1.2. Vai trò và nhánh dự kiến

Chưa có cá nhân nào được gán trong repository. Bảng này chỉ định **vai trò** và quy ước nhánh; không có branch nào được tạo bởi tài liệu này.

| Mã vai trò | Người/nhóm phụ trách | Phạm vi chính | Quy ước branch dự kiến |
|---|---|---|---|
| TL/PD | Tech Lead / Product-Documentation owner | Quyết định kiến trúc, đặc tả, traceability, gate và tài liệu chung | `docs/<milestone>-<topic>` |
| BE/DB | Backend / Database owner | PostgreSQL, migration, route, controller, service, model, bảo mật backend | `backend/<milestone>-<topic>` |
| FE | Frontend owner | Template, CSS, JavaScript UI, assets và placeholders | `frontend/<milestone>-<topic>` |
| QA/INT | QA / Integration owner | Test, acceptance, integration, regression, release evidence | `qa/<milestone>-<topic>` |
| ALL | Các vai trò liên quan | Review, demo, bàn giao và xử lý blocker | Theo branch của đầu việc |

Nguyên tắc ownership bắt buộc:

- FE sở hữu templates, styles, JavaScript UI, assets/placeholders.
- BE/DB sở hữu routes, controllers, services, schema, migrations và logic nghiệp vụ.
- TL/PD sở hữu tài liệu hợp đồng và quyết định phạm vi; không tự thay đổi logic backend/frontend.
- Không để hai branch cùng chỉnh một file dùng chung. Các file contract, schema, route map và cấu hình chung phải được duyệt trước khi tách việc.
- Placeholder phải ghi rõ: `PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC.`

### 1.3. Trạng thái

Chỉ cập nhật trạng thái thực tế trong [docs/PROGRESS.md](PROGRESS.md), theo các giá trị:

- `Not started` — chưa bắt đầu.
- `In progress` — đang thực hiện.
- `Blocked` — có blocker, phải ghi rõ trong `PROGRESS.md`.
- `Review` — chờ review/approval.
- `Done` — hoàn thành và có evidence/test tương ứng.
- `Deferred` — hoãn ngoài phạm vi hiện tại, phải nêu quyết định.

## 2. Phạm vi và gate bắt buộc

### 2.1. Baseline đã duyệt

- MVP gồm toàn bộ M0–M6 và các S feature được chọn: `FR-CT-05`, `FR-OR-05`, `FR-CN-07`, `FR-AD-12`.
- MVP có tối thiểu dữ liệu roast-batch cần cho `FR-CT-06`; không triển khai full roast-batch management.
- Subscription chưa triển khai; dashboard hiển thị **“Chưa triển khai”**, không seed dữ liệu subscription giả.
- PostgreSQL là hệ quản trị CSDL duy nhất.
- Pricing sequence: giá hàng → giảm subscription → coupon → điểm → phí vận chuyển.
- Cart-line identity: `(variant_id, grind_option_id)`; quantity tối đa mỗi dòng là 20.
- Order creation là một transaction; mọi status transition tạo `order_status_history`.
- Backend luôn kiểm tra session/role/permission; không chỉ ẩn thao tác trên UI.

### 2.2. P0/P1 gate

Không bắt đầu code nghiệp vụ trước khi đạt tối thiểu các điều kiện sau:

1. P0 tạo `docs/SPEC.md` từ source mà không sửa source gốc.
2. P1 duyệt PostgreSQL major version tương thích local/container, CI và Render managed PostgreSQL.
3. P1 duyệt schema/migration và quan hệ batch–variant–inventory; không suy luận tồn batch từ `produced_qty_g`.
4. P1 duyệt permissions matrix, API contract và view contract.
5. P1 duyệt BR-10, finance/freshness rules, search/guest lookup limitations và coupon redemption model.
6. Chỉ thiết kế/tạo các bảng cần cho MVP; không dựng trước full 39-table schema.

## 3. Milestone tổng quan

| Milestone | Mục tiêu | Phụ trách chính | Nhánh dự kiến | Trạng thái thực tế |
|---|---|---|---|---|
| P0 | Chuẩn hóa source và lập traceability | TL/PD | `docs/p0-spec-normalization` | Xem [PROGRESS.md](PROGRESS.md) |
| P1 | Chốt contract/schema/permissions trước code | TL/PD + BE/DB + FE + QA/INT | `docs/p1-contracts`, `backend/p1-contracts`, `frontend/p1-contracts` | Xem [PROGRESS.md](PROGRESS.md) |
| P2 | Bootstrap nền tảng PHP MVC/PostgreSQL | BE/DB + FE | `backend/p2-bootstrap`, `frontend/p2-bootstrap` | Xem [PROGRESS.md](PROGRESS.md) |
| P3 | Public content và shell giao diện | FE + BE | `frontend/p3-public-content`, `backend/p3-public-content` | Xem [PROGRESS.md](PROGRESS.md) |
| P4 | Catalog, search, product detail và freshness | BE/DB + FE | `backend/p4-catalog`, `frontend/p4-catalog` | Xem [PROGRESS.md](PROGRESS.md) |
| P5 | Auth, account và session security | BE/DB + FE + QA/INT | `backend/p5-auth`, `frontend/p5-account` | Xem [PROGRESS.md](PROGRESS.md) |
| P6 | Cart, pricing, coupon và cart merge | BE/DB + FE + QA/INT | `backend/p6-cart`, `frontend/p6-cart` | Xem [PROGRESS.md](PROGRESS.md) |
| P7 | Checkout, order lifecycle và guest lookup | BE/DB + FE + QA/INT | `backend/p7-orders`, `frontend/p7-checkout` | Xem [PROGRESS.md](PROGRESS.md) |
| P8 | Admin core và system configuration | BE/DB + FE + QA/INT | `backend/p8-admin`, `frontend/p8-admin` | Xem [PROGRESS.md](PROGRESS.md) |
| P9 | Integration, acceptance, demo và deploy readiness | QA/INT + ALL | `qa/p9-release` | Xem [PROGRESS.md](PROGRESS.md) |

## 4. Chi tiết milestone

### P0 — Chuẩn hóa đặc tả và traceability

**Mục tiêu:** tạo đặc tả chuẩn `docs/SPEC.md` và nối requirement gốc với PRD, quyết định, test và milestone mà không làm mất hoặc tự ý thay đổi yêu cầu.

**Đầu việc/deliverables:**

- [ ] Đọc và chuẩn hóa format/title/heading/link của source.
- [ ] Tạo [docs/SPEC.md](SPEC.md), giữ nguyên ý nghĩa requirement và ID gốc.
- [ ] Ghi rõ các quyết định đã được user chốt, không trộn proposal chưa duyệt vào requirement.
- [ ] Lập khung traceability để hoàn thiện ở P1.
- [ ] Xác nhận source file trong `docs/source/` không bị chỉnh sửa.

**Phụ thuộc:** PRD đã duyệt; các quyết định scope/stack/finance/freshness đã chốt.

**Hợp đồng liên quan:** [PRD](PRD.md), [SPEC](SPEC.md), [source specification](source/).

**Hoàn thành khi:** `SPEC.md` tồn tại, source vẫn nguyên vẹn, các override đã được đánh dấu rõ và TL/PD sign-off.

**Không làm trong P0:** không tạo migration, schema-dependent seed, route/controller/service nghiệp vụ hoặc code order.

### P1 — Schema, permissions và API/view contracts

**Mục tiêu:** thiết lập nền tảng hợp đồng để BE và FE có thể làm song song mà không tự suy diễn dữ liệu hay quyền.

**Đầu việc/deliverables:**

- [ ] Chốt PostgreSQL major version và compatibility matrix.
- [ ] Tạo `database-schema-proposal.md`: bảng MVP, khóa, FK, constraint, index, nullable/delete behavior, migration boundary.
- [ ] Mô tả rõ product/variant/roast-batch/inventory relationship.
- [ ] Chốt coupon redemption persistence và anti-enumeration/rate-limit cho guest lookup.
- [ ] Tạo `permissions-matrix.md`, backend enforcement và forbidden actions.
- [ ] Tạo `api-contract.md`: routes, methods, auth, CSRF, request/response/error/status codes.
- [ ] Tạo `view-contract.md`: template inputs, empty/loading/error states và ownership boundaries.
- [ ] Cập nhật `traceability.md` và `decisions.md`.
- [ ] Review/approval của TL/PD, BE/DB, FE và QA/INT.

**Phụ thuộc:** P0 `SPEC.md` hoàn thành.

**Hợp đồng liên quan:** [SPEC](SPEC.md), [PRD](PRD.md), [traceability](traceability.md), [decisions](decisions.md), [database schema](database-schema-proposal.md), [permissions](permissions-matrix.md), [API](api-contract.md), [view](view-contract.md).

**Hoàn thành khi:** các contract được duyệt; PostgreSQL/schema/permission/API/view decisions đủ để viết code mà không mở lại các điểm gate.

**Không làm trước approval:** migration, schema-dependent seed, business route/controller/service, order logic.

### P2 — Bootstrap nền tảng

**Mục tiêu:** dựng skeleton PHP 8.1+ custom MVC, public entry point, config an toàn, PostgreSQL connection và test harness tối thiểu.

**Đầu việc/deliverables:**

- [ ] Tạo cấu trúc `public/`, `app/`, `config/`, `database/`, `cron/`, `storage/`, `tests/` theo contract.
- [ ] Thiết lập front controller/routing cơ bản, error pages và environment config.
- [ ] Thiết lập PDO PostgreSQL với prepared statements.
- [ ] Thiết lập session, CSRF helper, escaping helper và logging không lộ secret.
- [ ] Tạo migration runner/test bootstrap chỉ theo schema đã duyệt.
- [ ] Thêm health check không lộ cấu hình nhạy cảm.

**Phụ thuộc:** P1 approval.

**Hợp đồng liên quan:** [database schema](database-schema-proposal.md), [permissions](permissions-matrix.md), [API](api-contract.md), [view](view-contract.md).

**Hoàn thành khi:** ứng dụng khởi động local, kết nối PostgreSQL hợp lệ, test harness chạy và error handling không lộ PHP/config error.

### P3 — Public content và UI shell

**Mục tiêu:** cung cấp layout/navigation/public pages theo view contract, dùng placeholder được gắn nhãn rõ khi chưa có asset chính thức.

**Đầu việc/deliverables:**

- [ ] Header/navigation/footer/responsive shell.
- [ ] Home, about/brand, policy/contact và public 404/500.
- [ ] Placeholder assets có nhãn bắt buộc.
- [ ] Backend route/view data tối thiểu theo API/view contract.
- [ ] Accessibility cơ bản, responsive states và output escaping.

**Phụ thuộc:** P2; P1 view contract.

**Hợp đồng liên quan:** [SPEC](SPEC.md), [PRD](PRD.md), [view contract](view-contract.md).

**Hoàn thành khi:** các public route chính render được trên desktop/mobile, 404/500 styled và không có nội dung thương hiệu tự tạo được trình bày như chính thức.

### P4 — Catalog, search, product detail và freshness

**Mục tiêu:** hoàn thiện browse/catalog/product detail, autocomplete search và freshness theo rule đã duyệt.

**Đầu việc/deliverables:**

- [ ] Category/listing/filter/sort theo API contract.
- [ ] Autocomplete search cho `FR-CT-05`, có giới hạn và escaping.
- [ ] Product/variant/grind presentation.
- [ ] Minimal roast-batch data cho `FR-CT-06`; không triển khai full batch management.
- [ ] Freshness: newest available batch, `roast_date + 30 days`, badge ≤7/≤21 ngày; sau ngày 30 chỉ nêu đã quá recommended date.
- [ ] Empty/error/loading states.

**Phụ thuộc:** P2, P3 và schema/API/view contracts được duyệt.

**Hợp đồng liên quan:** [SPEC](SPEC.md), [PRD](PRD.md), [database schema](database-schema-proposal.md), [API](api-contract.md), [view](view-contract.md).

**Hoàn thành khi:** catalog/search/detail chạy với dữ liệu PostgreSQL hợp lệ, freshness không đưa claim an toàn ngoài phạm vi và test boundary dates đạt.

### P5 — Auth và account

**Mục tiêu:** triển khai đăng ký/đăng nhập/tài khoản với session và role authorization an toàn.

**Đầu việc/deliverables:**

- [ ] `password_hash()`/password verification; không lưu plain-text.
- [ ] Regenerate session ID sau login/logout flow phù hợp.
- [ ] Failed-login limit: 5 attempts / 15 minutes.
- [ ] CSRF cho mọi write POST/AJAX.
- [ ] Backend authorization theo permissions matrix; UI hiding không thay thế authorization.
- [ ] Account/profile/order history views theo view contract.
- [ ] QA test session fixation, unauthorized access, validation và CSRF.

**Phụ thuộc:** P2; P1 permissions/API/view contracts.

**Hợp đồng liên quan:** [permissions](permissions-matrix.md), [API](api-contract.md), [view](view-contract.md), [PRD](PRD.md).

**Hoàn thành khi:** auth/account acceptance tests đạt và các endpoint protected bị từ chối đúng role/session.

### P6 — Cart, pricing, coupon và merge

**Mục tiêu:** triển khai cart session/persisted, identity, quantity, pricing sequence, coupon và guest-to-user merge.

**Đầu việc/deliverables:**

- [ ] Guest cart ở session; logged-in cart persisted.
- [ ] Line identity `(variant_id, grind_option_id)`.
- [ ] Quantity max 20 mỗi dòng, backend enforced.
- [ ] Pricing: hàng → subscription discount → coupon → points → shipping.
- [ ] VND integer; percentage discount floor; fixed coupon không vượt eligible merchandise; một coupon/order.
- [ ] Points cap 20% của eligible merchandise sau subscription/coupon, trước shipping.
- [ ] Chốt và implement cart merge: identical lines, stock exceeded, >20, API error/clamp, final UI message/displayed quantity.
- [ ] Không seed subscription giả; feature absent thì dashboard/status hiển thị “Chưa triển khai”.

**Phụ thuộc:** P1 finance rules/schema/API; P5 identity/session.

**Hợp đồng liên quan:** [PRD](PRD.md), [SPEC](SPEC.md), [database schema](database-schema-proposal.md), [API](api-contract.md), [view](view-contract.md), [permissions](permissions-matrix.md).

**Hoàn thành khi:** unit/integration tests cho từng bước giá, boundary quantity, coupon/points và mọi nhánh merge đều có kết quả deterministic.

### P7 — Checkout, orders và guest lookup

**Mục tiêu:** tạo order transactionally, enforce lifecycle và cung cấp guest lookup `FR-OR-05` an toàn.

**Đầu việc/deliverables:**

- [ ] Checkout three-step flow theo interpretation đã duyệt.
- [ ] Transaction: order → items → decrement stock → status history → payment record.
- [ ] Snapshot product/variant/price trên order item.
- [ ] Lifecycle: `pending → confirmed → roasting → shipping → completed`.
- [ ] Cancellation chỉ từ `pending`/`confirmed`; không skip/rollback ngoài cancellation.
- [ ] Mỗi transition tạo `order_status_history`.
- [ ] Cancel restore inventory exactly once.
- [ ] Guest lookup bằng order code + phone, có anti-enumeration/rate-limit.
- [ ] Error/retry/idempotency behavior theo API contract.

**Phụ thuộc:** P1 schema/permissions/API; P5 auth; P6 cart/pricing.

**Hợp đồng liên quan:** [SPEC](SPEC.md), [PRD](PRD.md), [database schema](database-schema-proposal.md), [permissions](permissions-matrix.md), [API](api-contract.md), [view](view-contract.md).

**Hoàn thành khi:** order transaction/lifecycle/cancel/lookup tests đạt, stock không âm do flow hợp lệ và không lộ thông tin order khi lookup sai.

### P8 — Admin core và system configuration

**Mục tiêu:** cung cấp các thao tác admin/staff trong MVP theo permission matrix và `FR-AD-12`.

**Đầu việc/deliverables:**

- [ ] Dashboard metrics lấy từ dữ liệu thật, không fabricated subscription seed.
- [ ] Subscription status hiển thị “Chưa triển khai”.
- [ ] Quản lý catalog/order/status theo quyền được duyệt.
- [ ] System configuration `FR-AD-12` với validation, auditability và authorization.
- [ ] Upload JPG/PNG/WebP, MIME/size check, random filename, storage policy.
- [ ] Không tự suy diễn delete/cascade; destructive actions phải theo contract/approval.

**Phụ thuộc:** P4–P7; P1 permissions/schema/API; chỉ triển khai các admin capability thuộc MVP.

**Hợp đồng liên quan:** [permissions](permissions-matrix.md), [API](api-contract.md), [view](view-contract.md), [database schema](database-schema-proposal.md), [PRD](PRD.md).

**Hoàn thành khi:** role matrix tests, upload validation, config validation và admin acceptance tests đạt.

### P9 — Integration, acceptance, demo và deploy readiness

**Mục tiêu:** chứng minh MVP đáp ứng contract/acceptance, xử lý regression và chuẩn bị môi trường triển khai.

**Đầu việc/deliverables:**

- [ ] Chạy toàn bộ unit/integration/security/acceptance tests.
- [ ] Chạy traceability audit từ FR/BR/NFR đến test/evidence.
- [ ] Kiểm tra responsive/accessibility và các public error pages.
- [ ] Kiểm tra PostgreSQL local/container, CI và Render managed PostgreSQL compatibility.
- [ ] Smoke test deploy, config/secret handling, logs và backup/restore procedure phù hợp phạm vi.
- [ ] Demo MVP theo user journeys đã duyệt.
- [ ] Ghi residual risks và các item ngoài MVP; không mở rộng scope ngầm.

**Phụ thuộc:** P2–P8; mọi contract và migration phải đã được duyệt.

**Hợp đồng liên quan:** [PROGRESS](PROGRESS.md), [traceability](traceability.md), [SPEC](SPEC.md), [PRD](PRD.md), toàn bộ P1 contracts.

**Hoàn thành khi:** acceptance baseline đạt hoặc mọi ngoại lệ được ghi nhận/duyệt; có release evidence và quyết định go/no-go.

## 5. Công việc không được chạy song song hoặc phải khóa trước

| Hạng mục | Lý do | Điều kiện mở khóa |
|---|---|---|
| Chuẩn hóa `SPEC.md` | Mọi contract phải dựa trên source canonical | P0 hoàn tất |
| Schema/migration và schema-dependent seed | Tránh rework và sai quan hệ batch/inventory | P1 schema approval |
| Business route/controller/service | Phụ thuộc API, permission và view contract | P1 contract approval + P2 bootstrap |
| Order/pricing/stock logic | Có transaction và business-rule coupling cao | P1 finance/schema approval + P6/P7 sequence |
| Shared config, route map, base layout | Dễ conflict giữa branch | TL/PD + owner review trước khi sửa |
| Destructive delete/cascade behavior | User yêu cầu không tự suy diễn | Quyết định explicit trong schema/API/permissions |
| Official brand assets/content | Không được tự tạo dữ liệu chính thức | Asset/content approval riêng |

## 6. Ngoài phạm vi kế hoạch MVP

Các hạng mục sau không tự động được thêm vào P0–P9:

- Full Quiz implementation.
- Full roast-batch management, public batch page và QR generation.
- Brew Lab.
- Blog, reviews, wishlist, newsletter.
- Subscription implementation.
- Wholesale quote workflow.
- Online/VNPay payment.
- Loyalty point implementation ngoài các rule/contract cần cho MVP.
- Full 39-table schema trước nhu cầu MVP.

Mọi thay đổi phạm vi phải được ghi trong [docs/PROGRESS.md](PROGRESS.md) và [docs/decisions.md](decisions.md), sau đó cập nhật kế hoạch khi được duyệt.

## 7. Cập nhật kế hoạch

- Cập nhật milestone, checklist và dependency tĩnh tại file này khi kế hoạch thay đổi.
- Cập nhật trạng thái, blocker, evidence, ngày bắt đầu/kết thúc và next action **chỉ tại** [docs/PROGRESS.md](PROGRESS.md).
- Không tạo thêm file “status”, “progress”, “roadmap” hoặc bảng tiến độ khác làm nguồn chính.
- Nếu một tài liệu khác cần hiển thị trạng thái, chỉ liên kết đến `PROGRESS.md`, không sao chép trạng thái.
