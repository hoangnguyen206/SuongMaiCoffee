# Đề xuất database schema — Sương Mai Coffee Roasters

**Trạng thái:** Proposal P1; chưa phải schema triển khai. **Ngày:** 2026-10-06.  
**Căn cứ:** [SPEC](SPEC.md), [DECISIONS](DECISIONS.md), [TECH_STACK](TECH_STACK.md). PostgreSQL 17 là ứng viên, chờ compatibility approval.

> Thiết kế khái niệm phục vụ review, không phải DDL/migration/seed. Không tạo trước bảng roadmap.

## 1. Nguyên tắc

- Chỉ domain MVP: users/addresses; catalog; minimal batch/inventory; cart; coupon/redemption; order/payment/history; config/audit/contact; cần thiết cho dashboard thật.
- Proposal PK `BIGINT GENERATED ... AS IDENTITY`, `snake_case`, FK cùng kiểu, timestamps `TIMESTAMPTZ` lưu UTC, tiền `BIGINT` VND, quantity `INTEGER`. Không dùng floating point.
- `produced_qty_g` là metadata, tuyệt đối không dùng suy tồn bán được.
- Mặc định FK `ON DELETE RESTRICT`; archive/hide master records. Không xóa order/history. Chỉ xem xét cascade cart draft sau khi có TTL rõ.
- Không schema loyalty, subscription, wholesale, full quiz, review, wishlist, blog/newsletter hay online payment trong MVP.

## 2. Bảng MVP đề xuất

Tên/field dưới đây là proposal, cần duyệt PK/FK/constraint/index/nullability/delete action trước implementation.

### Account/catalog

| Bảng | Nội dung và quan hệ |
|---|---|
| `users` | Email chuẩn hóa unique, phone, `password_hash`, role/status; role giới hạn customer/staff/admin. Không lưu plaintext password. |
| `customer_addresses` | FK `user_id`, người nhận/địa chỉ/phone; owner-only; copy vào order snapshot lúc checkout. |
| `categories`, `origins` | Danh mục/xuất xứ có slug/status; archive thay vì xóa khi được tham chiếu. |
| `products` | `origin_id`, name/slug/content/flavor profile/status; product từng có order chỉ hidden. |
| `product_categories` | Composite key nối product/category; phục vụ category allowlist coupon. |
| `product_variants` | `product_id`, SKU unique, label, `weight_g`, `price_vnd`, active; giá không âm, Admin-only cập nhật. |
| `product_images` | Product FK, path/URL, alt text, thứ tự/primary; binary không lưu DB. |
| `flavor_tags`, `product_flavor_tags` | Tag chuẩn hóa và quan hệ many-to-many. |
| `grind_options`, `product_grind_options` | Option kiểu xay và quan hệ product-option nếu options không áp dụng toàn cục; cần chốt cardinality. |

### Batch và tồn kho

| Bảng | Nội dung và quan hệ |
|---|---|
| `roast_batches` | Một batch thuộc product; batch code unique, roast date, status, `produced_qty_g` metadata. |
| `inventory_lots` | `product_id`, `variant_id`, `pool_kind`, nullable `roast_batch_id`, `quantity_on_hand`, low-stock threshold. `pool_kind` phân biệt `batch` và `unbatched`; CHECK constraint buộc `batch` phải có `roast_batch_id`, còn `unbatched` phải không có. Composite FK/check bảo đảm batch/product/variant khớp. Quantity là đơn vị bán (ví dụ túi), không phải gram. |
| `inventory_movements` | Append-only ledger theo `inventory_lot_id`, delta, movement type/reason, optional order/allocation, actor, idempotency key, timestamp. Mọi nhập/xuất/điều chỉnh/reversal ghi ledger. |
| `order_item_allocations` | Order item, chính xác inventory lot, quantity; một order line có thể phân bổ nhiều lot/pools. Allocation được giữ nguyên sau cancel/refund. |
| `allocation_reversals` | Append-only reversal tham chiếu allocation gốc, quantity, reason (`unpaid_cancellation` hoặc `refund_success`), actor/time và movement. `UNIQUE(allocation_id)` bảo đảm mỗi allocation được hoàn tối đa một lần. |

