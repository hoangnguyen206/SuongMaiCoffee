# Đặc tả chuẩn — Sương Mai Coffee Roasters

**Trạng thái:** Canonical specification sau P0 — chờ P1 thiết kế/approval.  
**Phiên bản:** 1.1  
**Nguồn gốc bất biến:** [SƯƠNG MAI COFFEE ROASTERS_ ĐẶC TẢ DỰ ÁN WEBSITE.md](source/SƯƠNG%20MAI%20COFFEE%20ROASTERS_%20%C4%90%E1%BA%B6C%20T%E1%BA%A2%20D%E1%BB%B0%20%C3%81N%20WEBSITE.md)  
**Tài liệu dẫn xuất:** [PRD.md](PRD.md)  
**Kế hoạch và gate:** [PLAN.md](PLAN.md)  
**Nguồn tiến độ duy nhất:** [PROGRESS.md](PROGRESS.md)

> Tài liệu này là đặc tả chuẩn cho thiết kế và triển khai. File nguồn trong `docs/source/` được giữ nguyên, không bị đổi tên, di chuyển hoặc sửa. Mọi thay đổi yêu cầu sau P0 phải được phê duyệt, ghi nhận trong decision log khi file đó được tạo, và đồng bộ với PRD/kế hoạch nếu ảnh hưởng phạm vi.
>
> `SPEC.md` không phải migration, schema triển khai, API contract hay view contract. Các contract đó chỉ được tạo/chốt tại P1 và phải được duyệt trước khi có code nghiệp vụ.

---

## 1. Quy ước nguồn, ưu tiên và phạm vi

### 1.1. Quy ước nhãn

- **[Gốc]**: nội dung giữ từ đặc tả nguồn.
- **[Đã duyệt]**: quyết định đã được chủ dự án phê duyệt để làm rõ hoặc thay thế phần nguồn mâu thuẫn.
- **[MVP]**: bắt buộc trong release MVP.
- **[Roadmap]**: được giữ làm hướng phát triển nhưng không tự trở thành điều kiện MVP.
- **[P1]**: cần proposal và phê duyệt trong P1 trước khi triển khai.

### 1.2. Thứ tự ưu tiên khi có mâu thuẫn

1. Quyết định đã được chủ dự án chốt và được phản ánh trong tài liệu này.
2. Phạm vi MVP và gate trong [PLAN.md](PLAN.md).
3. Yêu cầu/ID gốc trong đặc tả nguồn.
4. Đề xuất chưa duyệt không tạo thành yêu cầu hoặc hành vi triển khai.

Các chuẩn hóa quan trọng so với nguồn gốc:

- PostgreSQL là DBMS duy nhất; không hỗ trợ đồng thời MySQL/MariaDB. **[Đã duyệt]**
- MVP gồm M0–M6 cùng `FR-CT-05`, `FR-OR-05`, `FR-CN-07`, `FR-AD-12` và dữ liệu roast-batch tối thiểu cho `FR-CT-06`. **[Đã duyệt]**
- Quiz, Brew Lab, subscription, wholesale, blog, review, wishlist, newsletter, online payment và loyalty không tự thuộc MVP. **[Đã duyệt]**
- Freshness không dùng nhãn “Còn tốt” đến ngày +45; ngày rang +30 chỉ là mốc thưởng thức ngon nhất, không phải tuyên bố an toàn thực phẩm. **[Đã duyệt]**
- Các chi tiết database, API, view, quyền Staff/Admin, rate limit và xóa/cascade còn mở chỉ được chốt tại P1. **[Đã duyệt]**

### 1.3. Mục tiêu và ranh giới sản phẩm

Sương Mai Coffee Roasters là website thương mại điện tử phục vụ bán cà phê đặc sản và sản phẩm liên quan. Luồng MVP cần cho phép khách xem sản phẩm, thêm giỏ, checkout bằng COD/chuyển khoản, theo dõi hoặc tra cứu đơn, và cho Admin/Staff xử lý nghiệp vụ đã được phân quyền. **[Gốc + Đã duyệt]**

Mục tiêu thành công chính:

1. Hoàn tất checkout ba bước: thông tin giao hàng → vận chuyển & thanh toán → xác nhận.
2. Hoàn thiện chuỗi xem sản phẩm → giỏ → đặt hàng → theo dõi đơn → quản trị xử lý đơn.
3. Đạt M0–M6 và các chức năng S đã chọn cho MVP.
4. Không vỡ ở viewport 375px và 1440px; trang chủ mục tiêu tải trong không quá 3 giây trên localhost với asset được tối ưu.
5. Dựng lại được hệ thống từ cơ chế schema/seed đã duyệt trên máy mới trong dưới 10 phút.

