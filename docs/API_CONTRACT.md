# API Contract — Sương Mai Coffee Roasters

**Trạng thái:** Draft P1 để review; chưa phải approval triển khai. **Ngày:** 2026-10-07.  
**Căn cứ:** [SPEC](SPEC.md), [PRD](PRD.md), [TECH_STACK proposal](TECH_STACK.md), [schema proposal](database-schema-proposal.md), [permissions matrix](permissions-matrix.md), [decision log](DECISIONS.md), [test plan](TEST_PLAN.md).

> Tài liệu này mô tả hợp đồng API dự kiến cho MVP. Các quyết định được duyệt trong hội thoại là baseline; đề xuất mặc định vẫn cần sign-off và không thay thế approval schema/permissions/API P1. Không tạo migration, schema triển khai, schema-dependent seed hoặc code nghiệp vụ chỉ dựa trên tài liệu này.

## 1. Phạm vi API

Bao gồm M0–M6, các chức năng được chọn `FR-CT-05`, `FR-OR-05`, `FR-CN-07`, `FR-AD-12` và dữ liệu roast batch tối thiểu hỗ trợ `FR-CT-06`.

Không có API MVP cho Quiz, Subscription, full batch management, reviews, wishlist, blog, newsletter, online payment hoặc loyalty. Dashboard hiển thị Subscription là **“Chưa triển khai”**, không trả số liệu giả.

API dùng tiền VND dạng số nguyên. Giá, giảm giá, phí giao hàng và tổng tiền phải được server tính lại; không tin các giá trị đó từ client.

## 2. Quy ước chung

### 2.1. Versioning, session và CSRF

- API JSON dùng prefix `/api/v1`.
- Authentication dùng same-origin session cookie.
- Mọi request ghi dữ liệu phải gửi `X-CSRF-Token`, kể cả Guest cart và các request AJAX.
- Backend xác định user, role và quyền; không nhận chúng từ request body hoặc query string.
- Session ID được regenerate sau login. Cookie flags, expiry và storage chi tiết còn thuộc TECH_STACK/auth approval.
- `GET` không được tạo side effect.

**Đề xuất — chờ duyệt:** `GET /api/v1/session` trả `authenticated` cùng CSRF token để frontend gửi trên các write tiếp theo. Token và cookie không bao giờ xuất hiện trong error message hoặc log.

### 2.2. Response envelope và lỗi

Response thành công:

```json
{
  "data": {},
  "meta": {}
}
```

Response lỗi:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Một số trường cần được kiểm tra.",
    "fields": {
      "phone": ["Số điện thoại không hợp lệ."]
    },
    "details": {},
    "request_id": "opaque-correlation-id"
  }
}
```

Client dựa vào `code`, không dựa vào `message`. Không trả stack trace, secrets hoặc thông tin nội bộ. `request_id` dùng đối chiếu log đã được sanitized.

| HTTP | Code đề xuất | Dùng cho |
|---|---|---|
| 400 | `INVALID_REQUEST` | JSON sai cú pháp hoặc request không đúng cấu trúc. |
| 401 | `UNAUTHENTICATED` | Thiếu hoặc hết session. |
| 403 | `FORBIDDEN`, `CSRF_INVALID` | Không có quyền hoặc CSRF không hợp lệ. |
| 404 | `NOT_FOUND` | Resource không tồn tại/không được phép lộ; Guest lookup mismatch cũng dùng 404 trung tính. |
| 409 | `CONFLICT`, `OUT_OF_STOCK`, `CART_MERGE_CONFLICT`, `INVALID_ORDER_TRANSITION`, `IDEMPOTENCY_KEY_REUSED`, `IDEMPOTENCY_IN_PROGRESS` | Xung đột nghiệp vụ, trạng thái hoặc idempotency. |
| 422 | `VALIDATION_FAILED`, `COUPON_NOT_APPLICABLE` | Request hợp cú pháp nhưng không qua validation/nghiệp vụ. |
| 429 | `RATE_LIMITED` | Rate limit; có header `Retry-After`. |
| 500 | `INTERNAL_ERROR` | Lỗi không dự kiến, chỉ kèm `request_id`. |
| 503 | `LOOKUP_UNAVAILABLE` | Rate-limit store lỗi; lookup fail closed. Mã này là đề xuất. |

### 2.3. Pagination, dates và filters

Collection trả `data: []` và `meta`:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total_items": 0,
    "total_pages": 0
  }
}
```

- `page` bắt đầu từ 1; `per_page` mặc định 20, tối đa 100.
- Giá trị ngoài giới hạn trả `422`, không tự clamp.
- Page lớn hơn `total_pages` trả `200` với danh sách rỗng và tổng số chính xác.
- **Đề xuất — chờ duyệt:** filter nhiều giá trị dùng comma-separated IDs; giá trị lặp, không hợp lệ hoặc không thuộc whitelist sort trả `422`.
- Timestamp trả UTC ISO-8601; ngày lịch như `roast_date` trả `YYYY-MM-DD`. Hiển thị freshness dùng `Asia/Ho_Chi_Minh`.

### 2.4. Idempotency

Bắt buộc `Idempotency-Key` với:

- Tạo order.
- Tạo inventory lot.
- Inventory adjustment.
- Payment confirmation.
- Refund record/attempt.

**Đã chốt:** scope là `operation + principal`; cùng key và cùng fingerprint replay kết quả; cùng key nhưng payload khác trả `409`; retention theo vòng đời domain, không tự đặt TTL theo ngày; Guest key không chuyển qua login/cart merge.

**Đề xuất — chờ duyệt:**