Không có tổng tồn độc lập có thể lệch với lots: sellable quantity là tổng `quantity_on_hand` các lot hợp lệ của variant, có thể đối soát với append-only ledger. Batch và unbatched inventory là các pool tách biệt theo `pool_kind`; không reservation khi chỉ add cart. Checkout khóa lots trong transaction, trừ lượng, tạo allocation và movement.

FIFO allocation đã được chốt: roast date cũ trước trong batch lots, ưu tiên batch lots trước unbatched pool; freshness vẫn chọn batch mới nhất còn hàng theo BR-11. Khi roast date trùng, **đề xuất — chờ approval cuối cùng:** batch `created_at` tăng dần rồi batch ID; trong cùng batch, lot `created_at` tăng dần rồi lot ID. Batch “còn hàng” khi có lot liên kết quantity > 0; không tham chiếu `produced_qty_g` để suy tồn.

### Refund case và attempts

| Bảng | Nội dung và quan hệ |
|---|---|
| `refund_cases` | Một case cho mỗi order đã paid; `UNIQUE(order_id)`, amount bằng tổng số đã paid, current status `refund_pending/refund_failed/refunded`, reason và timestamps. Case không bị xóa khi retry. |
| `refund_attempts` | Ý định/lần xử lý bất biến thuộc refund case, có sequence number duy nhất trong case, idempotency key, actor/time lúc khởi tạo. Retry tạo row mới; không update row cũ. |
| `refund_attempt_events` | Append-only events theo attempt: `started`, `succeeded` hoặc `failed`, event time, external reference khi thành công, failure reason khi thất bại, actor/correlation. Attempt status được suy ra từ event mới nhất; không update attempt/event cũ. |

**Đã chốt:** một refund case cho mỗi order; retry sau failed tạo attempt mới và không ghi đè lịch sử; restock atomically đúng một lần, chỉ khi refund thành công.

**Đề xuất — chờ approval cuối cùng:** unique constraint `(refund_case_id, attempt_number)`; chỉ tối đa một attempt có event `succeeded` cho mỗi case; khóa refund case/order khi tạo attempt và ghi event kết quả. `refund_attempts` và `refund_attempt_events` đều append-only; trạng thái hiện tại suy ra từ events. Attempt success chỉ được append khi có xác nhận thành công từ bên xử lý refund.

Mỗi allocation reversal tham chiếu allocation nguồn và có `UNIQUE(allocation_id)`. Khi refund thành công, transaction khóa case/order/allocations; append event `succeeded`, chuyển case/payment sang `refunded`, tạo reversal cho từng allocation, cập nhật lot balances và append movements dương; toàn bộ commit hoặc rollback cùng nhau. Request lặp lại không tạo success thứ hai và không tăng tồn lần nữa. Attempt failed chỉ append event `failed` và cập nhật trạng thái tổng thể case `refund_failed`; không restock.

### Cart và coupon

| Bảng | Nội dung và quan hệ |
|---|---|
| `carts` | Nullable `user_id` hoặc guest key HMAC/hash; đúng một principal; trạng thái/timestamps. Không lưu session token thô. |
| `cart_items` | Cart/variant/grind/quantity; unique identity `(cart_id, variant_id, grind_option_id)` với NULL semantics được chốt; quantity 1–20. |
| `coupons` | Normalized unique code, type (`percent/fixed/free_ship`), value, min order, max discount, dates, quota, per-customer limit, status/exclusions. VND integer. |
| `coupon_categories` | Allowlist category đã duyệt. Allowlist rỗng nghĩa là coupon không giới hạn category. |
| `coupon_redemptions` | Coupon/order/customer hoặc Guest `guest_phone_hmac` + key version; status `reserved/consumed/released`, release timestamp/reason. Không lưu SĐT plaintext tại đây. |

Guest identity: HMAC-SHA-256 của SĐT đã normalize bằng secret environment; không log secret. Cần chốt canonical phone normalization, key rotation và xử lý khi đổi số.

Coupon redemption lifecycle proposal: tạo `reserved` cùng transaction tạo order thành công; quota/per-customer count gồm `reserved + consumed`; khi hoàn tất chuyển `consumed`; chỉ hủy trước `paid` mới chuyển `released` và giải phóng quota. Order đã `paid` giữ quota kể cả khi refund; không xóa lịch sử. Rollback order thì redemption không tồn tại. Unique `(order_id, coupon_id)` chống duplicate; khóa coupon/identity khi kiểm quota và ghi redemption. `released` không tính quota. Còn cần chốt isolation/lock order và concurrency implementation.