Không thuộc phạm vi sản phẩm: ứng dụng mobile native, tích hợp vận chuyển thật, thanh toán thật, kế toán, nhân sự, đa chi nhánh, và thanh toán định kỳ tự động bằng thẻ. **[Gốc]**

Mọi nội dung thương hiệu, địa chỉ, sản phẩm, ảnh và số liệu trong đặc tả là giả định phục vụ học tập. Không seed hoặc trình bày nội dung chưa được duyệt như dữ liệu thương hiệu chính thức. **[Gốc + Đã duyệt]**

### 1.4. Vai trò hệ thống

| Vai trò | Phạm vi hiện tại |
|---|---|
| Guest | Xem catalog, dùng giỏ session, checkout guest, tra cứu đơn bằng dữ liệu hợp lệ. |
| Customer | Quyền Guest, tài khoản, hồ sơ, địa chỉ, lịch sử và chi tiết đơn. |
| Wholesale | Vai trò được giữ cho roadmap; luồng yêu cầu/báo giá chưa thuộc MVP. |
| Staff | Nghiệp vụ hằng ngày theo ma trận quyền P1; không tự có quyền quản trị nhạy cảm. |
| Admin | Quản trị hệ thống; thay đổi role, cấu hình, chính sách giá/coupon/điểm và dữ liệu quan trọng chỉ theo contract được duyệt. |

Backend phải kiểm tra session, role và quyền cho mọi endpoint/thao tác bảo vệ. Ẩn nút ở giao diện không phải là cơ chế phân quyền. **[Đã duyệt]**

---

## 2. Phạm vi release

### 2.1. MVP bắt buộc

| Nhóm | Phạm vi MVP |
|---|---|
| M0 | Khung dự án, front controller, router, PDO PostgreSQL, layout/token, cơ chế schema/seed được phê duyệt. |
| M1 | Header/footer, home, Câu chuyện, Liên hệ, FAQ, Chính sách, form liên hệ. |
| M2 | Đăng ký/đăng nhập/đăng xuất, account, address book, CSRF, role, guest-cart merge. |
| M3 | Category/catalog/filter/sort, product detail, variants, grind options, flavor information, latest available roast batch, autocomplete search. |
| M4 | AJAX cart/mini-cart, stock check, một coupon/cart, guest session cart và persisted customer cart. |
| M5 | Checkout ba bước, COD/bank transfer, pricing, order transaction, order history/status/cancel, guest order lookup. |
| M6 | Dashboard dùng dữ liệu thật, catalog/order/inventory/user/coupon management, system configuration. |
| S được chọn | `FR-CT-05`, `FR-OR-05`, `FR-CN-07`, `FR-AD-12`. |

### 2.2. Roadmap, không tự triển khai trong MVP

| Nhóm | Chức năng giữ lại |
|---|---|
| M7 | Quiz và Flavor Radar đầy đủ (`FR-QZ-01`–`FR-QZ-06`). |
| M8 | Roast batch management đầy đủ, public batch page và QR (`FR-BT-01`–`FR-BT-04`), ngoại trừ dữ liệu tối thiểu cho product detail MVP. |
| M9 | Brew Lab (`FR-BL-01`–`FR-BL-05`). |
| M10 | Blog, review, wishlist, newsletter (`FR-CN-03`, `FR-CN-06`, `FR-RV-*`, `FR-CT-08`). |
| M11 | Subscription (`FR-SU-01`–`FR-SU-05`). |
| M12 | Wholesale workflow (`FR-WS-01`–`FR-WS-05`). |
| M13 | Animation nâng cao, SEO mở rộng, online payment mô phỏng/VNPay và loyalty nếu được duyệt riêng. |

Dashboard MVP phải hiển thị widget Subscription ở trạng thái **“Chưa triển khai”** hoặc empty state tương đương. Không tạo subscription seed hoặc số liệu giả để làm widget có vẻ đã hoạt động. **[Đã duyệt]**

---

## 3. Yêu cầu chức năng

Các ID dưới đây giữ nguyên ID nguồn. “Phạm vi” là baseline canonical hiện hành.

### 3.1. Tài khoản và xác thực — AU

