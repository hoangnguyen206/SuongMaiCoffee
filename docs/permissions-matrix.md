# Ma trận quyền đề xuất — Sương Mai Coffee Roasters

**Trạng thái:** Proposal P1 theo hướng đã duyệt; chi tiết chờ review/sign-off. **Ngày:** 2026-10-06.  
**Căn cứ:** [SPEC](SPEC.md), [DECISIONS](DECISIONS.md), [schema proposal](database-schema-proposal.md).

> Đây là quyền backend, không phải UI visibility. Mọi write cần authenticated session phù hợp, CSRF và validation server-side; object ownership luôn được kiểm tra. API status/error cụ thể chốt trong API contract.

## 1. Ký hiệu

- **Public:** không cần đăng nhập, chỉ dữ liệu công khai.
- **Own:** chỉ dữ liệu của Customer/session hiện tại.
- **Yes:** được phép trong phạm vi công việc.
- **Admin:** Admin-only.
- **System:** backend tự xử lý trong transaction theo rule.
- **—:** bị từ chối (default deny).

Đã duyệt: Staff chuyển order qua trạng thái hợp lệ, điều chỉnh tồn có audit; Admin-only cho giá, coupon, config, role và xác nhận thanh toán; không xóa dữ liệu/lịch sử. Refund theo DEC-029 phải qua backend authorization; quyền role cụ thể cho case/attempt/result chưa được duyệt, mặc định deny cho tới sign-off. Quyền chưa được liệt kê hoặc chưa chốt mặc định deny.

## 2. Ma trận theo thao tác

| Tài nguyên/thao tác | Guest | Customer | Staff | Admin | Enforcement/giới hạn |
|---|---:|---:|---:|---:|---|
| Xem catalog và availability public | Public | Public | Public | Public | Không lộ hidden products hay internal stock. |
| Search/autocomplete | Public | Public | Public | Public | Min 2 ký tự, ≤8 suggestions; server enforce limit. |
| Guest cart create/read/update | Own | — | — | — | Gắn session identity; CSRF/write, stock + quantity 1–20. |
| Customer cart read/update | — | Own | — | — | Server xác minh cart owner cho từng request. |
| Guest cart merge sau login | — | Own flow | — | — | Atomic reject nếu bất kỳ stock/max-20 conflict; không clamp. |
| Guest checkout | Yes | — | — | — | Revalidate stock/coupon, idempotency và transaction. |
| Customer checkout/address selection | — | Own | — | — | Chỉ address của mình; order lưu snapshot. |
| Xem order Customer | — | Own | Limited | Limited | Staff/Admin chỉ order cần xử lý; giới hạn PII. |
| Guest order lookup | Yes | — | — | — | Order code + phone; lỗi neutral nếu cặp sai; 5/15m IP hash, cooldown 15m. |
| Customer hủy own order | — | Own | — | — | Chỉ pending/confirmed; hoàn tồn/quota/history đúng một lần. |
| Xem/quản lý order vận hành | — | — | Yes | Yes | Chỉ scope fulfillment; mọi action ghi actor/history. |
| Chuyển status order | — | — | Yes | Yes | Chỉ BR-07 transitions; không skip/backtrack; history atomic. |
| Internal note / delivery note | — | — | Yes | Yes | Không sửa totals/snapshot; PII tối thiểu. |
| Xem stock/lot/low stock | — | — | Yes | Yes | `produced_qty_g` không phải tồn. |
| Nhập/điều chỉnh tồn | — | — | Yes | Yes | Actor, reason, lot, delta audit; lock; không âm. |
| Sửa catalog non-price (content/category/tag/image/status) | — | — | —* | Admin | Proposal default-deny Staff; product có order chỉ hide/archive. |
| Sửa variant price | — | — | — | Admin | Admin-only; integer VND; audit before/after. |
| Quản lý roast batch đầy đủ (roadmap) | — | — | — | — | Ngoài MVP; nếu được duyệt riêng, quyền phải được duyệt theo từng thao tác/entity. |
| CRUD coupon/category allowlist | — | — | — | Admin | Staff không đọc code/quota/redemption trừ field vận hành cần thiết. |
| Confirm bank transfer paid/failed | — | — | — | Admin | Không tin client; actor/time/reference audit. |
| Xem payment status phục vụ fulfillment | — | — | Limited | Yes | Staff chỉ method/status cần thiết, không mutation. |
| Customer sửa profile/addresses | — | Own | — | Admin | Admin hỗ trợ chỉ theo action được duyệt; không vượt qua audit. |
| Quản lý users/status/roles | — | Own profile | — | Admin | Staff không đổi role; đề xuất bảo vệ last Admin/self-escalation. |
| Xem PII người mua | — | Own | Limited | Yes | Staff chỉ dữ liệu giao hàng/CS cần thiết. |
| Sửa shipping/bank/QR/config | — | — | — | Admin | Atomic validate; secrets ưu tiên env. |
| Dashboard/report | — | — | Limited | Yes | Staff widgets chỉ vận hành; Subscription “Chưa triển khai”; không giả số liệu. |
| Xem audit/inventory history | — | — | Scoped | Yes | Staff theo công việc; Admin read-only; không mutation. |
| Xóa order/payment/inventory/coupon/audit history | — | — | — | — | Cấm qua UI/API; không cascade delete lịch sử. |
| Archive/deactivate master record | — | — | — | Admin | Audit; không xóa record đang tham chiếu. |