- Client tạo UUIDv4 mới cho mỗi thao tác nghiệp vụ; API chấp nhận key ASCII từ 16–128 ký tự.
- Fingerprint dùng JSON Canonicalization Scheme (RFC 8785) trên method, route operation và payload đã validate; request identity gắn phiên bản canonicalization.
- Hai request đồng thời cùng key/fingerprint đợi kết quả đã commit; nếu thao tác đầu còn đang xử lý thì trả `409 IDEMPOTENCY_IN_PROGRESS` và `Retry-After`.
- Lưu tham chiếu kết quả nghiệp vụ và status để replay; không replay `Set-Cookie`, CSRF token hoặc header nhạy cảm. PII được render lại sau khi xác thực principal.
- Lỗi validation xảy ra trước khi thực thi nghiệp vụ không chiếm key.

## 3. Quyền và PII

Mặc định deny; mọi endpoint kiểm tra role **và** ownership/scope ở backend. Nguyên tắc đã duyệt: Guest order lookup không trả PII; Staff chỉ xem đầy đủ địa chỉ và số điện thoại tại order detail khi cần xử lý giao hàng. Ma trận dưới đây nêu các quy tắc cụ thể còn lại; mọi ô ghi **Đề xuất — chờ duyệt** chưa phải permission đã ký duyệt.

| Field/nhóm field | Customer — own data | Guest lookup | Staff — order list | Staff — order detail | Admin — order list | Admin — order detail |
|---|---|---|---|---|---|---|
| Account `full_name`, `email`, `phone` | Đầy đủ profile của mình; email read-only. | Loại khỏi response. | Loại khỏi response. | Loại khỏi response; dùng recipient snapshot cho fulfillment. | **Đề xuất — chờ duyệt:** tên; email/phone mask. | **Đề xuất — chờ duyệt:** đầy đủ trong user detail khi tác vụ yêu cầu; không trả password hash/session. |
| Address book: `recipient_name`, `phone`, `address_line1`, `address_line2`, `province_city`, `district`, `ward`, `postal_code` | Đầy đủ address book và snapshot của order mình. | Loại toàn bộ khỏi response. | **Đề xuất — chờ duyệt:** chỉ province/city và district; loại recipient, phone, street, ward, postal code. | Recipient name, phone và address đầy đủ chỉ khi cần cho giao hàng (**nguyên tắc đã duyệt**); nếu không cần thì loại. | **Đề xuất — chờ duyệt:** recipient mask, phone mask, chỉ province/city và district; loại street/ward/postal code. | **Đề xuất — chờ duyệt:** address snapshot đầy đủ khi order task yêu cầu; không trả address book không liên quan. |
| Order `order_id`, `order_code`, date, status/history | Đầy đủ order của mình. | Chỉ `order_id`, ngày order và status cơ bản; không PII. | **Đề xuất — chờ duyệt:** order code, date, status trong scope fulfillment. | **Đề xuất — chờ duyệt:** code/date/status/timeline và internal note theo tác vụ. | **Đề xuất — chờ duyệt:** code/date/status; không PII đầy đủ. | **Đề xuất — chờ duyệt:** status/history/actor metadata đã sanitize theo admin task. |
| Order items, quantity, price, discounts, totals | Đầy đủ snapshot, giá/discount/totals của own order. | Item name/snapshot, variant, quantity và totals tối thiểu; không kèm tên/liên hệ người mua. | **Đề xuất — chờ duyệt:** item/SKU/variant/grind và quantity cần soạn; không trả giá/discount/totals. | **Đề xuất — chờ duyệt:** cùng dữ liệu fulfillment; COD amount chỉ nếu cần thu hộ; không cost/margin. | **Đề xuất — chờ duyệt:** item summary/totals cho báo cáo; loại PII. | **Đề xuất — chờ duyệt:** snapshot, price/discount/totals cần cho tác vụ; không cost/margin nếu không được cấp riêng. |
| Payment method/status/amount/reference | Method/status/amount của own order; không internal audit/reference. | Loại toàn bộ khỏi response. | **Đề xuất — chờ duyệt:** method/status nếu cần fulfillment; COD amount chỉ khi cần thu; bank reference loại. | **Đề xuất — chờ duyệt:** method/status; COD amount nếu cần; không bank reference. | **Đề xuất — chờ duyệt:** method/status/amount; reference mask hoặc loại. | **Đề xuất — chờ duyệt:** payment/refund details, external reference, reason, actor/time cho finance task; không credential/token. |
| Internal/delivery notes, cancellation/refund reasons, audit | Chỉ customer-facing note/status; loại internal note/audit. | Loại khỏi response. | **Đề xuất — chờ duyệt:** chỉ operational note cần fulfillment. | **Đề xuất — chờ duyệt:** scoped operational note; không cấp audit toàn hệ thống. | **Đề xuất — chờ duyệt:** audit summary/masked reference theo tác vụ. | **Đề xuất — chờ duyệt:** sanitized audit theo Admin task; không secrets/HMAC key. |
| Password hash, session/token, HMAC/IP digest, secret | Luôn loại. | Luôn loại. | Luôn loại. | Luôn loại. | Luôn loại. | Luôn loại. |

**Đề xuất — chờ duyệt:** dùng serializer riêng cho Customer own order, Guest lookup, Staff list/detail và Admin list/detail; authorize trước khi serialize; Staff detail chỉ trả recipient/address/phone đầy đủ trong context giao hàng được phép. Không có endpoint đọc address book của khách cho Staff. Masking proposal: phone giữ 2 số cuối (`**********12`), email giữ ký tự đầu local-part và domain (`a***@example.com`), recipient name chỉ giữ chữ cái đầu (`N***`); street address bị loại khỏi listing.