| ID | Phạm vi | Yêu cầu |
|---|---|---|
| FR-AU-01 | MVP | Đăng ký với họ tên, email, SĐT và mật khẩu tối thiểu 8 ký tự, có chữ và số; không cho email trùng. |
| FR-AU-02 | MVP | Đăng nhập, đăng xuất và ghi nhớ đăng nhập theo session/auth contract được duyệt. |
| FR-AU-03 | Roadmap | Quên mật khẩu qua email, token hết hạn sau 30 phút; hành vi dev chỉ khi được chốt riêng. |
| FR-AU-04 | MVP | Sửa hồ sơ, SĐT, avatar và đổi mật khẩu. |
| FR-AU-05 | MVP | Thêm/sửa/xóa địa chỉ và đặt địa chỉ mặc định. |
| FR-AU-06 | Roadmap | Đăng ký tài khoản doanh nghiệp/Wholesale và chờ Admin duyệt. |
| FR-AU-07 | MVP | Phân quyền Guest/Customer/Wholesale/Staff/Admin ở UI và backend. |
| FR-AU-08 | MVP | Gộp giỏ Guest vào giỏ tài khoản khi đăng nhập theo khóa `(variant_id, grind_option_id)`. |

### 3.2. Catalog và tìm kiếm — CT

| ID | Phạm vi | Yêu cầu |
|---|---|---|
| FR-CT-01 | MVP | Danh mục cà phê hạt/bột, túi lọc, dụng cụ và quà tặng/combo. |
| FR-CT-02 | MVP | Listing dạng lưới, phân trang hoặc tải thêm theo contract P1. |
| FR-CT-03 | MVP | Lọc mức rang, vùng trồng, tag hương vị, khoảng giá, loại sản phẩm và trạng thái còn hàng. |
| FR-CT-04 | MVP | Sắp xếp mới nhất, giá tăng/giảm, bán chạy, đánh giá cao khi dữ liệu tương ứng tồn tại. |
| FR-CT-05 | MVP | Autocomplete theo tên, vùng và hương vị; giới hạn/chuẩn hóa/độ trễ chốt tại P1. |
| FR-CT-06 | MVP | Product detail có thư viện ảnh, variant, kiểu xay, mô tả, nguồn gốc, thông số, Flavor Radar/điểm vị và thông tin lô rang mới nhất tối thiểu. Review không được giả lập khi `FR-RV-*` chưa thuộc MVP. |
| FR-CT-07 | Roadmap | Nhãn Mới, Giảm giá, Hết hàng, Bán chạy. |
| FR-CT-08 | Roadmap | Wishlist. |
| FR-CT-09 | Roadmap | Recently viewed qua cookie/local storage. |
| FR-CT-10 | Roadmap | Liên kết “Pha thế nào?” sang Brew Lab. |

### 3.3. Giỏ hàng — CA

| ID | Phạm vi | Yêu cầu |
|---|---|---|
| FR-CA-01 | MVP | Thêm hàng AJAX và mở mini-cart không reload trang. |
| FR-CA-02 | MVP | Sửa số lượng, xóa dòng, đổi kiểu xay trong giỏ. |
| FR-CA-03 | MVP | Cùng variant, khác kiểu xay là hai dòng riêng. |
| FR-CA-04 | MVP | Kiểm tra tồn khi thêm/sửa và báo lỗi rõ ràng. |
| FR-CA-05 | Roadmap | Thanh tiến độ đến ngưỡng freeship. |
| FR-CA-06 | MVP | Áp coupon và hiển thị số tiền giảm. |
| FR-CA-07 | MVP | Guest cart theo session; Customer cart được lưu bền vững. |

### 3.4. Checkout và đặt hàng — CO

| ID | Phạm vi | Yêu cầu |
|---|---|---|
| FR-CO-01 | MVP | Checkout ba bước trên một trang: giao hàng → vận chuyển/thanh toán → xác nhận. |
| FR-CO-02 | MVP | Guest nhập thông tin; Customer chọn địa chỉ có sẵn. |
| FR-CO-03 | MVP | COD và chuyển khoản hiển thị QR/hướng dẫn theo mã đơn; online payment là roadmap. |
| FR-CO-04 | MVP | Tính tiền đúng BR-03 đến BR-06 theo phạm vi module được bật. |
| FR-CO-05 | Roadmap | Ghi chú quà tặng/lời nhắn thiệp. |
| FR-CO-06 | MVP | Trang xác nhận đơn thành công; email là roadmap. |
| FR-CO-07 | MVP | Tạo đơn, ghi item, trừ tồn, status history và payment record trong một transaction. |
| FR-CO-08 | Roadmap | Thanh toán online lại khi thất bại. |

### 3.5. Đơn hàng phía khách — OR