`—*`: quyền Staff chưa đề xuất, mặc định deny. Nếu cần Staff quản lý catalog non-price/batch, phải duyệt theo từng thao tác/entity.

## 3. Ma trận field-level PII cho order response

**Trạng thái:** các hàng đánh dấu **Đề xuất — chờ duyệt** chưa phải permission đã ký duyệt. Nguyên tắc đã duyệt: Guest order lookup không trả PII; Staff chỉ xem đầy đủ địa chỉ và số điện thoại tại order detail khi cần xử lý giao hàng. Mọi field khác theo ma trận dưới đây là đề xuất mặc định để review.

| Field/nhóm field | Customer — own account/order | Guest lookup | Staff — order list | Staff — order detail | Admin — order list | Admin — order detail |
|---|---|---|---|---|---|---|
| Account `full_name`, `email`, `phone` | Đầy đủ profile của chính mình; email read-only. | Loại khỏi response. | Loại khỏi response. | Loại khỏi response; dùng recipient snapshot cho fulfillment. | **Đề xuất — chờ duyệt:** tên hiển thị; email và phone mask. | **Đề xuất — chờ duyệt:** đầy đủ trong user detail khi tác vụ quản trị yêu cầu; không trả password hash/session. |
| Address book fields (`recipient_name`, `phone`, `address_line1/2`, `province_city`, `district`, `ward`, `postal_code`) | Đầy đủ address book và snapshot của đơn mình. | Loại toàn bộ PII/address khỏi response. | **Đề xuất — chờ duyệt:** chỉ province/city và district; không trả recipient, phone, street, ward hoặc postal code. | Recipient name, phone và địa chỉ đầy đủ chỉ khi cần xử lý giao hàng (**nguyên tắc đã duyệt**). Nếu không cần giao hàng thì loại khỏi response. | **Đề xuất — chờ duyệt:** tên recipient mask; phone mask; chỉ province/city, district; loại street, ward và postal code khỏi listing. | **Đề xuất — chờ duyệt:** address snapshot đầy đủ khi tác vụ order/CS cần; không truy cập address book không liên quan. |
| Order identifier/date/status | Đầy đủ orders của chính mình. | Chỉ order ID, order date và trạng thái cơ bản; không có PII. | Order code, ngày và status trong scope fulfillment. | Order code, ngày, status và timeline phục vụ tác vụ; internal note theo scope. | Order code, ngày và status; không kèm PII đầy đủ. | Đầy đủ order status/history và actor metadata đã sanitize. |
| Order item fields | Tên/snapshot sản phẩm, variant, grind, quantity, giá dòng, discounts và totals của own order. | Tên/snapshot sản phẩm, variant, quantity và totals tối thiểu đã nêu trong API contract; không chứa tên người mua/custom text. | Tên/SKU/variant/grind và quantity cần soạn; giá, discount và totals loại khỏi response. | Tên/SKU/variant/grind, quantity; **Đề xuất — chờ duyệt:** COD amount cần thu; không trả cost/margin. | Item summary và totals cho báo cáo; dữ liệu PII không gắn vào response. | Đầy đủ snapshot, giá, discounts và totals cần cho order/finance; không có cost/margin nếu không được cấp riêng. |
| Payment method/status/amount/reference | Payment method/status/amount của own order; loại internal reference/audit. | Loại toàn bộ khỏi response. | Method/status cần cho fulfillment; COD amount chỉ nếu cần thu tiền (**Đề xuất — chờ duyệt**); bank reference loại. | Method/status; COD amount nếu thu hộ; không xem bank reference (**Đề xuất — chờ duyệt**). | Method/status/amount; reference mask hoặc loại khỏi list (**Đề xuất — chờ duyệt**). | Chi tiết payment/refund, external reference, reason và actor/time cho finance/admin task; không bao gồm credential/token. |
| Internal notes, cancellation/refund reasons, audit metadata | Loại internal notes/audit; chỉ thấy customer-facing status/note được phép. | Loại khỏi response. | Chỉ operational note cần trong fulfillment; không xem refund/internal finance details. | Scoped operational notes; không tự động cấp audit toàn hệ thống. | Audit summary/masked references theo nhu cầu; không lộ secrets. | Chi tiết audit đã sanitize theo quyền Admin; không lưu/trả secrets, token hoặc HMAC key. |
| Session, password, HMAC/IP digests, secrets | Luôn loại khỏi response. | Luôn loại khỏi response. | Luôn loại khỏi response. | Luôn loại khỏi response. | Luôn loại khỏi response. | Luôn loại khỏi response. |