- Staff không tạo inventory lot trong MVP vì không có workflow assignment.
- Staff không sửa giá, coupon, config, role hoặc xác nhận payment; quyền role đối với refund case/attempt/result chưa được duyệt và mặc định deny tới khi sign-off.
- Product từng có order chỉ được ẩn/archive; không xóa lịch sử/order.
- Admin order listing phải mask PII không cần cho tác vụ.
- Mọi thao tác payment/refund được role cho phép và thao tác inventory/cấu hình/giá có audit metadata; quyền refund còn chờ sign-off. Log không chứa password, token, HMAC secret hoặc PII thừa.

## 4. Account và authentication

| Method / path | Quyền | Request/hành vi |
|---|---|---|
| `GET /api/v1/session` | Guest hoặc session hiện tại | Trả session state và CSRF token theo đề xuất ở §2.1. |
| `POST /api/v1/auth/register` | Guest | `full_name`, `email`, `phone`, `password`; email chuẩn hóa và unique. |
| `POST /api/v1/auth/login` | Guest | `email`, `password`; giới hạn 5 lần/15 phút theo quy tắc dự án. |
| `POST /api/v1/auth/logout` | Session hiện tại | Hủy session; CSRF bắt buộc. |
| `GET /api/v1/account/me` | Customer | Trả account của chính user. Email read-only. |
| `PATCH /api/v1/account/me` | Customer | Chỉ `full_name`, `phone` trong draft. |
| `PUT /api/v1/account/me/password` | Customer | `current_password`, `new_password`; đổi mật khẩu thu hồi sessions khác, giữ session hiện tại. |
| `GET /api/v1/account/addresses` | Customer | Chỉ địa chỉ của chính user; paginated. |
| `POST /api/v1/account/addresses` | Customer | Tạo address. |
| `PATCH /api/v1/account/addresses/{addressId}` | Customer, owner | Sửa address của chính user. |
| `DELETE /api/v1/account/addresses/{addressId}` | Customer, owner | Xóa khỏi address book; không ảnh hưởng order snapshot. |
| `POST /api/v1/account/addresses/{addressId}/default` | Customer, owner | Đặt địa chỉ mặc định. |

Đăng ký/đổi password dùng password dài tối thiểu 8 ký tự, có chữ và số; lưu bằng `password_hash()`. Login failures không tiết lộ có tồn tại email hay không.

Address payload:

```json
{
  "recipient_name": "Tên người nhận",
  "phone": "+84...",
  "address_line1": "Số nhà, đường",
  "address_line2": null,
  "province_city": "Tỉnh/Thành phố",
  "district": "Quận/Huyện",
  "ward": "Phường/Xã",
  "postal_code": null
}
```

- `recipient_name`, `phone`, `address_line1`, `province_city`, `district`, `ward` bắt buộc; `address_line2`, `postal_code` tùy chọn.
- Phone chuẩn hóa/validate theo E.164.
- Province/city, district, ward là tên tự do, không dùng enum địa giới.
- **Đề xuất — chờ duyệt:** độ dài tính theo Unicode code points sau trim/NFC; `recipient_name` tối đa 120, phone tối đa 16 ASCII ký tự gồm `+`, `address_line1` tối đa 255, `address_line2` tối đa 255, province/city/district/ward mỗi field tối đa 100, postal code tối đa 20. Đây chưa phải giới hạn schema đã duyệt.

## 5. Catalog, search và freshness

### 5.1. Public endpoints

| Method / path | Query/filter | Sort | Quyền |
|---|---|---|---|
| `GET /api/v1/categories` | Không filter bắt buộc; chỉ danh mục public/active. | `name_asc`; `display_order_asc` nếu field tồn tại trong schema được duyệt. | Public |
| `GET /api/v1/origins` | Chỉ origin public/active. | `name_asc`. | Public |
| `GET /api/v1/products` | `category_slug`, `origin_slug`, `roast_level`, `flavor_tag_slug`, `product_type`, `min_price_vnd`, `max_price_vnd`, `in_stock`. | `newest`, `price_asc`, `price_desc`, `best_selling`. | Public |
| `GET /api/v1/products/{slug}` | `variant_id` tùy chọn để chọn freshness theo variant. | Không áp dụng. | Public |
| `GET /api/v1/search/suggestions?q=...` | Query `q`. | Ranking theo match score; tie-break đề xuất theo tên rồi ID. | Public |

`roast_level` và `product_type` có trong yêu cầu lọc nhưng enum values chưa được xác định trong SPEC/schema proposal. API phải validate theo enum được duyệt; giá trị hợp lệ hiện là **TBD**, không tự tạo.

**Đề xuất — chờ duyệt cho `best_selling`:** xếp theo tổng quantity trong order `completed` 30 ngày gần nhất; tie-break `newest`, sau đó stable product ID. `rating_desc` chưa hỗ trợ trong MVP vì reviews nằm ngoài scope. Best-selling không trả ranking giả nếu không có order data phù hợp.

### 5.2. Search

- **Đã duyệt:** tối thiểu 2 ký tự, tối đa 8 suggestions, debounce 250 ms thuộc UI, p95 target ≤300 ms.
- **Đề xuất — chờ duyệt:** trim và chuẩn hóa Unicode NFC; tìm tiếng Việt không phân biệt dấu; query sau chuẩn hóa dưới 2 ký tự trả `200` với `data: []`; đo p95 tại server endpoint. Cách chuẩn hóa dấu, xử lý query sau normalize và phạm vi/fixture đo p95 chưa được duyệt.
- **Đề xuất benchmark — chờ duyệt, chưa chạy:** profile 10.000 active products, 50 concurrent users, warm-up 1 phút, đo 5 phút, tối thiểu 10.000 requests; fixture, CI gate và yêu cầu báo cáo cần sign-off trước khi trở thành acceptance criteria.

### 5.3. Product detail và freshness