| ID | Phạm vi | Yêu cầu |
|---|---|---|
| FR-OR-01 | MVP | Lịch sử đơn và lọc theo trạng thái. |
| FR-OR-02 | MVP | Chi tiết đơn và timeline từ `order_status_history`. |
| FR-OR-03 | MVP | Hủy đơn ở `pending`/`confirmed`, hoàn tồn đúng một lần. |
| FR-OR-04 | Roadmap | Reorder. |
| FR-OR-05 | MVP | Guest tra cứu bằng mã đơn và SĐT; chống dò/rate limit chốt tại P1. |
| FR-OR-06 | Roadmap | Review từ đơn hoàn tất. |

### 3.6. Subscription, Wholesale, Quiz, Brew Lab và roadmap khác

- `FR-SU-01` đến `FR-SU-05`: **Roadmap**. Nếu được triển khai sau MVP: subscription giảm 10%, chu kỳ 1/2/4 tuần, có pause/skip/cancel và Admin chủ động sinh đơn; không charge định kỳ tự động bằng thẻ.
- `FR-WS-01` đến `FR-WS-05`: **Roadmap**. Không dùng wholesale để bỏ qua quantity limit của retail cart MVP.
- `FR-QZ-01` đến `FR-QZ-06`: **Roadmap**. Product profile/Flavor Radar được phép dùng điểm vị product trong `FR-CT-06`, nhưng không biến full Quiz/persistence thành MVP.
- `FR-BL-01` đến `FR-BL-05`: **Roadmap**. Không thêm route, persistence hoặc UI giả lập trong MVP.

### 3.7. Roast batch — BT

| ID | Phạm vi | Yêu cầu |
|---|---|---|
| FR-BT-01 | MVP tối thiểu | Product detail chọn được batch mới nhất còn hàng và hiển thị ngày rang/mốc thưởng thức theo BR-11. |
| FR-BT-02 | Roadmap | Trang công khai batch trace. |
| FR-BT-03 | Roadmap | Admin tạo/sửa batch, lựa chọn batch khi order chuyển sang roasting. |
| FR-BT-04 | Roadmap | QR cho batch. |

Dữ liệu batch tối thiểu không được suy ra tồn kho từ `produced_qty_g`. Quan hệ batch–variant–inventory cần proposal rõ và phê duyệt P1 trước implementation.

### 3.8. Nội dung — CN

| ID | Phạm vi | Yêu cầu |
|---|---|---|
| FR-CN-01 | MVP | Trang chủ theo định hướng thiết kế đã nêu. |
| FR-CN-02 | MVP | Câu chuyện, vùng nguyên liệu và timeline Thu hái → Sơ chế → Rang → Đóng gói. |
| FR-CN-03 | Roadmap | Blog. |
| FR-CN-04 | MVP | Liên hệ, bản đồ/thông tin xưởng và form lưu dữ liệu. |
| FR-CN-05 | MVP | FAQ, chính sách giao hàng/đổi trả/bảo mật. |
| FR-CN-06 | Roadmap | Newsletter. |
| FR-CN-07 | MVP | Trang 404/500 có đường dẫn quay lại. |

### 3.9. Review, wishlist và loyalty — RV

`FR-RV-01` đến `FR-RV-04` là **Roadmap**. BR-06 vẫn là quy tắc canonical nếu loyalty được phê duyệt về sau, nhưng không yêu cầu tạo loyalty tables, balance hay checkout redemption trong MVP hiện tại.

### 3.10. Quản trị — AD

| ID | Phạm vi | Yêu cầu |
|---|---|---|
| FR-AD-01 | MVP | Dashboard doanh thu, đơn theo trạng thái, top product, biểu đồ 30 ngày, cảnh báo tồn thấp; Subscription widget ghi “Chưa triển khai”. |
| FR-AD-02 | MVP | Quản lý product, image, variant, giá, tồn, tag, điểm vị và trạng thái hiển thị. |
| FR-AD-03 | MVP | Quản lý category, origin và grind option. |
| FR-AD-04 | MVP | Lọc/xem order, đổi trạng thái hợp lệ, internal note và print delivery note. |
| FR-AD-05 | MVP | Xem tồn, nhập tồn và low-stock threshold mặc định 10. |
| FR-AD-06 | Roadmap | Batch management đầy đủ. |
| FR-AD-07 | Roadmap | Subscription/Wholesale management. |
| FR-AD-08 | MVP | User management; Admin duy nhất đổi role/duyệt Wholesale. |
| FR-AD-09 | MVP | Coupon management. |
| FR-AD-10 | Roadmap | Banner, blog, review, contact, newsletter management. |
| FR-AD-11 | Roadmap | Quiz/Brew Lab management. |
| FR-AD-12 | MVP | Cấu hình shipping fee, free-shipping threshold, thông tin xưởng và ngân hàng/QR. |
| FR-AD-13 | Roadmap | Báo cáo mở rộng và CSV export. |