Eligibility proposal: check min order/period/quota ở checkout trong transaction; chỉ eligible merchandise thuộc category allowlist được discount; allowlist rỗng không giới hạn category; fixed discount tối đa eligible value; percentage floor đến đồng; `free_ship` chỉ giảm shipping. Còn mở: category matching khi product thuộc nhiều category, phân bổ discount vào snapshot line và canonical identity.

Cart merge sau login: khóa cả hai cart; merge theo `(variant_id, grind_option_id)` và validate toàn bộ stock + max 20; nếu bất kỳ conflict thì rollback nguyên trạng, không silent clamp, không mất dòng. API trả conflict details có cấu trúc.

### Order, payment, settings

| Bảng | Nội dung và quan hệ |
|---|---|
| `orders` | Unique order code theo BR-09; nullable user, guest/customer contacts, immutable shipping snapshot (`recipient_name`, `phone`, `address_line1/2`, `province_city`, `district`, `ward`, `postal_code`), state/totals VND, idempotency key hash, timestamps. Snapshot phục vụ fulfillment/order history; API phải enforce field-level permissions trước khi serialize. |
| `order_items` | FK order; nullable master references + immutable product/variant/grind labels, unit price, quantity, discounts/line total snapshots. Snapshot là nguồn hiển thị lịch sử. |
| `order_status_history` | Order, actor, from/to state, note, created_at; append-only, mọi transition ghi cùng transaction. |
| `payments` | Order, method/status, amount VND, transfer reference, confirming actor/time. MVP COD/bank transfer; chưa online gateway. |
| `refund_cases`, `refund_attempts`, `refund_attempt_events` | Một refund case cho mỗi order; attempts bất biến và events append-only như mô tả ở mục “Refund case và attempts”. |
| `system_settings` | Key + validated JSON/value + updater/time; allowlisted keys; không chứa secret nếu có environment. |
| `audit_logs` | Actor/action/entity/time/correlation + sanitized metadata; append-only, không lưu password/token/HMAC secret. |
| `contact_messages` | Chỉ dữ liệu cần cho contact form; retention/access cần chốt. |
| `lookup_rate_limit_buckets` (proposal) | HMAC hash IP, window/attempts/`blocked_until`; atomic updates, TTL cleanup; không lưu IP rõ. PostgreSQL là shared store tạm đề xuất. |
| `idempotency_records` (optional) | Chỉ thêm nếu API contract quyết định dùng shared idempotency store; chưa mặc định bắt buộc. |

Order states BR-07: `pending → confirmed → roasting → shipping → completed`; chỉ pending/confirmed có thể cancelled. Lịch sử không cascade-delete theo product/user. Admin-only bank-transfer confirmation; COD paid khi completed theo BR-08.

## 3. Constraints, indexes và search proposal

- Unique normalized email, SKU, order code, coupon code và `(order_id, coupon_id)` redemption.
- Composite unique cho mapping tables; cart line nullable grind phải được xử lý đúng trong PostgreSQL (ví dụ nulls-not-distinct constraint hoặc normalized key).
- Checks: nonnegative price/totals/stock; positive cart/allocation/reversal quantity; valid date windows/status/type; inventory không âm; pool `batch` cần batch FK và pool `unbatched` không có batch FK. Cross-row consistency enforce qua composite FK, transaction/lock hoặc service rule được test.
- Refund: `UNIQUE(refund_cases.order_id)`, `UNIQUE(refund_attempts.refund_case_id, attempt_number)`, và tối đa một success event trên mỗi case (partial unique constraint trên event/case hoặc transaction-protected invariant). Attempt/event rows chỉ insert; không update/delete. `allocation_reversals.allocation_id` unique. Success result và stock reversal cùng một transaction.
- Ledger consistency: mọi thay đổi `quantity_on_hand` có movement tương ứng trong cùng transaction; reversal movement tham chiếu allocation reversal. Ledger append-only; balance không được sửa độc lập.
- Query indexes: orders `(user_id, created_at DESC)`, `(status, created_at)`; inventory theo variant/lot; coupon code/status/period/customer redemption; refund case theo order/status; attempts theo case/sequence; FK join columns. PostgreSQL không tự index mọi FK.
- Search proposal: normalized searchable text + `pg_trgm` GIN; `unaccent` cân nhắc để đối chiếu dấu. Chỉ bật sau benchmark tiếng Việt; không giả định `unaccent()` immutable phù hợp expression index nếu chưa chứng minh.
- P1 search defaults đã duyệt: min 2 ký tự, max 8 suggestions, debounce 250ms, p95 ≤300ms. P1 vẫn cần định nghĩa phạm vi/fixture đo p95 và có dấu/không dấu.