Response trả thông tin public, không trả cost, supplier notes, allocation hay raw internal stock.

```json
{
  "data": {
    "id": "product-id",
    "slug": "coffee-example",
    "name": "Tên sản phẩm",
    "description": "Mô tả public",
    "images": [],
    "origin": {},
    "categories": [],
    "flavor_profile": {},
    "variants": [
      {
        "id": "variant-id",
        "label": "250g",
        "price_vnd": 185000,
        "available": true,
        "grind_options": []
      }
    ],
    "freshness": {
      "roast_date": "YYYY-MM-DD",
      "best_enjoyed_until": "YYYY-MM-DD",
      "age_days": 5,
      "label": "Rất tươi",
      "message": null
    }
  }
}
```

- Freshness theo batch mới nhất còn stock của variant được chọn, theo ngày lịch `Asia/Ho_Chi_Minh`.
- Mốc `roast_date + 30 ngày` là best-enjoyed date, không phải hạn an toàn. Sau mốc này chỉ thông báo đã qua mốc thưởng thức ngon nhất.
- Không có batch còn stock thì `freshness: null`; unbatched pool không cung cấp freshness.
- Hàng vẫn bán được nếu variant có sellable stock từ unbatched pool.
- Batch code không trả public trong draft; chỉ trả ngày rang/freshness.

## 6. Cart, coupon và giá

### 6.1. Cart

| Method / path | Quyền | Request/hành vi |
|---|---|---|
| `GET /api/v1/cart` | Guest/session hoặc Customer | Trả lines, totals, coupon summary và availability. |
| `POST /api/v1/cart/items` | Guest/session hoặc Customer | `{variant_id, grind_option_id, quantity}`; identity `(variant_id, grind_option_id)`; cộng quantity nếu cùng identity. |
| `PATCH /api/v1/cart/items/{lineId}` | Guest/session hoặc Customer | `quantity` là số lượng tuyệt đối mới. |
| `PUT /api/v1/cart/items/{lineId}/grind` | Guest/session hoặc Customer | Đổi grind; nếu line đích tồn tại thì merge quantity vào line đích. |
| `DELETE /api/v1/cart/items/{lineId}` | Guest/session hoặc Customer | Chỉ xóa line trong cart hiện tại. |
| `POST /api/v1/cart/merge` | Customer sau login | Server tự nhận diện Guest cart từ session. |
| `POST /api/v1/cart/coupon` | Guest/session hoặc Customer | Validate và áp coupon; không giữ quota. |
| `DELETE /api/v1/cart/coupon` | Guest/session hoặc Customer | Gỡ coupon khỏi cart. |

**Đã chốt:** tối đa 20 sản phẩm mỗi line; cùng variant và grind thì cộng; grind khác thành line riêng; update quantity là tuyệt đối; merge/grind change vượt stock hoặc giới hạn reject nguyên tử, không clamp, giữ nguyên cart; trả `max_acceptable_quantity` cho từng line bị ảnh hưởng.

Ví dụ conflict:

```json
{
  "error": {
    "code": "CART_MERGE_CONFLICT",
    "message": "Một số dòng giỏ cần được điều chỉnh trước khi gộp.",
    "details": {
      "conflicts": [
        {
          "variant_id": "variant-id",
          "grind_option_id": "grind-id",
          "attempted_quantity": 22,
          "max_acceptable_quantity": 20,
          "reason": "LINE_QUANTITY_LIMIT"
        }
      ]
    },
    "request_id": "opaque-correlation-id"
  }
}
```

**Đề xuất — chờ duyệt:** null grind là giá trị identity riêng, tương đương “whole bean”, được enforce unique theo `(cart_id, variant_id, grind_option_id)` với null semantics PostgreSQL rõ ràng. Chỉ hiển thị availability cần cho UI, không trả số tồn nội bộ.

### 6.2. Coupon

| Method / path | Quyền | Hành vi |
|---|---|---|
| `GET /api/v1/admin/coupons` | Admin | Listing/filter theo status/type/active period; pagination. |
| `POST /api/v1/admin/coupons` | Admin | Tạo coupon, category allowlist và quota. |
| `PATCH /api/v1/admin/coupons/{couponId}` | Admin | Sửa coupon; không xóa redemption history. |
| `GET /api/v1/admin/coupons/{couponId}/redemptions` | Admin | Xem redemption cần thiết; không trả Guest HMAC digest thô. |

- `type` dùng các giá trị BR-04: `percent`, `fixed`, `free_ship`.
- Empty category allowlist nghĩa là **không giới hạn category**; product nhiều category đủ điều kiện khi có giao với allowlist.
- Cart coupon validation không reserve quota. Quota được giữ trong transaction tạo order.
- Hủy order trước `paid`: release quota; sau `paid`: giữ quota kể cả đã refund.
- **Đề xuất — chờ duyệt theo OPEN-005:** chuẩn hóa Guest phone E.164 trước HMAC. Redemption lưu digest và key version; ghi mới bằng key hiện tại, dual-read khi rotation. Canonical normalization và điều kiện kết thúc dual-read chưa được chốt.
- Quota/per-customer limit phải được kiểm tra khóa/transactional để tránh concurrent oversubscription.
- Pricing sequence: giá hàng → subscription discount nếu module được bật → coupon → points nếu module được bật → shipping. Module Subscription/points chưa bật trong MVP.

## 7. Checkout, orders, cancellation và payment

### 7.1. Checkout

Ba bước checkout là UI flow, không buộc phải có ba API riêng. **Đề xuất endpoints:**