---

## 4. Quy tắc nghiệp vụ

### BR-01 — Giá biến thể

Mỗi sản phẩm cà phê có thể có variant 250g, 500g, 1kg. Giá 500g = giá 250g × 1,9; giá 1kg = giá 250g × 3,6; làm tròn đến nghìn đồng. Grind option không đổi giá. Giá tiền được lưu/tính bằng số nguyên đồng VND, không dùng số thực. **[Gốc]**

### BR-02 — Tồn kho

Tồn được kiểm soát theo variant. Không đặt vượt tồn; tồn giảm khi tạo order hợp lệ và được hoàn khi order bị hủy hợp lệ. Low-stock default là `10`. Đồng thời, tồn kho của batch không được suy ra từ `produced_qty_g`; P1 phải quyết định rõ mô hình liên kết batch, variant và inventory. **[Gốc + Đã duyệt]**

### BR-03 — Phí vận chuyển

Phí vận chuyển toàn quốc là 30.000đ; miễn phí khi merchandise subtotal đạt từ 500.000đ. Ưu đãi subscription chỉ có hiệu lực nếu subscription được triển khai sau MVP. **[Gốc + Đã duyệt]**

### BR-04 — Coupon

Mỗi order dùng tối đa một coupon. Coupon hỗ trợ `percent`, `fixed`, `free_ship`; kiểm tra hiệu lực, quota, min order và per-customer limit. Coupon mặc định cộng dồn với subscription, trừ khi coupon condition loại trừ; fixed discount không vượt eligible merchandise value. Phạm vi eligible product/category, data persistence redemption, exact customer limit và exclusion rule phải được chốt tại P1. **[Gốc + Đã duyệt]**

### BR-05 — Thứ tự tính tiền

Thứ tự bắt buộc:

1. Giá hàng.
2. Giảm subscription.
3. Giảm coupon.
4. Đổi điểm.
5. Phí vận chuyển.

Percent discount luôn làm tròn xuống đến đồng. `free_ship` chỉ ảnh hưởng bước phí vận chuyển. Mọi số tiền theo VND integer. **[Đã duyệt]**

### BR-06 — Loyalty points

Nếu module điểm được phê duyệt sau MVP: tích 1 điểm cho mỗi 10.000đ merchandise subtotal sau các khoản giảm khi order `completed`; một điểm = 100đ; redeem tối đa 20% merchandise total sau subscription/coupon, trước shipping. **[Gốc + Đã duyệt]**

### BR-07 — Vòng đời đơn

Luồng hợp lệ: `pending → confirmed → roasting → shipping → completed`.

- Chỉ được `cancelled` từ `pending` hoặc `confirmed`.
- Không nhảy cóc hoặc quay lui, ngoại trừ transition hủy hợp lệ.
- Mọi status transition tạo một record trong `order_status_history`.
- Hủy phải hoàn tồn chính xác một lần.

### BR-08 — Trạng thái thanh toán

`unpaid → paid | failed`; `refunded` khi hoàn tiền order đã trả. COD thành `paid` khi order `completed`; chuyển khoản do Staff/Admin có quyền xác nhận thủ công theo P1 permissions/API contract. **[Gốc]**

### BR-09 — Mã nghiệp vụ

Order code có định dạng `SM-YYMMDD-NNNN`, số thứ tự tăng trong ngày. Batch code và quote code chỉ áp dụng nếu module tương ứng được triển khai; batch tối thiểu MVP vẫn cần một identifier ổn định theo proposal P1. **[Gốc + Đã duyệt]**

### BR-10 — Thuật toán Quiz

Áp dụng khi Quiz được đưa vào scope:

1. User profile có 5 trục `acidity`, `body`, `sweetness`, `bitterness`, `aroma`, khởi tạo bằng 3.
2. Answer delta cập nhật các trục; mỗi trục bị clamp trong `[1, 5]`.
3. Chuẩn hóa điểm: `(score - 1) / 4`.
4. `distance = Σ(weight_i × |user_i - product_i|) / Σ(weight_i)`; mặc định các weight bằng nhau.
5. `match_percent = round(100 × (1 - distance))`.
6. Khi hòa: `match_percent` giảm dần, priority cấu hình, rồi `product_id` tăng dần.

Các điểm công thức/schema còn chưa rõ phải được trình và phê duyệt trước khi triển khai Quiz. **[Đã duyệt]**

### BR-11 — Freshness