## 4. Xóa, audit và transaction boundaries

- Product có order chỉ hidden/archive. Staff không xóa dữ liệu; Admin cũng không xóa order, item, allocation, status history, payment, movement, redemption hay audit log.
- FK mặc định RESTRICT; deactivate user và archive master. Retention/legal deletion policy cần quyết định trước production.
- **Checkout:** kiểm idempotency → khóa/kiểm tồn lots → tạo order/item snapshots/allocations/movements → redemption reserved → payment/history → commit. Lỗi nào rollback toàn bộ.
- **Cancel unpaid:** khóa order → kiểm state/payment → cancelled + history → hoàn đúng allocation theo `allocation_reversals` + movement dương → release coupon quota → commit. `UNIQUE(allocation_id)` bảo đảm retry không restock lần hai.
- **Cancel paid/refund:** hủy order và mở refund case theo lifecycle được duyệt; không restock khi pending/failed. Khi refund attempt thành công, trong một transaction append event success, chuyển case/payment `refunded`, tạo allocation reversals, cập nhật lot balance và movements. Retry sau failed tạo attempt row và event `started` mới; không sửa/xóa row/event cũ.
- **Inventory adjustment:** khóa lot, kiểm quantity không âm, cập nhật lot + movement + audit atomic; không đổi loại pool của lot.
- **Merge:** lock carts và stock rows theo thứ tự cố định; reject/rollback toàn bộ khi conflict.
- Isolation level, lock order và deadlock retry vẫn cần chốt ở schema/implementation review; không tin kiểm tra client.

## 5. Index/cascade và quyết định còn mở

Các hướng thiết kế đã được duyệt nhưng chưa phải approval schema cuối:

- Refund: một case/order, attempts append-only, retry sau failed tạo attempt mới; chỉ refund thành công mới restock đúng một lần.
- Inventory: tách batch/unbatched bằng `pool_kind`, allocation theo lot, ledger append-only và unique reversal theo allocation.
- PII: Staff chỉ xem đầy đủ địa chỉ/số điện thoại trong order detail khi cần giao hàng; Guest lookup không trả PII. Đây không phải duyệt toàn bộ field-level matrix.

Còn cần review/approval trước DDL hoặc business code:

- Physical schema: PK/FK/type/nullability/check/index, role/session/address model; cardinality product/category/grind; `pool_kind` constraints và cách bảo đảm ledger/balance nhất quán.
- Inventory allocation: đơn vị lot, eligibility batch/unbatched, FIFO tie-break, lock order, concurrency/deadlock handling và adjustment/reversal constraints.
- Refund: constraints cuối cho case/attempt/event và tối đa một success; idempotency persistence; cách xác nhận thành công từ bên xử lý refund; locking và transaction implementation.
- Permissions: mọi field-level PII rules ngoài hai nguyên tắc DEC-030, cùng quyền Staff/Admin còn đề xuất.
- Coupon quota locking và implementation theo boundary đã duyệt (release chỉ khi hủy trước `paid`, giữ quota sau `paid` kể cả refund); HMAC normalization/rotation; order snapshots/idempotency/payment details; search normalization/index/p95; rate-limit window/cooldown/trusted proxy/failure behavior; FK actions, audit và retention.

## 6. Nguồn compatibility

- [Render PostgreSQL versions](https://render.com/docs/postgresql-creating-connecting)
- [Render supported PostgreSQL extensions](https://render.com/docs/postgresql-extensions)

P1 approval cho schema và API/view/permissions là điều kiện trước DDL/migration, schema-dependent seed hoặc business code phụ thuộc schema.