**Đề xuất — chờ duyệt:** khi một field cần che, dùng masking ổn định tại API boundary: phone giữ 2 số cuối (`**********12`), email giữ ký tự đầu local-part và domain (`a***@example.com`), tên recipient chỉ giữ chữ cái đầu và mask phần còn lại (`N***`). Street address bị loại khỏi list; không thay thế bằng chuỗi gần đầy đủ. Mask không áp dụng cho Staff order detail khi cần giao hàng theo nguyên tắc đã duyệt. Không ghi plaintext PII vào audit/log.

## 4. Rule order và payment

- Role không bỏ qua state machine BR-07; mọi status transition hợp lệ ghi actor/history.
- Customer hủy own order; Staff/Admin có thể hủy order trong phạm vi vận hành; chỉ pending/confirmed. Staff/Admin phải ghi lý do nội bộ; Customer note không bắt buộc. Quyền hủy paid order và thao tác refund mặc định deny tới khi sign-off.
- Cancel unpaid đồng bộ order, history, allocation reversals/inventory movements và coupon release trong một transaction; reversal unique theo allocation.
- Cancel paid mở/duy trì đúng một refund case cho order; attempts append-only. Retry sau failed tạo attempt mới, không ghi đè. Refund success mới restock atomically đúng một lần theo DEC-029. Quyền role cho case/attempt/result chưa được duyệt; mặc định deny tới khi sign-off.
- COD tự chuyển `paid` khi completed theo BR-08. Bank-transfer confirmation Admin-only; record actor/time/reference/reason.

## 5. Server-side checklist

1. Xác minh active session/user; role lấy từ server, không từ payload.
2. Authorize role **và** resource ownership/scope trước khi serialize PII hoặc mutate.
3. CSRF trên mọi write form/AJAX.
4. Validate state, input, stock, quota và concurrency trong transaction phù hợp.
5. Audit actor/action/time cho order, inventory, price, coupon, config, role và payment changes.
6. Không ghi password, token, HMAC secret, raw sensitive data hay stack trace vào logs/errors.
7. Forbidden/not-found mapping phải nhất quán với API contract; guest lookup không tiết lộ order existence.

## 6. Acceptance/security tests

- Customer/Staff direct call Admin-only endpoint bị từ chối, không side effect.
- Staff không thể sửa giá/coupon/config/role hoặc xác nhận bank transfer kể cả tự tạo request.
- Customer A không thể đọc/sửa cart/address/order Customer B bằng cách đổi ID.
- Guest lookup response không chứa PII; kiểm tra từng field sau field-level allowlist sign-off, không chỉ status code.
- Staff order list chỉ trả field theo ma trận đã ký duyệt; Staff order detail được trả đầy đủ address/phone chỉ trong context cần xử lý giao hàng theo DEC-030. Các field khác chờ field-level sign-off.
- Admin order list mask/drop PII theo field matrix; Admin detail chỉ trả field cần thiết cho tác vụ được phép.
- Response không chứa password hash, session/token, HMAC key/digest hoặc secret với bất kỳ role nào.
- Guest lookup sai cặp dữ liệu trả lỗi trung tính và rate limit/cooldown có hiệu lực.
- Invalid status transition/inventory adjustment rollback toàn bộ.
- Inventory/price/coupon/config/role/payment mutation có actor/time audit.
- Refund retry giữ attempt failed và không thể tạo restock lần hai; duplicate reversal bị unique constraint từ chối/no-op an toàn. Acceptance sau khi schema/API/permission liên quan được sign-off.
- Batch/unbatched lot không thể bị tạo với tổ hợp `pool_kind`/`roast_batch_id` mâu thuẫn; chỉ kiểm acceptance inventory sau schema sign-off, không bao gồm batch-management workflow MVP.
- Delete order/history bị từ chối; referenced product chỉ hide/archive.

## 7. Còn mở trước approval

- Các field-level rules được đánh dấu **Đề xuất — chờ duyệt** trong ma trận PII (đặc biệt Admin list/detail, Staff list, item/payment values, internal notes/audit) cần Product Owner/TL + Backend + QA sign-off.
- Staff chỉ xem đầy đủ địa chỉ và số điện thoại tại order detail khi cần xử lý giao hàng; Guest lookup không trả PII — hai nguyên tắc này đã được duyệt.
- Staff sửa catalog non-price vẫn default deny; full batch-management workflow ngoài MVP và mọi quyền quản lý batch nếu được duyệt riêng phải được chốt theo từng thao tác.
- Admin account status, last-admin protection và self-role restrictions.
- Forbidden vs not-found theo endpoint, session/CSRF failures.
- Audit retention/export/incident access.

Ma trận và field-level proposals chỉ thành permission triển khai sau Product Owner/TL, Backend và QA sign-off. Quyền chưa chốt tiếp tục deny mặc định.