- Chọn batch mới nhất **còn hàng** của product.
- `best_enjoyed_until = roast_date + 30 days`.
- Ngày +30 là mốc thưởng thức ngon nhất, không phải hạn an toàn hoặc hạn dùng.
- `Rất tươi` chỉ dùng khi tuổi batch ≤7 ngày; `Tươi` chỉ dùng khi ≤21 ngày.
- Sau ngày +30, hiển thị thông báo đã qua mốc thưởng thức ngon nhất.
- Không hiển thị nhãn “Còn tốt” đến ngày +45 và không đưa ra tuyên bố an toàn thực phẩm chưa được duyệt.

### BR-12 đến BR-14 — Roadmap

- **BR-12:** Subscription giảm 10%, chu kỳ 1/2/4 tuần, pause/skip/cancel khi module được phê duyệt.
- **BR-13:** Wholesale price tiers chỉ tham khảo; báo giá có hiệu lực 7 ngày.
- **BR-14:** Chỉ Customer nhận hàng mới review; một review/order item; trạng thái `pending → approved | hidden`.

### BR-15 — Cart-line identity và giới hạn số lượng

Khóa nghiệp vụ một cart line là `(variant_id, grind_option_id)`. Số lượng tối đa mỗi dòng là `20`; wholesale không sử dụng retail cart. Quy tắc merge, stock collision và frontend message phải được chốt trong API/view contract P1. **[Gốc + Đã duyệt]**

### BR-16 — Snapshot và xóa

Product đã từng có order chỉ được ẩn khỏi catalog, không xóa cứng. Order item phải giữ snapshot tên product, label variant, grind label và giá tại thời điểm đặt. Chính sách xóa mềm/cứng cho các entity còn lại, cùng `ON DELETE`/`ON UPDATE`, phải được chốt cụ thể tại P1. **[Gốc + Đã duyệt]**

---

## 5. Yêu cầu phi chức năng

| ID | Yêu cầu canonical |
|---|---|
| NFR-01 | Frontend dùng HTML5/CSS3/ES6+; backend PHP MVC; persistence PostgreSQL thông qua PDO hoặc abstraction tương thích PostgreSQL. PHP minor version/framework được chốt P1. |
| NFR-02 | Dùng `password_hash()`, prepared statements, output escaping, CSRF cho mọi write form/AJAX, backend authorization và session ID regeneration khi login. |
| NFR-03 | Giới hạn login thất bại 5 lần/15 phút; upload chỉ JPG/PNG/WebP, kiểm tra MIME/kích thước và random filename; production không lộ lỗi/config; config ở ngoài public document root. |
| NFR-04 | WebP: hero ≤300KB, product ≤120KB; lazy-load, bundle/minify phù hợp lúc release; home ≤3 giây trên localhost. |
| NFR-05 | Mobile-first; breakpoints 480/768/1024/1280px; không overflow tại 375px/1440px; mini-cart fullscreen trên mobile. |
| NFR-06 | Form label, tiếng Việt rõ ràng, contrast chữ ≥4.5:1, keyboard navigation, alt text chính xác. |
| NFR-07 | Friendly URL, page title/meta description, product Open Graph và sitemap cơ bản. |
| NFR-08 | Hỗ trợ bản mới của Chrome, Edge, Firefox, Safari và iOS/Android. |
| NFR-09 | UI tiếng Việt; VND theo `185.000đ`; ngày `DD/MM/YYYY`; timezone `Asia/Ho_Chi_Minh`. |
| NFR-10 | Dùng design token, container tối đa 1200px và tôn trọng `prefers-reduced-motion`. |
| NFR-11 | Dựng lại hệ thống trên máy mới từ cơ chế schema/seed đã được phê duyệt trong dưới 10 phút. |
| NFR-12 | Chỉ PostgreSQL; không viết migration/schema tương thích đồng thời MySQL/MariaDB. |
| NFR-13 | Quyền được enforce ở backend theo ma trận thao tác; không dựa vào hidden/disabled UI. |

---

## 6. Hướng dẫn UI/UX chuẩn

### 6.1. Định hướng

Phong cách: ấm áp, thủ công, sang trọng tối giản, cảm giác sương sớm Đà Lạt. Tránh màu công nghệ sặc sỡ, icon cartoon và bố cục template mặc định. **[Gốc]**

### 6.2. Design tokens

| Token | Giá trị | Vai trò |
|---|---|---|
| `--espresso` | `#2B1B14` | Chữ chính, header/footer tối, CTA chính. |
| `--roast` | `#4A2E22` | Nền nhấn mạnh, hover CTA. |
| `--crema` | `#F5EDE0` | Nền trang. |
| `--mist` | `#E8E2D6` | Border/nền phụ. |
| `--moss` | `#6B7F5E` | Accent/trạng thái tích cực. |
| `--caramel` | `#C17F3E` | CTA nổi bật, star, sale. |
| `--paper` | `#FFFDF8` | Card/form. |
| `--danger` | `#B3412F` | Error/hết hàng. |
| `--success` | `#4C7A4F` | Thành công. |