| Method / path | Quyền | Hành vi |
|---|---|---|
| `GET /api/v1/checkout/config` | Public | Trả whitelist cấu hình công khai ở §11. |
| `POST /api/v1/checkout/quote` | Guest/session hoặc Customer | Preview tổng tiền từ cart server-side; không tạo order, không reserve coupon quota. |
| `POST /api/v1/checkout/orders` | Guest/session hoặc Customer | Tạo order; `Idempotency-Key` bắt buộc. |

Order request đề xuất gồm:

```json
{
  "customer": {
    "full_name": "Tên người nhận",
    "email": "email@example.com",
    "phone": "+84..."
  },
  "address": {
    "recipient_name": "Tên người nhận",
    "phone": "+84...",
    "address_line1": "Số nhà, đường",
    "address_line2": null,
    "province_city": "Tỉnh/Thành phố",
    "district": "Quận/Huyện",
    "ward": "Phường/Xã",
    "postal_code": null
  },
  "address_id": null,
  "shipping_method": "standard",
  "payment_method": "bank_transfer"
}
```

- Customer có thể gửi `address_id` của chính họ hoặc snapshot address; Guest phải gửi address. Server kiểm tra ownership.
- Client không gửi giá, discounts, shipping cost, availability hoặc order total.
- `shipping_method` hiện chỉ có một phương án; enum chính thức cần schema/checkout config review.
- `payment_method` chỉ COD hoặc bank transfer trong MVP.
- **Đề xuất — chờ duyệt:** thành công trả `201` với `order_id`, `order_code`, trạng thái, payment instructions cần thiết, item/price snapshots và totals.
- Order creation là một transaction: revalidate cart/stock/coupon; khóa các row cần thiết; tạo order/items/snapshots/status history/payment; trừ tồn và ghi allocations; giữ coupon quota. Nếu bất cứ bước nào thất bại thì rollback toàn bộ.

### 7.2. Customer và Admin order endpoints

| Method / path | Quyền | Filters/sort |
|---|---|---|
| `GET /api/v1/account/orders` | Customer, own | `status`, `created_from`, `created_to`; sort `created_at_desc` mặc định hoặc `created_at_asc`. |
| `GET /api/v1/account/orders/{orderId}` | Customer, own | Không có. |
| `POST /api/v1/account/orders/{orderId}/cancellation` | Customer, own | Chỉ pending/confirmed; note optional. |
| `GET /api/v1/admin/orders` | Staff/Admin theo permission | `status`, `payment_status`, `order_code`, `created_from`, `created_to`; sort `created_at_desc`, `created_at_asc`, `order_code_asc`. |
| `GET /api/v1/admin/orders/{orderId}` | Staff/Admin theo permission | Field response được mask theo role. |
| `PATCH /api/v1/admin/orders/{orderId}/status` | Staff/Admin | Chỉ chuyển transition hợp lệ; ghi actor/history. |
| `POST /api/v1/admin/orders/{orderId}/cancellation` | Staff/Admin | Chỉ pending/confirmed; lý do nội bộ bắt buộc. |

Order status theo BR-07: `pending → confirmed → roasting → shipping → completed`; `cancelled` là trạng thái hủy. Không skip/backtrack. Mọi transition ghi history trong cùng transaction. Processing bắt đầu ở `roasting`.

**Đã chốt:** Customer, Staff, Admin được hủy trong phạm vi quyền; Staff/Admin phải ghi lý do nội bộ; Customer cancellation note không bắt buộc.

**Đề xuất — chờ duyệt:** order list filter status chỉ nhận enum được schema duyệt; Admin list chỉ trả PII được cấp, không trả payment reference hay address đầy đủ nếu không cần cho nhiệm vụ.

### 7.3. Payment confirmation

| Method / path | Quyền | Request/hành vi |
|---|---|---|
| `POST /api/v1/admin/orders/{orderId}/payment-confirmations` | Admin-only | `result: paid|failed`, `reference`, `reason`; `Idempotency-Key` bắt buộc. |

- Chỉ Admin xác nhận bank transfer.
- COD chuyển `paid` khi order hoàn tất theo BR-08.
- Chuyển khoản có thể chuyển `failed → paid` nếu tiền đến muộn; audit actor/time/reference/reason.
- Client không thể tự đặt payment status.
- **Đề xuất — chờ duyệt:** `reason` bắt buộc khi ghi `failed`; `reference` bắt buộc cho `paid`.

### 7.4. Cancellation và refund

| Method / path | Quyền | Request/hành vi |
|---|---|---|
| `POST /api/v1/admin/orders/{orderId}/refunds` | **Đề xuất — chờ permission/API approval:** Admin-only | Tạo refund case duy nhất cho order và attempt đầu ở trạng thái `pending`; amount full lấy từ paid total, không nhận amount tùy client. `Idempotency-Key` bắt buộc. |
| `POST /api/v1/admin/refunds/{refundId}/attempts` | **Đề xuất — chờ permission/API approval:** Admin-only | Tạo attempt retry mới chỉ khi attempt trước `failed`; attempt row/event log append-only. `Idempotency-Key` bắt buộc. |
| `POST /api/v1/admin/refunds/{refundId}/attempts/{attemptId}/result` | **Đề xuất — chờ permission/API approval:** Admin-only | Append result event `succeeded` hoặc `failed` cho attempt đang `pending`; `Idempotency-Key` bắt buộc. Success yêu cầu external reference; failure lưu reason. | |

Request tạo case đề xuất:

```json
{
  "reason": "Lý do hoàn tiền"
}
```

Response tạo case/attempt đầu đề xuất `202 Accepted`, trả `refund_id`, `refund_status: "refund_pending"`, `attempt_id`, `attempt_status: "pending"` và full `amount_vnd` do server xác định từ paid order. Không cho client chọn partial amount hoặc tự xác nhận đã hoàn tiền.

Result body đề xuất:

```json
{
  "result": "succeeded",
  "external_reference": "bank-reference",
  "failure_reason": null
}
```

- **Đề xuất — chờ duyệt:** MVP chỉ full refund; amount của case bằng toàn bộ amount đã paid.
- **Đề xuất — chờ duyệt:** `reason` bắt buộc tại case creation; external reference bắt buộc khi attempt thành công; failure reason bắt buộc khi attempt thất bại.
- Paid order được hủy sẽ ghi refund case `refund_pending`; không tự khẳng định đã hoàn tiền. Việc tự động mở case khi cancel và trạng thái order/case chi tiết vẫn theo API/schema approval.
- **Đã chốt:** mỗi order có đúng một refund case; các lần xử lý refund là attempts append-only; retry sau failed tạo attempt mới và không ghi đè lịch sử.
- Refund state tách với order state: case `refund_pending → refund_failed` hoặc `refunded`; attempt state được suy từ events bất biến (`started`, `succeeded`, `failed`). Endpoint ghi kết quả chỉ append event; không UPDATE/DELETE attempt hoặc event đã có.
- **Đề xuất — chờ duyệt:** `refund_cases.order_id` unique; attempt sequence duy nhất trong case; chỉ một attempt success tối đa cho case. Mỗi lần xử lý tạo attempt/event mới; kết quả được append thành event, không update attempt/event cũ. Khóa case/order khi tạo attempt và ghi result; success chỉ ghi sau xác nhận thành công bên ngoài.
- Refund thất bại không restock; coupon quota của order đã paid tiếp tục được giữ.
- **Đã chốt:** restock atomically đúng một lần, chỉ khi refund thành công. Cùng transaction append success event, cập nhật case/payment `refunded`, tạo reversals cho allocations, lot balances và ledger movements. `UNIQUE(allocation_id)` trên reversal chống lặp; request duplicate không thể restock lần nữa.
- Order hủy unpaid: hoàn tồn theo allocation và release coupon quota atomically cùng cancellation/history; reversal unique cũng chống hoàn lần hai.

**Đề xuất — chờ duyệt:** retry sau failed tạo attempt và idempotency key mới; case duy nhất không thể tạo lại cho cùng order. Nếu attempt hiện hành đang `pending` hoặc đã `succeeded`, yêu cầu retry trả `409 CONFLICT`.

### 7.5. Guest order lookup

| Method / path | Quyền | Request |
|---|---|---|
| `POST /api/v1/guest/order-lookups` | Guest | `{ "order_code": "SM-YYMMDD-NNNN", "phone": "+84..." }` |

- **Đã duyệt:** Guest lookup không trả PII; mismatch trả lỗi trung tính; baseline rate-limit là 5 lần/15 phút theo IP hash và cooldown 15 phút.
- **Đề xuất — chờ duyệt theo OPEN-008:** malformed request không tính lượt; rolling-window semantics, request thứ sáu bắt đầu cooldown, mismatch tính lượt, `Retry-After`, trusted proxy allowlist, cách tạo IP HMAC/hash và fail-closed khi rate-limit store lỗi.
- **Đề xuất field-level — chờ duyệt:** response gồm order ID, ngày, trạng thái, items và totals; không trả người nhận, phone, địa chỉ, payment status/history hoặc dữ liệu fulfillment nhạy cảm. Danh sách field phải được sign-off theo DEC-030/permissions matrix trước khi thành API guarantee.

## 8. Inventory và roast batch tối thiểu

### 8.1. Inventory endpoints

| Method / path | Quyền | Request/hành vi |
|---|---|---|
| `GET /api/v1/admin/inventory/lots` | Staff/Admin theo permission | Filter `product_id`, `variant_id`, `batch_id`, `low_stock`; paginated. |
| `POST /api/v1/admin/inventory/lots` | Admin | Tạo lot; `Idempotency-Key` bắt buộc. |
| `POST /api/v1/admin/inventory/adjustments` | Staff/Admin | `lot_id`, `quantity_delta`, `reason`; `Idempotency-Key` bắt buộc; audit, không để stock âm. |

**Đề xuất request tạo lot:**

```json
{
  "variant_id": "variant-id",
  "batch_id": "batch-id-or-null",
  "quantity": 20,
  "reason": "Nhập tồn ban đầu"
}
```

`batch_id: null` biểu diễn unbatched pool; schema dùng `pool_kind` có constraint để bảo đảm đây là pool riêng, không nhập chung với batch inventory. Product được suy ra từ variant và phải khớp batch nếu có. Đơn vị quantity là số sản phẩm bán được, không phải gram.

- Allocation tham chiếu lot nguồn; order line có thể dùng nhiều lot. Ledger movements ghi mọi decrement, adjustment và reversal.
- **Đã chốt:** mỗi allocation có tối đa một reversal qua `UNIQUE(allocation_id)`; refund success mới được restock atomically đúng một lần. Không có endpoint restock trực tiếp.

### 8.2. Batch endpoints

| Method / path | Quyền | Request/hành vi |
|---|---|---|
| `GET /api/v1/admin/products/{productId}/batches` | Ngoài MVP — roadmap | Batch listing/filter. |
| `POST /api/v1/admin/products/{productId}/batches` | Ngoài MVP — roadmap | Tạo batch. |
| `PATCH /api/v1/admin/batches/{batchId}` | Ngoài MVP — roadmap | Sửa metadata/date. |

- MVP chỉ cần dữ liệu batch tối thiểu phục vụ product detail/freshness theo FR-CT-06; không bao gồm workflow quản trị batch đầy đủ.
- Không suy tồn từ `produced_qty_g`; dữ liệu batch cần theo inventory model được duyệt.
- Batch status enum, endpoint quản trị và edit/archive policy thuộc roadmap hoặc cần scope approval riêng.