Typography: Playfair Display cho heading và Be Vietnam Pro cho body/label, kèm fallback hỗ trợ tiếng Việt. Spacing scale `4/8/16/24/32/48/80px`; max container 1200px; card radius 14px; pill button 999px. **[Gốc]**

### 6.3. Component và hành vi cần nhất quán

Header/footer, product card, mini-cart, option pills, toast, accordion, tabs, breadcrumbs, pagination, skeleton loading và form states phải dùng design tokens và đáp ứng accessibility. Freshness badge chỉ biểu đạt chính xác BR-11. Flavor Radar dùng dữ liệu điểm vị và không làm phát sinh Quiz MVP. **[Gốc + Đã duyệt]**

Animation chỉ làm ở mức vừa phải và phải tôn trọng `prefers-reduced-motion`. Không tạo screen/CTA dẫn đến feature roadmap nếu chưa có route được phê duyệt; tránh dead link. **[Gốc + Đã duyệt]**

### 6.4. Các view chính trong MVP

- Home, Câu chuyện, Liên hệ, FAQ, Chính sách, 404 và 500.
- Shop/category listing và product detail.
- Login/register/account/profile/address/order history/order detail.
- Cart, checkout ba bước, success page, guest lookup.
- Admin dashboard, catalog, order, inventory, user, coupon và configuration.

Loading, empty, validation error, auth error, permission denied, server error, pagination, freshness, cart merge, guest lookup limit và subscription-not-implemented states là contract P1 giữa backend và frontend.

---

## 7. Route và API boundary

Các public URL gốc như `/`, `/cua-hang`, `/cua-hang/{category-slug}`, `/san-pham/{slug}`, `/gio-hang`, `/thanh-toan`, `/dat-hang-thanh-cong/{order_code}`, `/tra-cuu-don`, `/dang-nhap`, `/dang-ky`, `/tai-khoan/*`, `/admin/*` được giữ như sitemap intention. Route map cuối cùng được chốt tại P1/P2.

Các endpoint JSON nguồn như cart, coupon, search suggestion, shop filter và admin order status là inventory yêu cầu, không phải API contract đã chốt. API P1 phải xác định path, method, authentication, CSRF, idempotency, request/response/error envelope, pagination/filter/sort, rate limits và acceptance tests.

Mọi write request, gồm AJAX, phải có CSRF protection và trả lỗi có thể render rõ trên frontend. **[Gốc + Đã duyệt]**

---

## 8. Dữ liệu và persistence boundary

### 8.1. Data domains MVP

P1 chỉ được thiết kế bảng cần thiết cho:

- account, role, session/auth support, profile/address;
- category, origin, product, variant, image, flavor tag, grind option;
- inventory và minimal roast batch;
- guest/customer cart;
- coupon và coupon redemption nếu phương án được duyệt;
- order, order item snapshot, payment, status history;
- contact form, system configuration và auditability cần thiết;
- thông tin phục vụ admin dashboard dùng dữ liệu thật.

### 8.2. Roadmap data domains

Không tạo trước schema cho subscription, wholesale quote, full quiz persistence, Brew Lab, blog, review, wishlist, newsletter hoặc loyalty chỉ vì chúng có trong đặc tả gốc. Các domain này chỉ vào schema khi scope tương ứng được duyệt.

### 8.3. Batch/inventory boundary

`produced_qty_g` là metadata sản xuất, không phải nguồn suy diễn tồn khả dụng. P1 phải đề xuất một quan hệ explicit để:

- xác định variant còn hàng cho cart/order;
- xác định batch mới nhất còn hàng cho freshness;
- lưu batch snapshot/assignment cho order item nếu scope cần;
- duy trì stock correctness trong order transaction và cancellation.

### 8.4. Order snapshot

Khi tạo order, lưu snapshot tối thiểu cần để order lịch sử không đổi khi product, variant, grind option, giá hoặc content hiện tại thay đổi. Các field chính xác, foreign key policy, index, check constraint, PK type và delete/update action là schema proposal P1.

---

## 9. Asset, placeholder và seed