### 8.3. FIFO và allocation

- Allocation dùng FIFO theo roast date cũ nhất trước trong batch lots.
- Ưu tiên batch lots trước unbatched pool; unbatched stock là pool riêng.
- Một order line có thể được phân bổ qua nhiều lots/pools.
- **Đề xuất — chờ duyệt:** tie-break khi roast date trùng: batch `created_at` tăng dần, tiếp theo batch ID; trong cùng batch, lot `created_at` tăng dần, tiếp theo lot ID.
- Product detail freshness vẫn chọn batch mới nhất còn stock theo variant khách chọn.
- **Đã chốt:** allocation ghi nhận chính xác lot nguồn; inventory ledger append-only ghi các decrement/adjustment/reversal; `UNIQUE(allocation_id)` trên reversal bảo đảm một allocation chỉ được hoàn đúng một lần.
- Restock do cancellation/refund được thực hiện nội bộ trong transaction, không có API endpoint restock trực tiếp.

## 9. Admin, contact và dashboard

### 9.1. Admin listings và mutations

| Resource/path | Quyền | Filters/sort đề xuất |
|---|---|---|
| `GET /api/v1/admin/products` | Staff đọc; Admin đọc/quản lý | `status`, `category_id`, `origin_id`, `q`; `updated_at_desc`, `name_asc`, `name_desc`, `price_asc`, `price_desc`. |
| `POST /api/v1/admin/products` | Admin | Tạo product. |
| `PATCH /api/v1/admin/products/{productId}` | Admin | Sửa non-price; product có order chỉ hide/archive. |
| `POST /api/v1/admin/products/{productId}/variants` | Admin | Tạo variant; giá integer VND. |
| `PATCH /api/v1/admin/products/{productId}/variants/{variantId}` | Admin | Sửa variant/giá có audit. |
| `POST /api/v1/admin/products/{productId}/images` | Admin | Upload theo MIME, extension và size allowlist; tên file random. |
| `GET /api/v1/admin/categories` | Admin | Listing `parent_id`, `active`; sort name. |
| `POST /api/v1/admin/categories` | Admin | Tạo category. |
| `PATCH /api/v1/admin/categories/{categoryId}` | Admin | Sửa/ẩn, không hard delete. |
| `GET /api/v1/admin/origins` | Admin | Listing `active`; sort name. |
| `POST /api/v1/admin/origins` | Admin | Tạo origin. |
| `PATCH /api/v1/admin/origins/{originId}` | Admin | Sửa/ẩn, không hard delete. |
| `GET /api/v1/admin/grind-options` | Admin | Listing `active`; sort name. |
| `POST /api/v1/admin/grind-options` | Admin | Tạo grind option. |
| `PATCH /api/v1/admin/grind-options/{grindId}` | Admin | Sửa/ẩn, không hard delete. |
| `GET /api/v1/admin/users` | Admin | Filter `role`, `status`, `q`; sort `created_at_desc`, `email_asc`; PII giới hạn. |
| `PATCH /api/v1/admin/users/{userId}` | Admin | Chỉ thay đổi field/role được duyệt; audit. |
| `GET /api/v1/admin/dashboard` | Admin; Staff theo operational scope | Metrics từ dữ liệu thật; Subscription trả `not_implemented`. |
| `POST /api/v1/contact-messages` | Public | Contact form `FR-CN-04`; server validation và rate-limit theo implementation contract. |

Các tên status/filter còn thiếu enum trong SPEC/schema phải được lấy từ schema được duyệt, không tự tạo tại implementation.

### 9.2. System configuration

| Method / path | Quyền | Hành vi |
|---|---|---|
| `GET /api/v1/admin/system-config` | Admin | Trả cấu hình được phép quản lý; không trả secrets. |
| `PATCH /api/v1/admin/system-config` | Admin | Chỉ nhận allowlisted fields; validate tất cả trước khi cập nhật atomically. |
| `GET /api/v1/checkout/config` | Public | Chỉ trả whitelist §11. |

Đổi config cần audit actor/time/changed fields; không ghi credential hoặc QR source nhạy cảm vào log.

## 10. View states và route errors

| Trạng thái | API/UI behavior |
|---|---|
| Loading | Skeleton/spinner; chặn double-submit. |
| Success | Render `data`; totals lấy từ server. |
| Empty | `200`, `data: []`, empty state rõ ràng. |
| Validation | `422` với field errors; cho sửa input. |
| Unauthenticated | `401`; chuyển sang login/session-expired state. |
| Forbidden | `403`; không trả protected data. |
| Not found | `404`; Guest lookup dùng message trung tính. |
| Conflict | `409`; giữ nguyên cart/order khi mutation bị reject. |
| Rate limited | `429` cùng `Retry-After`. |
| Lookup unavailable | Fail closed, không thực hiện lookup. |
| Server error | `500` cùng `request_id`; không lộ stack trace/secrets. |
| Offline/network | Không có JSON envelope; retry mutation bằng cùng idempotency key. |
| Subscription | Hiển thị “Chưa triển khai”; không có dữ liệu giả. |
| HTML route không tồn tại | Trang 404 có đường quay lại theo `FR-CN-07`. |
| HTML exception | Trang 500 thân thiện; không lộ stack/config. |

## 11. Checkout config public whitelist

`GET /api/v1/checkout/config` chỉ trả các field đã duyệt cho checkout:

```json
{
  "data": {
    "shipping_fee_vnd": 30000,
    "free_shipping_threshold_vnd": 500000,
    "workshop": {
      "name": "…",
      "address": "…",
      "business_hours": "…"
    },
    "bank_transfer": {
      "bank_name": "…",
      "account_holder": "…",
      "account_number": "…",
      "qr_static_url": "…"
    }
  }
}
```