- Asset chính thức chưa được phê duyệt phải dùng nhãn: `PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC.`
- Asset image dùng WebP khi phù hợp; hero/product size theo NFR-04.
- Không để AI tự tạo chữ/logo trên bao bì; logo/label là việc riêng khi có asset được phê duyệt.
- Seed chỉ được tạo sau P1 schema approval; không commit secret thật.
- Không seed dữ liệu subscription để làm dashboard trông như feature đã triển khai.
- Dữ liệu batch tối thiểu phải đủ kiểm thử freshness, gồm boundary “Rất tươi”, “Tươi” và qua mốc +30, nhưng không đưa tuyên bố an toàn thực phẩm.

---

## 10. Acceptance baseline

| Test | Phạm vi hiện tại | Kỳ vọng |
|---|---|---|
| T01 | MVP | Same variant ở hai grind options tạo hai cart lines riêng; subtotal đúng. |
| T02 | MVP | Cart thay đổi 480.000đ → 520.000đ cập nhật shipping 30.000đ → 0đ. |
| T03 | MVP | `WELCOME10` trên 300.000đ giảm 30.000đ; lần dùng không hợp lệ bị từ chối theo coupon condition. |
| T04 | MVP | Quantity vượt tồn bị từ chối, không tạo order. |
| T05 | MVP | COD thành công sinh mã đơn, giảm tồn, status `pending`. |
| T06 | MVP | Cancel ở `confirmed` hoàn tồn và đổi `cancelled`. |
| T07 | MVP | Không cancel được ở `shipping`. |
| T08 | MVP | Không chuyển `pending → shipping`. |
| T09 | MVP | Customer không truy cập được admin. |
| T10 | MVP | Write request thiếu CSRF token bị từ chối. |
| T11 | MVP khi contact form tồn tại | Input XSS hiển thị như text, không thực thi. |
| T12 | MVP | Input SQL-injection không vượt qua authentication/query protection. |
| T13 | Roadmap Quiz | Kết quả phù hợp BR-10. |
| T14 | MVP minimal batch | Batch 5 ngày hiển thị “Rất tươi”, mốc +30 đúng. |
| T15 | Roadmap Subscription | Skip 2-week subscription tăng `next_delivery_date` 14 ngày. |
| T16 | Roadmap Wholesale | Không chấp nhận quote hết hạn. |
| T17 | MVP | 375px không overflow; hamburger hoạt động. |
| T18 | MVP | Guest cart merge khi login không mất/nhân đôi line trái quy tắc. |

---

## 11. Ownership và gate triển khai

- **Frontend:** templates, CSS, JavaScript UI, assets và placeholders.
- **Backend:** routes, controllers, services, persistence schema/migrations và business logic.
- **Tech lead/Product-Documentation:** canonical docs, contracts dùng chung, scope/decision approval.
- Thay đổi vùng ownership chéo hoặc shared contract phải qua tech lead.
- Không để hai worktree cùng sửa shared config, route map, base layout, schema proposal hoặc contract.

Trước P1 approval, không tạo migration, schema triển khai, schema-dependent seed, business route/controller/service, order/stock/pricing logic. P1 phải chốt tối thiểu PostgreSQL major version, schema/migration design, permissions matrix, API contract, view contract và các quy tắc cần mở trước khi P2 bắt đầu.

---

## 12. Điểm cần quyết định tại P1

1. PostgreSQL major version và compatibility matrix cho local container, CI và Render managed PostgreSQL.
2. PHP version/framework hoặc custom MVC boundary, dependency, test, lint/format, asset serving và environment config.
3. Schema MVP: PK/FK/types/check/indexes, nullability, timestamps, timezone, `ON DELETE`/`ON UPDATE`, soft/hard delete policy.
4. Quan hệ roast batch–variant–inventory, latest available batch và stock reservation/decrement strategy.
5. Coupon eligibility, exclusion, customer limit, redemption record, concurrency và rounding boundary.
6. Cart merge: quantity/stock collision, error-vs-clamp behavior, final cart state và UI message.
7. API request/response/error standard, idempotency, CSRF/session behavior and acceptance mapping.
8. View-state contract for all public/account/admin/API-driven views.
9. Search normalization tiếng Việt có/không dấu, minimum query, debounce, suggestion limit và latency target.
10. Guest order lookup input, rate limit, retry, cooldown/lockout và data disclosure boundary.
11. Staff/Admin permissions per action, sensitive data access, approval, order transition and inventory operations.
12. Bank QR generation/storage and shipping/configuration validation details.

---

## 13. Changelog P0

- Tạo canonical `SPEC.md` từ đặc tả nguồn; source gốc không bị thay đổi.
- Giữ các ID FR/BR/NFR và chuẩn hóa scope theo các quyết định đã được phê duyệt.
- Không tạo schema, migration, seed, code, API contract, view contract hoặc permission matrix.