Không trả các setting khác, secrets, credentials, auth configuration hoặc internal fields. Full bank name/account holder/account number và static QR URL/image nằm trong whitelist đã duyệt cho checkout. Source/storage validation của QR vẫn phải được làm rõ khi triển khai `FR-AD-12`.

## 12. Test mapping và test còn thiếu

| API behavior | Test Plan hiện có |
|---|---|
| Account/auth/address/CSRF | `TC-AUTH-01–05`, `TC-SEC-03–05` |
| Catalog/product/freshness | `TC-CAT-01–02`, `TC-PRODUCT-01`, `TC-FRESH-01–04` |
| Search semantics | `TC-SEARCH-01–04` after applicable OPEN-007 approvals; benchmark remains not run until profile/fixture/CI gate sign-off. |
| Cart/coupon/merge | `TC-CART-01–06`, `TC-PRICE-01–03` |
| Checkout/order/stock/idempotency | `TC-ORDER-01–10`, `TC-DB-03` |
| Cancel/refund/reversal/quota | `TC-ORDER-04`, `TC-REFUND-01–03`, `TC-INV-01`; acceptance chạy sau P1 schema/API/permission sign-off. |
| Guest lookup | `TC-LOOKUP-01–05`, `TC-PII-01`; verify that every returned field follows the signed-off allowlist and contains no PII; OPEN-008 mechanics after approval. |
| Admin permissions/config | `TC-ADMIN-01–05`, `TC-SEC-01–02`, `TC-CONFIG-01–03` |
| Error pages/view states | `TC-ERROR-01–02`, `TC-NFR-06` |
| Search benchmark p95 | Chưa có test trong TEST_PLAN; cần thêm CI benchmark profile, fixture và report output. |

Đây là mapping/đề xuất bổ sung, không khẳng định test đã được viết hoặc chạy.

## 13. Đối chiếu và mâu thuẫn cần reconcile

1. **Coupon allowlist:** schema proposal ghi allowlist rỗng là không giới hạn category theo quyết định đã chốt; matching khi product thuộc nhiều category và discount snapshot allocation còn chờ review.
2. **Coupon quota:** schema proposal đã đồng bộ DEC-024: chỉ release khi hủy trước `paid`; order đã `paid` giữ quota kể cả refund. Locking/concurrency implementation còn chờ review.
3. **Guest HMAC:** schema proposal có digest/key version nhưng chưa mô tả dual-read và điều kiện kết thúc rotation; draft theo quyết định mới.
4. **Batch/inventory:** schema proposal đã được cập nhật theo DEC-031 với `pool_kind` constraint, allocation theo lot, ledger và unique reversal; constraint/transaction implementation vẫn chờ schema approval cuối.
5. **Refund lifecycle:** schema proposal ghi nhận DEC-029: một case/order, attempts/events append-only và retry không ghi đè lịch sử. API chỉ append result event; case/payment/restock được mô tả đồng bộ atomically khi success. Physical constraints, idempotency persistence, xác nhận success và approval schema cuối vẫn còn mở.
6. **Idempotency:** schema proposal xem idempotency record là optional; các thao tác order/lot/adjustment/payment/refund trong quyết định mới yêu cầu idempotency. Cần schema review cho persistence/retention.
7. **Permissions:** permissions matrix đã ghi nguyên tắc PII được duyệt tại DEC-030 và field-level matrix theo nhãn đề xuất; field-level matrix chưa được duyệt toàn bộ.
8. **PRD auth/profile:** PRD có “ghi nhớ đăng nhập” và avatar ở FR-AU-02/04; quyết định API mới không có `remember_me` hoặc avatar upload. Draft chỉ có session và profile text/phone.
9. **Sort/filter sản phẩm:** PRD/SPEC liệt kê best-selling/rating; reviews/rating ngoài MVP. Draft đề xuất định nghĩa best-selling từ completed orders 30 ngày, nhưng bỏ `rating_desc` cho tới khi review thuộc scope.
10. **Enum và lengths:** `roast_level`, `product_type`, một số status và address limits chưa được xác định đồng nhất. Draft giữ enum là TBD và gắn nhãn mọi length limit là đề xuất.

## 14. Các điểm còn đề xuất/chờ duyệt

| Chủ đề | Đề xuất mặc định — chờ duyệt | Ghi chú |
|---|---|---|
| Refund attempt constraints/routes | Mỗi case có sequence attempts append-only; kết quả được ghi thành append-only events; tối đa một success attempt; create/retry/result dùng routes và idempotency riêng. | Nguyên tắc một case/order, retry không ghi đè, restock thành công một lần đã được duyệt; physical constraints/API status details chờ approval cuối. |
| PII field-level | Ma trận chi tiết tại §3; serializers riêng theo role và authorize trước khi serialize. | Đã duyệt: Staff chỉ xem đầy đủ address/phone tại order detail khi cần giao hàng; Guest lookup không trả PII. Các field khác trong ma trận chưa được duyệt toàn bộ. |
| Inventory schema | `pool_kind` constraint; allocation theo lot; append-only ledger; `UNIQUE(allocation_id)` reversal. | Các hướng này đã được duyệt; schema/transaction cụ thể vẫn chờ approval cuối cùng. |
| Kỹ thuật khác | Idempotency canonicalization, validation lengths, sort/filter, benchmark fixture và tie-break FIFO như các mục đã đánh dấu. | Không tự thành quyết định đã duyệt; enum chưa có căn cứ vẫn TBD. |

Các đề xuất kỹ thuật khác được gắn nhãn **“Đề xuất — chờ duyệt”** tại nơi áp dụng. Sign-off API contract không thay thế approval cuối cùng của schema, permissions, TECH_STACK hoặc gate P1.
