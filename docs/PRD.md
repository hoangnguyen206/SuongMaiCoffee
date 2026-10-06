# PRD — Website Sương Mai Coffee Roasters

**Trạng thái:** Đã cập nhật theo các quyết định được duyệt trong phiên khảo sát; dùng làm cơ sở chuẩn bị thiết kế và triển khai.

**Nguồn yêu cầu:**

- Đặc tả nguồn hiện tại: `docs/source/SƯƠNG MAI COFFEE ROASTERS_ ĐẶC TẢ DỰ ÁN WEBSITE.md`.
- Nguồn chuẩn đích đã được duyệt: `docs/SPEC.md`. File đặc tả nguồn chưa bị di chuyển, đổi tên hoặc xóa trong bước này.
- Các quyết định trong tài liệu này được ưu tiên khi đặc tả nguồn còn mâu thuẫn hoặc chưa đầy đủ.

**Quy ước phân loại:**

- **[Gốc]** — yêu cầu có trong đặc tả nguồn.
- **[Đã duyệt]** — quyết định đã được người yêu cầu chốt để cụ thể hóa hoặc thay đổi cách áp dụng yêu cầu gốc.
- **[Đề xuất]** — cách triển khai hoặc diễn giải cần được xem xét ở bước thiết kế; không tự biến thành yêu cầu sản phẩm mới.

---

## 1. Mục tiêu và chỉ số thành công

### 1.1. Mục tiêu sản phẩm

1. Xây dựng website thương mại điện tử cho Sương Mai Coffee Roasters, phục vụ bán cà phê đặc sản và các sản phẩm liên quan. **[Gốc — §1.1, §1.4]**
2. Cho phép khách hoàn tất checkout trong ba bước trên một trang: thông tin giao hàng → vận chuyển và thanh toán → xác nhận. **[Gốc — FR-CO-01; Đã duyệt — mục tiêu “5 bước” chỉ tính riêng checkout]**
3. Hỗ trợ cùng một hệ thống cho đơn bán lẻ, đơn Guest, tra cứu đơn, quản trị đơn hàng và các chức năng S được chọn trong MVP. **[Gốc — §1.3; Đã duyệt — §3.1]**
4. Truyền tải các giá trị tươi, minh bạch nguồn gốc và gần gũi với nông hộ thông qua thông tin sản phẩm, lô rang và nội dung thương hiệu. **[Gốc — §1.1, U3, FR-BT]**
5. Cung cấp nền tảng có thể mở rộng sau MVP cho Quiz, subscription, wholesale, Brew Lab, blog, đánh giá và tích điểm. **[Gốc — §1.7, §12.2; Đề xuất — các module ngoài MVP không được triển khai ngầm]**

### 1.2. Chỉ số thành công và tiêu chí đo

| Mục tiêu | Chỉ số/tiêu chí | Nguồn |
|---|---|---|
| Checkout hoạt động | Khách có thể đi hết ba bước checkout và tạo đơn hợp lệ bằng COD hoặc chuyển khoản. | [Gốc] FR-CO-01–07 |
| Bán hàng đầu-cuối | Luồng xem sản phẩm → giỏ → thanh toán → theo dõi đơn → Admin xử lý đơn hoạt động. | [Gốc] §1.3 |
| MVP đạt phạm vi | M0–M6 và các S được chọn trong §3.1 được triển khai và nghiệm thu. | [Đã duyệt] |
| Tính đúng nghiệp vụ | T01–T12, T17–T18 đạt; T13–T16 chỉ áp dụng nếu tính năng tương ứng được đưa vào release. | [Gốc] §13.1; [Đề xuất] phạm vi áp dụng |
| Responsive | Không tràn ngang và menu hamburger hoạt động ở 375px; giao diện đạt yêu cầu ở 1440px. | [Gốc] T17, §13.2 |
| Bảo mật cơ bản | Không vượt quyền Admin, CSRF bị từ chối, nội dung thử XSS không thực thi, truy vấn thử SQL injection không vượt kiểm tra. | [Gốc] T09–T12 |
| Hiệu năng | Trang chủ tải trong ≤ 3 giây trên localhost; ảnh được nén theo giới hạn. | [Gốc] §4 |
| Tái dựng | Có thể dựng hệ thống từ schema và seed trên máy mới trong dưới 10 phút. | [Gốc] §13.2 |

**Không đặt mục tiêu:** ứng dụng di động, vận chuyển thật, thanh toán thật, kế toán, quản lý nhân sự, đa chi nhánh và thanh toán định kỳ tự động bằng thẻ. **[Gốc — §1.4]**

---

## 2. Đối tượng và vai trò

| Vai trò | Mô tả và quyền chính | Nguồn |
|---|---|---|
| Guest | Xem sản phẩm, làm Quiz, dùng Brew Lab, dùng giỏ, đặt hàng không cần tài khoản và tra cứu đơn bằng mã đơn + số điện thoại. | [Gốc] §1.5 |
| Customer | Toàn bộ quyền Guest, cùng tài khoản, lịch sử đơn, yêu thích, đánh giá, subscription và tích điểm khi các module tương ứng được bật. | [Gốc] §1.5 |
| Wholesale | Khách hàng doanh nghiệp/quán đã được Admin duyệt; có quyền gửi yêu cầu, xem và chấp nhận báo giá sỉ. | [Gốc] §1.5, FR-WS |
| Staff | Xử lý đơn, cập nhật kho, trả lời liên hệ và duyệt đánh giá trong phạm vi quyền được cấp. | [Gốc] §1.5 |
| Admin | Toàn quyền quản trị hệ thống, gồm người dùng, cấu hình, mã giảm giá, chính sách giá/điểm và báo cáo. | [Gốc] §1.5; [Đã duyệt] |

### 2.1. Nguyên tắc phân quyền đã duyệt

- Mọi quyền phải được kiểm tra ở backend; việc ẩn nút trên giao diện không được xem là cơ chế bảo vệ. **[Đã duyệt]**
- Chỉ Admin được đổi vai trò, thay đổi cấu hình, chính sách giá, coupon, điểm và xử lý dữ liệu quan trọng. **[Đã duyệt]**
- Staff chỉ thực hiện nghiệp vụ thường ngày trong phạm vi được cấp, tối thiểu gồm xem/cập nhật đơn và quản lý tồn kho được giao. **[Đã duyệt]**
- Backend phải có ma trận quyền theo từng màn hình và thao tác xem/tạo/sửa/xóa/duyệt trước khi triển khai Admin. **[Đã duyệt — quy trình]**
- Không tự suy diễn thêm quyền hoặc cho phép thao tác xóa/cascade dữ liệu quan trọng khi chưa có quyết định trong đề xuất schema. **[Đã duyệt]**

---

## 3. Phạm vi sản phẩm

### 3.1. MVP bắt buộc

MVP gồm toàn bộ M0–M6 và các chức năng S được chọn rõ dưới đây. **[Đã duyệt]**

#### M0 — Khung dự án và nền tảng dữ liệu

- Front controller, router, `.htaccess`, kết nối PDO/PostgreSQL, layout chung và design tokens.
- `schema.sql` và `seed.sql`/cơ chế seed phù hợp PostgreSQL.
- Cấu trúc MVC, phân lớp Core/Controllers/Models/Services/Views.
- Có thể mở trang layout rỗng và import dữ liệu mẫu thành công.

Nguồn: [Gốc] §7.1–7.3, §12.2; hệ quản trị PostgreSQL: [Đã duyệt].

#### M1 — Nội dung nền tảng

- Header/footer, trang chủ.
- Trang Câu chuyện, Liên hệ, FAQ và Chính sách.
- Form liên hệ lưu CSDL.

Nguồn: [Gốc] §5.5, FR-CN-01–05, §12.2.

#### M2 — Tài khoản và xác thực

- Đăng ký, đăng nhập, đăng xuất.
- Phân quyền Guest/Customer/Wholesale/Staff/Admin.
- Hồ sơ và sổ địa chỉ.
- CSRF cho form và AJAX ghi dữ liệu.
- Gộp giỏ Guest vào giỏ tài khoản khi đăng nhập.

Nguồn: [Gốc] FR-AU-01, FR-AU-02, FR-AU-04, FR-AU-05, FR-AU-07, FR-AU-08, §12.2.

#### M3 — Cửa hàng và sản phẩm

- Danh mục sản phẩm.
- Lưới sản phẩm, lọc, sắp xếp.
- Gợi ý tìm kiếm autocomplete theo tên, vùng và hương vị: FR-CT-05 được chọn bổ sung vào MVP.
- Trang chi tiết gồm thư viện ảnh, biến thể, kiểu xay, mô tả, nguồn gốc, thông số, Flavor Radar, thông tin lô rang mới nhất tối thiểu và sản phẩm liên quan.
- Dữ liệu/lô rang tối thiểu đủ để đáp ứng FR-CT-06; chưa đưa toàn bộ module quản lý lô rang nâng cao vào MVP.

Nguồn: [Gốc] FR-CT-01–06; [Đã duyệt] FR-CT-05 và dữ liệu lô rang tối thiểu.

#### M4 — Giỏ hàng

- Thêm/sửa/xóa qua AJAX và mini-cart.
- Phân biệt dòng theo `(variant_id, grind_option_id)`.
- Kiểm tra tồn kho khi thêm/sửa.
- Áp tối đa một coupon.
- Giỏ Guest theo session; giỏ Customer trong CSDL.

Nguồn: [Gốc] FR-CA-01–07, BR-02, BR-04, BR-15.

#### M5 — Checkout và đơn hàng

- Checkout ba bước trên một trang.
- Guest checkout và Customer checkout với địa chỉ đã lưu.
- COD và chuyển khoản; chuyển khoản hiển thị QR và nội dung theo mã đơn.
- Tính tiền theo BR-03–BR-06 đã được chốt.
- Tạo đơn trong một transaction, trừ kho, ghi snapshot dòng đơn, lịch sử trạng thái và payment.
- Trang thành công, lịch sử đơn, timeline trạng thái và hủy đơn hợp lệ.
- Tra cứu đơn Guest bằng mã đơn + SĐT: FR-OR-05 được chọn bổ sung vào MVP.

Nguồn: [Gốc] FR-CO-01–07, FR-OR-01–03, §9.1–9.3; [Đã duyệt] FR-OR-05.

#### M6 — Quản trị lõi

- Dashboard doanh thu, đơn theo trạng thái, top sản phẩm, biểu đồ 30 ngày và cảnh báo tồn thấp.
- Widget subscription trong dashboard hiển thị trạng thái **“Chưa triển khai”**, không tạo dữ liệu giả và không yêu cầu triển khai Subscription. **[Đã duyệt]**
- CRUD sản phẩm, biến thể, ảnh, danh mục, vùng trồng và kiểu xay.
- Quản lý đơn, chuyển trạng thái hợp lệ, ghi chú, in phiếu giao hàng.
- Quản lý tồn kho.
- Quản lý người dùng, duyệt khách sỉ và đổi vai trò theo ma trận quyền.
- Quản lý coupon.
- Cấu hình hệ thống: phí ship, ngưỡng miễn phí, thông tin xưởng và tài khoản ngân hàng/QR: FR-AD-12 được chọn bổ sung vào MVP.

Nguồn: [Gốc] FR-AD-01–05, FR-AD-08–09, §12.2; [Đã duyệt] trạng thái widget và FR-AD-12.

#### Chức năng S được chọn bổ sung vào MVP

| ID | Chức năng | Phạm vi MVP |
|---|---|---|
| FR-CT-05 | Gợi ý tìm kiếm | Có |
| FR-OR-05 | Tra cứu đơn Guest bằng mã đơn + SĐT | Có |
| FR-CN-07 | Trang 404 và 500 đẹp, có đường dẫn quay lại | Có |
| FR-AD-12 | Cấu hình hệ thống | Có |
| Dữ liệu/lô rang tối thiểu cho FR-CT-06 | Hiển thị thông tin lô rang mới nhất trong chi tiết sản phẩm | Có ở mức tối thiểu |

Các chức năng S/C khác không tự động trở thành bắt buộc. **[Đã duyệt]**

### 3.2. Ngoài MVP mặc định

Các module sau được giữ trong roadmap, nhưng không được xem là điều kiện nghiệm thu MVP nếu chưa có quyết định riêng:

- M7 — Quiz + Flavor Radar đầy đủ: FR-QZ-01–06.
- M8 — Quản lý lô rang đầy đủ, trang truy xuất và QR: FR-BT-01–04, ngoại trừ dữ liệu tối thiểu phục vụ FR-CT-06.
- M9 — Brew Lab: FR-BL-01–05.
- M10 — Blog, đánh giá, yêu thích và bản tin: FR-CN-03, FR-CN-06, FR-RV-01–03, FR-CT-08, FR-AD-10.
- M11 — Subscription: FR-SU-01–05.
- M12 — Wholesale end-to-end: FR-WS-01–05 và phần mở rộng Wholesale.
- M13 — Animation nâng cao, splash, tối ưu ảnh, kiểm thử toàn bộ, thanh toán online mô phỏng và tích điểm nếu còn thời gian.

Nguồn milestone: [Gốc] §12.2; phạm vi áp dụng: [Đã duyệt].

### 3.3. Ngoài phạm vi sản phẩm

- Ứng dụng mobile.
- Tích hợp vận chuyển thật GHN/GHTK.
- Thanh toán thật.
- Kế toán, nhân sự và đa chi nhánh.
- Thanh toán định kỳ tự động bằng thẻ.

Nguồn: [Gốc] §1.4.

---

## 4. User journey

### 4.1. Mua hàng và checkout — MVP

1. Guest hoặc Customer mở `/cua-hang` hoặc một danh mục.
2. Người dùng lọc/sắp xếp/tìm kiếm, mở `/san-pham/{slug}`.
3. Chọn biến thể, kiểu xay và số lượng; thêm vào giỏ bằng AJAX.
4. Mini-cart hiển thị dòng hàng, số lượng, tạm tính và tiến độ miễn phí vận chuyển nếu chức năng được bật.
5. Tại `/gio-hang`, người dùng sửa/xóa dòng và áp tối đa một coupon.
6. Tại `/thanh-toan`, người dùng đi qua ba bước trên cùng một trang:
   - Thông tin giao hàng.
   - Vận chuyển và thanh toán.
   - Xác nhận.
7. Hệ thống kiểm tra tồn, coupon, quyền dùng điểm nếu module điểm được bật, sau đó tạo đơn trong transaction.
8. Hệ thống trừ kho, ghi snapshot sản phẩm, payment và lịch sử trạng thái `pending`.
9. Trang thành công hiển thị mã đơn; nếu chuyển khoản thì hiển thị hướng dẫn và QR.
10. Người dùng theo dõi đơn ở tài khoản hoặc dùng `/tra-cuu-don` với mã đơn + SĐT.

Nguồn: [Gốc] FR-CA, FR-CO, FR-OR, §9.2; số bước checkout: [Đã duyệt].

### 4.2. Gộp giỏ khi đăng nhập — MVP

1. Guest có giỏ trong session.
2. Guest đăng nhập hoặc đăng ký.
3. Hệ thống chuyển/gộp dòng vào giỏ tài khoản theo khóa `(variant_id, grind_option_id)`.
4. Không mất hàng và không nhân đôi ngoài quy tắc gộp số lượng; phải kiểm tra tồn và giới hạn tối đa mỗi dòng.

Nguồn: [Gốc] FR-AU-08, BR-15, T18.

### 4.3. Xử lý đơn — MVP

1. Staff/Admin mở đơn `pending`.
2. Người có quyền xác nhận sang `confirmed`.
3. Chỉ chuyển tiếp tuần tự sang `roasting`, `shipping`, `completed`.
4. Mỗi lần đổi trạng thái ghi `order_status_history`.
5. Có thể hủy từ `pending` hoặc `confirmed`; khi hủy thì hoàn tồn.
6. Không cho hủy từ `shipping` và không cho nhảy cóc/quay lui.

Nguồn: [Gốc] BR-02, BR-07, §9.1–9.3, T05–T08.

### 4.4. Tra cứu đơn Guest — MVP

1. Guest mở `/tra-cuu-don`.
2. Nhập mã đơn và số điện thoại.
3. Hệ thống kiểm tra cặp thông tin và chỉ trả về đơn phù hợp.
4. Hiển thị trạng thái, timeline và thông tin cần thiết; không làm lộ dữ liệu đơn của người khác.

Nguồn: [Gốc] FR-OR-05; [Đã duyệt] đưa vào MVP.

### 4.5. Các journey roadmap

- **Quiz:** trả lời 5 câu → chuẩn hóa hồ sơ 5 trục → tính match% → hiển thị 3 sản phẩm → xem chi tiết/thêm giỏ. [Gốc] §9.4; công thức [Đã duyệt] tại §6.10.
- **Subscription:** tạo gói → quản lý trạng thái → đến hạn → Admin chủ động tạo đơn → cập nhật kỳ giao tiếp theo. [Gốc] §9.5.
- **Wholesale:** gửi yêu cầu → Admin lập báo giá → khách chấp nhận/từ chối → chấp nhận sinh đơn. [Gốc] §9.6.
- **Brew Lab:** chọn phương pháp → xem công thức → tính tỷ lệ → dùng timer → xem sản phẩm gợi ý. [Gốc] FR-BL-01–05.

---

## 5. Yêu cầu chức năng

Các ID FR và mức ưu tiên M/S/C dưới đây giữ nguyên thuật ngữ của đặc tả nguồn. Cột “Phạm vi” là quyết định phạm vi MVP, không thay đổi ưu tiên gốc.

### 5.1. Tài khoản và xác thực — AU

| ID | Ưu tiên | Phạm vi | Yêu cầu |
|---|---:|---|---|
| FR-AU-01 | M | MVP | Đăng ký bằng họ tên, email, SĐT và mật khẩu ≥ 8 ký tự, có chữ và số; kiểm tra email trùng. |
| FR-AU-02 | M | MVP | Đăng nhập, đăng xuất và ghi nhớ đăng nhập. |
| FR-AU-03 | S | Ngoài MVP | Quên mật khẩu qua email, token hết hạn sau 30 phút; dev mode có thể hiển thị liên kết đặt lại nếu không có SMTP. |
| FR-AU-04 | M | MVP | Sửa hồ sơ, SĐT, ảnh đại diện và đổi mật khẩu. |
| FR-AU-05 | M | MVP | Thêm/sửa/xóa địa chỉ và đặt địa chỉ mặc định. |
| FR-AU-06 | S | Ngoài MVP | Đăng ký tài khoản doanh nghiệp với tên công ty, mã số thuế và chờ Admin duyệt. |
| FR-AU-07 | M | MVP | Phân quyền Guest/Customer/Wholesale/Staff/Admin ở giao diện và máy chủ. |
| FR-AU-08 | M | MVP | Gộp giỏ Guest vào giỏ tài khoản khi đăng nhập. |

Nguồn: [Gốc] §2.1. Phạm vi: [Đã duyệt].

### 5.2. Danh mục và tìm kiếm — CT

| ID | Ưu tiên | Phạm vi | Yêu cầu |
|---|---:|---|---|
| FR-CT-01 | M | MVP | Danh mục cà phê hạt/bột, túi lọc, dụng cụ, quà tặng/combo. |
| FR-CT-02 | M | MVP | Cửa hàng dạng lưới, phân trang hoặc tải thêm bằng AJAX. |
| FR-CT-03 | M | MVP | Lọc theo mức rang, vùng trồng, tag hương vị, khoảng giá, loại sản phẩm và còn hàng. |
| FR-CT-04 | M | MVP | Sắp xếp mới nhất, giá tăng/giảm, bán chạy và đánh giá cao. |
| FR-CT-05 | S | MVP | Autocomplete theo tên, vùng và hương vị. |
| FR-CT-06 | M | MVP | Chi tiết sản phẩm có ảnh, biến thể, kiểu xay, mô tả, nguồn gốc, thông số, Flavor Radar, lô rang mới nhất tối thiểu, đánh giá và sản phẩm liên quan. |
| FR-CT-07 | S | Ngoài MVP | Nhãn Mới, Giảm giá, Hết hàng, Bán chạy. |
| FR-CT-08 | S | Ngoài MVP | Wishlist. |
| FR-CT-09 | C | Ngoài MVP | Sản phẩm đã xem gần đây bằng cookie/localStorage. |
| FR-CT-10 | S | Ngoài MVP | Nút “Pha thế nào?” liên kết Brew Lab. |

Nguồn: [Gốc] §2.2. FR-CT-05 và dữ liệu lô rang tối thiểu: [Đã duyệt].

### 5.3. Giỏ hàng — CA

| ID | Ưu tiên | Phạm vi | Yêu cầu |
|---|---:|---|---|
| FR-CA-01 | M | MVP | Thêm AJAX và mở mini-cart không tải lại trang. |
| FR-CA-02 | M | MVP | Sửa số lượng, xóa dòng và đổi kiểu xay. |
| FR-CA-03 | M | MVP | Cùng biến thể nhưng khác kiểu xay là hai dòng riêng. |
| FR-CA-04 | M | MVP | Kiểm tra tồn khi thêm/sửa và báo lỗi rõ ràng. |
| FR-CA-05 | S | Ngoài MVP/không bắt buộc | Thanh tiến độ đến ngưỡng freeship. |
| FR-CA-06 | M | MVP | Áp coupon và hiển thị số tiền giảm. |
| FR-CA-07 | M | MVP | Guest dùng session; Customer dùng CSDL. |

Nguồn: [Gốc] §2.3.

### 5.4. Checkout và đặt hàng — CO

| ID | Ưu tiên | Phạm vi | Yêu cầu |
|---|---:|---|---|
| FR-CO-01 | M | MVP | Checkout ba bước trên một trang. |
| FR-CO-02 | M | MVP | Guest nhập thông tin; Customer chọn địa chỉ có sẵn. |
| FR-CO-03 | M cho COD/bank; S cho online | MVP COD/bank | COD và chuyển khoản QR là bắt buộc; online mô phỏng/VNPay sandbox chưa thuộc MVP. |
| FR-CO-04 | M | MVP | Tính tiền đúng BR-03–BR-06 đã chốt. |
| FR-CO-05 | S | Ngoài MVP | Ghi chú và tùy chọn quà tặng/lời nhắn thiệp. |
| FR-CO-06 | M trang thành công; S email | MVP trang thành công | Email chỉ là S; trang thành công là M. |
| FR-CO-07 | M | MVP | Tạo đơn và trừ tồn trong transaction. |
| FR-CO-08 | S | Ngoài MVP | Thanh toán online lại khi thất bại. |

Nguồn: [Gốc] §2.4; phương thức MVP: [Đã duyệt theo phạm vi M0–M6].

### 5.5. Đơn hàng phía khách — OR

| ID | Ưu tiên | Phạm vi | Yêu cầu |
|---|---:|---|---|
| FR-OR-01 | M | MVP | Lịch sử đơn và lọc trạng thái. |
| FR-OR-02 | M | MVP | Chi tiết đơn với timeline từ `order_status_history`. |
| FR-OR-03 | M | MVP | Hủy ở `pending`/`confirmed`, hoàn tồn. |
| FR-OR-04 | S | Ngoài MVP | Reorder. |
| FR-OR-05 | S | MVP | Guest tra cứu bằng mã đơn + SĐT. |
| FR-OR-06 | S | Ngoài MVP | Đánh giá từ đơn hoàn tất. |

Nguồn: [Gốc] §2.4b; FR-OR-05: [Đã duyệt].

### 5.6. Nội dung — CN

| ID | Ưu tiên | Phạm vi | Yêu cầu |
|---|---:|---|---|
| FR-CN-01 | M | MVP | Trang chủ theo bố cục đặc tả. |
| FR-CN-02 | M | MVP | Câu chuyện, vùng nguyên liệu và timeline Thu hái → Sơ chế → Rang → Đóng gói. |
| FR-CN-03 | S | Ngoài MVP | Blog và bài chi tiết. |
| FR-CN-04 | M | MVP | Liên hệ lưu CSDL, bản đồ và thông tin xưởng. |
| FR-CN-05 | M | MVP | FAQ và chính sách giao hàng/đổi trả/bảo mật. |
| FR-CN-06 | S | Ngoài MVP | Bản tin. |
| FR-CN-07 | S | MVP | Trang 404/500 có đường dẫn quay lại. |

Nguồn: [Gốc] §2.10; FR-CN-07: [Đã duyệt].

### 5.7. Quản trị — AD

| ID | Ưu tiên | Phạm vi | Yêu cầu |
|---|---:|---|---|
| FR-AD-01 | M | MVP, widget subscription không triển khai | Dashboard doanh thu, đơn theo trạng thái, top sản phẩm, biểu đồ 30 ngày, tồn thấp; khu vực subscription hiển thị “Chưa triển khai”, không seed dữ liệu giả. |
| FR-AD-02 | M | MVP | CRUD sản phẩm, ảnh, biến thể, giá, tồn, tag, điểm vị và trạng thái hiển thị. |
| FR-AD-03 | M | MVP | CRUD danh mục, vùng trồng và kiểu xay. |
| FR-AD-04 | M | MVP | Lọc/xem đơn, đổi trạng thái hợp lệ, ghi chú và in phiếu. |
| FR-AD-05 | M | MVP | Xem tồn, nhập tồn và cảnh báo mặc định 10. |
| FR-AD-06 | S | Ngoài MVP | Quản lý lô rang đầy đủ. |
| FR-AD-07 | S | Ngoài MVP | Quản lý subscription và wholesale. |
| FR-AD-08 | M | MVP | Quản lý người dùng; duyệt Wholesale và đổi vai trò chỉ Admin. |
| FR-AD-09 | M | MVP | Quản lý coupon. |
| FR-AD-10 | S | Ngoài MVP | Banner, blog, đánh giá, liên hệ, bản tin. |
| FR-AD-11 | C | Ngoài MVP | Quản lý Quiz/Brew Lab. |
| FR-AD-12 | S | MVP | Cấu hình phí ship, ngưỡng miễn phí, thông tin xưởng và ngân hàng/QR. |
| FR-AD-13 | S | Ngoài MVP | Báo cáo và xuất CSV. |

Nguồn: [Gốc] §2.12; trạng thái widget và FR-AD-12: [Đã duyệt].

---

## 6. Quy tắc nghiệp vụ

### 6.1. Giá, tồn kho, vận chuyển và coupon

- **BR-01 — Biến thể giá:** Mỗi sản phẩm cà phê có 250g, 500g và 1kg; 500g = giá 250g × 1,9; 1kg = giá 250g × 3,6; làm tròn đến nghìn đồng; kiểu xay không đổi giá. **[Gốc]**
- **BR-02 — Tồn kho:** Tồn theo biến thể; trừ khi tạo đơn, hoàn khi hủy; không cho đặt vượt tồn; cảnh báo khi tồn ≤ 10 mặc định. **[Gốc]**
- **BR-03 — Phí vận chuyển:** 30.000đ toàn quốc; miễn phí khi tạm tính ≥ 500.000đ; đơn subscription luôn miễn phí nếu module được triển khai. **[Gốc]**
- **BR-04 — Coupon:** Một đơn dùng tối đa một coupon; hỗ trợ `percent`, `fixed`, `free_ship`; kiểm tra hạn, lượt, đơn tối thiểu và giới hạn theo khách. **[Gốc]**
- **BR-05 — Thứ tự tính tiền đã chốt:** giá hàng → giảm subscription → coupon → điểm → phí vận chuyển. Phần trăm giảm làm tròn xuống đến đồng. Coupon fixed không vượt giá trị hàng đủ điều kiện. Coupon mặc định cộng dồn với subscription, trừ khi điều kiện coupon loại trừ. **[Đã duyệt]**
- **BR-06 — Điểm:** Nếu module điểm được triển khai, tích 1 điểm cho mỗi 10.000đ của tạm tính sau giảm khi đơn hoàn tất; 1 điểm = 100đ; dùng tối đa 20% tiền hàng sau giảm subscription/coupon và trước phí vận chuyển. **[Gốc + Đã duyệt cách tính giới hạn]**

**Phạm vi coupon cần lưu trong thiết kế:** coupon áp dụng cho sản phẩm/danh mục nào, có điều kiện loại trừ subscription hay không và giá trị hàng đủ điều kiện được tính ra sao. Nếu chưa có quyết định riêng, triển khai theo nguyên tắc coupon áp dụng toàn đơn và cộng dồn với subscription. **[Đề xuất triển khai mặc định]**

### 6.2. Trạng thái đơn và thanh toán

- **BR-07:** `pending → confirmed → roasting → shipping → completed`; chỉ hủy từ `pending` hoặc `confirmed`; không nhảy cóc/quay lui, trừ hủy; mọi chuyển trạng thái ghi `order_status_history`. **[Gốc]**
- **BR-08:** `unpaid → paid/failed`; `refunded` khi hoàn tiền đơn đã trả; COD chuyển `paid` khi hoàn tất; chuyển khoản do nhân viên xác nhận thủ công. **[Gốc]**
- **BR-09:** Mã đơn `SM-YYMMDD-NNNN`, mã lô `SM-YYMMDD-{MÃ SP}`, mã báo giá `BG-YYMM-NNN`. **[Gốc]**

### 6.3. Giỏ hàng và snapshot

- **BR-15:** Khóa dòng giỏ là `(biến thể + kiểu xay)`; số lượng tối đa mỗi dòng là 20; đơn sỉ đặt qua báo giá. **[Gốc]**
- **BR-16:** Sản phẩm đã từng có đơn chỉ được ẩn, không xóa cứng; đơn lưu snapshot tên, giá và biến thể tại thời điểm mua. **[Gốc]**

### 6.4. Quiz — BR-10 đã chốt cho roadmap

1. Hồ sơ khách là vector 5 trục `(chua, đậm, ngọt, đắng, thơm)`, mỗi trục khởi tạo bằng 3.
2. Mỗi đáp án cộng/trừ theo các cột `*_delta`.
3. Giới hạn mỗi trục trong `[1,5]`.
4. Chuẩn hóa điểm hồ sơ khách và điểm hồ sơ sản phẩm theo:

   `normalized_score = (score - 1) / 4`

5. Với trọng số `wᵢ`, tính khoảng cách:

   `D = Σ(wᵢ × |uᵢ - pᵢ|) / Σwᵢ`

   Trong đó `uᵢ` là điểm chuẩn hóa của khách, `pᵢ` là điểm chuẩn hóa của sản phẩm. Mặc định mọi trọng số bằng nhau.
6. Tính:

   `match% = round(100 × (1 - D))`

7. Sắp xếp giảm dần theo `match%`; nếu hòa điểm, sắp theo thứ tự ưu tiên đã cấu hình, sau đó `product_id` tăng dần.

Nguồn nền: [Gốc] BR-10, FR-QZ-02, §10.4. Công thức đầy đủ và quy tắc hòa: [Đã duyệt].

### 6.5. Độ tươi — BR-11 đã chốt cách hiển thị

- Lấy lô rang mới nhất còn hàng của sản phẩm.
- `ngon_nhat_den = roast_date + 30 ngày`.
- Ngày rang +30 là mốc khuyến nghị thưởng thức, không phải hạn an toàn/hạn sử dụng.
- Nhãn `Rất tươi` chỉ dùng cho ≤ 7 ngày; `Tươi` chỉ dùng cho ≤ 21 ngày.
- Bỏ nhãn `Còn tốt` cho ngày 22–45.
- Sau ngày 30 hiển thị thông báo đã qua mốc thưởng thức ngon nhất; không tuyên bố sản phẩm còn an toàn tới ngày 45 nếu chưa có căn cứ được xác nhận.

Nguồn nền: [Gốc] BR-11, FR-BT-01. Cách diễn giải và bỏ mốc 45: [Đã duyệt].

### 6.6. Subscription và wholesale roadmap

- **BR-12:** Subscription giảm 10%, chu kỳ 1/2/4 tuần; tạm dừng không sinh đơn; bỏ qua dời `next_delivery_date` thêm một chu kỳ; hủy là trạng thái cuối. Chỉ áp dụng khi module được triển khai. **[Gốc]**
- **BR-13:** Bậc giá sỉ tham khảo 5kg/20kg/50kg; báo giá hiệu lực 7 ngày; miễn phí vận chuyển từ 2.000.000đ. **[Gốc]**
- **BR-14:** Chỉ người đã nhận hàng được đánh giá; một đánh giá/dòng đơn; `pending → approved/hidden`. **[Gốc]**

---

## 7. Yêu cầu phi chức năng

Các mã NFR là mã truy vết của PRD, không phải mã gốc của đặc tả.

| ID | Yêu cầu | Nguồn |
|---|---|---|
| NFR-01 | Frontend dùng HTML5/CSS3/JavaScript ES6+; backend PHP 8.1+ theo MVC; CSDL dùng PostgreSQL; truy cập CSDL qua PDO hoặc lớp abstraction tương thích PostgreSQL. | [Gốc] §7.1–7.2; [Đã duyệt PostgreSQL] |
| NFR-02 | Hash mật khẩu bằng `password_hash()`; prepared statements; escape đầu ra bằng `htmlspecialchars`; CSRF cho mọi form POST/AJAX; kiểm tra session/vai trò phía server; `session_regenerate_id()` khi đăng nhập. | [Gốc] §4 |
| NFR-03 | Giới hạn đăng nhập sai 5 lần/15 phút; upload chỉ jpg/png/webp, kiểm tra MIME/kích thước và đổi tên file; không lộ lỗi PHP khi chạy thật; cấu hình ngoài thư mục công khai. | [Gốc] §4 |
| NFR-04 | Ảnh WebP; hero ≤ 300KB, sản phẩm ≤ 120KB; lazy-load ảnh; CSS/JS gộp và rút gọn khi nộp; trang chủ ≤ 3 giây trên localhost. | [Gốc] §4 |
| NFR-05 | Mobile-first; breakpoints 480/768/1024/1280px; không vỡ ở 375px và 1440px; mini-cart toàn màn hình trên mobile. | [Gốc] §4, §13.2 |
| NFR-06 | Nhãn form, lỗi tiếng Việt rõ ràng, tương phản màu chữ ≥ 4.5:1, keyboard navigation và alt cho ảnh. | [Gốc] §4 |
| NFR-07 | URL thân thiện, title/meta description theo trang, Open Graph cho sản phẩm/blog và sitemap.xml đơn giản. | [Gốc] §4 |
| NFR-08 | Hỗ trợ Chrome, Edge, Firefox, Safari bản mới và thiết bị iOS/Android. | [Gốc] §4 |
| NFR-09 | Giao diện tiếng Việt; tiền VNĐ dạng `185.000đ`; ngày `DD/MM/YYYY`; timezone `Asia/Ho_Chi_Minh`. | [Gốc] §4 |
| NFR-10 | Dùng design tokens, container tối đa 1200px, hệ màu/typography và component theo §5; tôn trọng `prefers-reduced-motion`. | [Gốc] §5 |
| NFR-11 | Có thể dựng lại từ schema và seed trên máy mới trong dưới 10 phút. | [Gốc] §13.2 |
| NFR-12 | Chỉ hỗ trợ PostgreSQL; không thiết kế migration hoặc schema tương thích đồng thời MySQL/MariaDB. | [Đã duyệt] |
| NFR-13 | Quyền truy cập được kiểm tra ở backend theo ma trận thao tác; các thao tác dữ liệu quan trọng không dựa vào việc ẩn UI. | [Đã duyệt] |

### 7.1. PostgreSQL là quyết định công nghệ chuẩn

- Đặc tả chuẩn chỉ dùng PostgreSQL.
- Loại bỏ MySQL/MariaDB, InnoDB và collation riêng của MySQL khỏi bản chuẩn.
- Không yêu cầu hỗ trợ đồng thời hai hệ quản trị.
- Mọi đề xuất schema/migration phải dùng cú pháp, kiểu dữ liệu, index, constraint và transaction phù hợp PostgreSQL.
- Render managed PostgreSQL là mục tiêu deploy được ưu tiên. **[Đã duyệt — lý do lựa chọn]**

---

## 8. Tiêu chí nghiệm thu và kiểm thử

### 8.1. Phạm vi test bắt buộc của MVP

Các test dưới đây là bắt buộc cho MVP: T01–T12, T17 và T18. T13–T16 chỉ bắt buộc nếu module tương ứng được đưa vào release sau khi có quyết định riêng. **[Đề xuất áp dụng theo phạm vi đã duyệt]**

| ID | Kịch bản | Kết quả mong đợi | Phạm vi |
|---|---|---|---|
| T01 | Guest thêm cùng sản phẩm ở hai kiểu xay, mở mini-cart. | Hiển thị hai dòng riêng, tạm tính đúng. | MVP |
| T02 | Đơn tăng từ 480.000đ lên 520.000đ. | Ship đổi từ 30.000đ thành 0đ theo BR-03. | MVP |
| T03 | Áp `WELCOME10` cho đơn 300.000đ. | Giảm 30.000đ; lần áp thứ hai bị từ chối nếu không phải đơn đầu. | MVP |
| T04 | Đặt số lượng vượt tồn. | Báo lỗi và không tạo đơn. | MVP |
| T05 | Đặt COD thành công. | Sinh mã `SM-YYMMDD-NNNN`; tồn giảm; đơn có trạng thái `pending`. | MVP |
| T06 | Hủy đơn ở `confirmed`. | Hoàn kho và chuyển `cancelled`. | MVP |
| T07 | Cố hủy đơn ở `shipping`. | Bị chặn. | MVP |
| T08 | Chuyển `pending → shipping`. | Bị chặn vì nhảy cóc. | MVP |
| T09 | Customer truy cập `/admin`. | Bị redirect hoặc 403. | MVP |
| T10 | Gửi form không có CSRF token. | Request bị từ chối. | MVP |
| T11 | Nhập `<script>alert(1)</script>` vào đánh giá/liên hệ. | Hiển thị như văn bản, không thực thi. | MVP khi form tương ứng tồn tại |
| T12 | Nhập `' OR 1=1 --` vào tìm kiếm/đăng nhập. | Không lỗi và không vượt truy vấn/xác thực. | MVP |
| T13 | Quiz thiên về chua thanh, hoa, không sữa. | Sản phẩm 2, 8, 1 đứng đầu theo BR-10. | Roadmap Quiz |
| T14 | Sản phẩm có lô rang 5 ngày trước. | Hiển thị “Rất tươi”; mốc ngon nhất là ngày rang +30. | MVP tối thiểu lô rang / Roadmap đầy đủ |
| T15 | Subscription chu kỳ 2 tuần, bỏ qua kỳ tới. | `next_delivery_date` tăng 14 ngày. | Roadmap Subscription |
| T16 | Chấp nhận báo giá hết hạn. | Bị từ chối. | Roadmap Wholesale |
| T17 | Mở ở viewport 375px. | Không tràn ngang; hamburger hoạt động. | MVP |
| T18 | Đăng nhập khi giỏ Guest đã có hàng. | Giỏ được gộp; không mất hoặc nhân đôi. | MVP |

Nguồn kịch bản: [Gốc] §13.1. Phân loại phạm vi: [Đã duyệt]/[Đề xuất áp dụng].

### 8.2. Tiêu chí nghiệm thu chung

1. Toàn bộ chức năng ưu tiên M trong phạm vi MVP hoạt động đúng, không có lỗi nghiêm trọng. **[Gốc]**
2. Các chức năng S được chọn trong §3.1 hoạt động đúng theo tiêu chí riêng. **[Đã duyệt]**
3. Không có đường dẫn chết trong menu và footer. **[Gốc]**
4. Không có lỗi PHP/JavaScript hiển thị trên màn hình hoặc console khi chạy các kịch bản chính. **[Gốc]**
5. Giao diện dùng design token, đồng nhất giữa các trang, không vỡ ở 375px và 1440px. **[Gốc]**
6. PostgreSQL schema/seed có thể dựng lại trên máy mới trong dưới 10 phút. **[Đã duyệt hệ quản trị; Gốc thời gian]**
7. Không có chức năng ngoài MVP được giả lập bằng dữ liệu giả để làm dashboard hoặc tiêu chí nghiệm thu trông như đã triển khai. Riêng widget subscription phải ghi rõ “Chưa triển khai”. **[Đã duyệt]**

### 8.3. Tiêu chí kiểm thử quyền

- Customer/Guest không truy cập được route Admin.
- Staff không thể đổi vai trò, cấu hình hệ thống, chính sách giá/coupon/điểm hoặc thao tác dữ liệu quan trọng nếu không có quyền Admin.
- Mọi endpoint AJAX ghi dữ liệu đều kiểm tra session, role và CSRF ở server.
- Không coi việc disable/ẩn nút ở frontend là pass kiểm thử quyền.

Nguồn: [Gốc] FR-AU-07, §4; nguyên tắc phân quyền: [Đã duyệt].

---

## 9. Dữ liệu, tích hợp và phụ thuộc

### 9.1. Cơ sở dữ liệu

- Hệ quản trị: PostgreSQL. **[Đã duyệt]**
- Cần đề xuất schema và migration chi tiết trước khi triển khai.
- Đề xuất phải nêu rõ kiểu dữ liệu, `NOT NULL`, primary key, foreign key, `UNIQUE`, index, trạng thái, lịch sử trạng thái, transaction, snapshot và hành vi `ON DELETE`/`ON UPDATE` cho từng quan hệ liên quan.
- Không tự suy diễn cascade, xóa mềm/xóa cứng hoặc hành vi cập nhật dữ liệu khi chưa được nêu trong đề xuất và duyệt.
- Các nhóm dữ liệu gốc gồm người dùng, sản phẩm, biến thể, giỏ, coupon, đơn, thanh toán, lô rang, subscription, wholesale, Quiz, Brew Lab, nội dung, đánh giá và cấu hình. **[Gốc — §8]**

### 9.2. Seed và dữ liệu demo

- Seed dữ liệu sản phẩm, danh mục, vùng trồng, biến thể, kiểu xay, coupon và các dữ liệu cần cho luồng MVP. **[Gốc — §10; phạm vi MVP — Đã duyệt]**
- Không seed subscription để làm widget trông như đã triển khai. Widget phải hiển thị “Chưa triển khai”. **[Đã duyệt]**
- Tài khoản demo và mật khẩu chỉ được đặt trong seed/dev theo cách an toàn; không commit secret thật. **[Đề xuất bảo mật]**
- Dữ liệu/lô rang tối thiểu phải đủ để sản phẩm hiển thị thông tin lô mới nhất và kiểm thử Freshness tương ứng. **[Đã duyệt]**

### 9.3. Hình ảnh và nội dung

- Dùng ảnh WebP nén, tên file có hệ thống, alt mô tả đúng nội dung và placeholder dự phòng. **[Gốc — §11]**
- Ảnh AI và thương hiệu/sản phẩm đều là giả định phục vụ học tập. **[Gốc — §11.3, phần kết tài liệu]**
- Không để AI vẽ chữ/logo trên túi sản phẩm; nhãn/logo được xử lý riêng nếu cần. **[Gốc — §11.3]**

### 9.4. Thanh toán, email và deploy

- COD và chuyển khoản QR là phương thức MVP.
- Thanh toán online/VNPay sandbox là S, chưa thuộc MVP mặc định.
- Email xác nhận và quên mật khẩu phụ thuộc SMTP/PHPMailer; nếu không có SMTP, dùng hành vi dev được đặc tả hoặc loại khỏi tiêu chí S tương ứng.
- Mục tiêu deploy là môi trường có PostgreSQL managed, đặc biệt Render. **[Đã duyệt]**

---

## 10. Giả định, rủi ro và biện pháp giảm thiểu

### 10.1. Giả định

1. Toàn bộ thương hiệu, địa chỉ, sản phẩm, số liệu và tài khoản trong đặc tả là dữ liệu giả định cho mục đích học tập. **[Gốc]**
2. MVP là M0–M6 cộng các S được liệt kê tại §3.1; S/C khác không tự động bắt buộc. **[Đã duyệt]**
3. PostgreSQL là hệ quản trị duy nhất của nguồn chuẩn và triển khai mục tiêu. **[Đã duyệt]**
4. Subscription, điểm thưởng, online payment, blog, đánh giá và wholesale không cung cấp dữ liệu giả để thay thế trạng thái chưa triển khai. **[Đã duyệt]**
5. Các chi tiết schema chưa có trong đặc tả sẽ chỉ được quyết định qua đề xuất schema/migration riêng. **[Đã duyệt]**

### 10.2. Rủi ro và giảm thiểu

| Rủi ro | Mức độ | Giảm thiểu |
|---|---|---|
| Phạm vi quá lớn, không kịp tiến độ. | Cao | Khóa MVP theo M0–M6 và S đã chọn; không tự mở rộng sang S/C khác. |
| Đặc tả nguồn còn cấu hình MySQL/MariaDB trong khi quyết định mới là PostgreSQL. | Cao | Cập nhật nguồn chuẩn `docs/SPEC.md` ở bước được duyệt; mọi schema/migration mới chỉ viết cho PostgreSQL. |
| Schema thiếu chi tiết gây sai transaction, cascade hoặc snapshot. | Cao | Backend phải trình đề xuất schema/migration chi tiết để duyệt trước khi viết triển khai. |
| Staff có quyền vượt quá nhiệm vụ. | Cao | Ma trận quyền theo thao tác; kiểm tra backend; test quyền độc lập. |
| Dùng dữ liệu giả làm sai trạng thái module. | Trung bình | Widget subscription ghi “Chưa triển khai”; seed chỉ tạo dữ liệu cho tính năng đã nằm trong phạm vi. |
| Công thức tiền không thống nhất giữa cart/checkout/order. | Cao | Đóng gói logic trong service; viết test BR-01–BR-06 và T01–T06 trước khi tích hợp UI. |
| Freshness bị hiểu như hạn an toàn. | Trung bình | Hiển thị rõ mốc +30 là mốc thưởng thức; không dùng nhãn “Còn tốt” ngày 22–45. |
| PostgreSQL deploy khác môi trường local. | Trung bình | Dùng PostgreSQL local/container cùng phiên bản tương thích với managed target; kiểm thử dựng mới từ schema/seed. |
| Ảnh AI không đồng nhất hoặc quá nặng. | Trung bình | Giữ prompt/phong cách chung, WebP, giới hạn kích thước và placeholder. |

Nguồn rủi ro gốc: [Gốc] §14; các biện pháp PostgreSQL, phân quyền, widget và Freshness: [Đã duyệt].

---

## 11. Câu hỏi còn mở

Các quyết định dưới đây chưa được chốt trong nội dung phê duyệt hiện tại và cần được xử lý trước milestone liên quan. Chúng không ngăn bắt đầu chuẩn hóa tài liệu, nhưng không được tự đoán trong code.

1. **Schema/migration PostgreSQL:** tên migration, công cụ migration, phiên bản PostgreSQL mục tiêu, kiểu khóa chính, timezone, index và chính sách `ON DELETE`/`ON UPDATE` cho từng quan hệ.
2. **Ma trận quyền đầy đủ:** Staff được thao tác cụ thể nào trên đơn, kho, nội dung, liên hệ và đánh giá; Admin có những thao tác xóa/khôi phục nào.
3. **Coupon theo phạm vi sản phẩm:** coupon áp dụng toàn đơn hay theo sản phẩm/danh mục; cách lưu và kiểm tra điều kiện loại trừ subscription.
4. **Guest tra cứu đơn:** thời gian giới hạn/chống dò mã đơn và số lần thử; đây là đề xuất bảo mật cần chốt trong thiết kế endpoint.
5. **Tìm kiếm autocomplete:** số lượng kết quả, độ trễ mục tiêu, cách chuẩn hóa tiếng Việt và phạm vi dữ liệu được tìm.
6. **Lô rang tối thiểu trong MVP:** màn hình quản trị có cho tạo/sửa lô hay chỉ seed dữ liệu; cách xác định lô “còn hàng” để chọn lô mới nhất.
7. **Flavor Radar trong FR-CT-06:** MVP hiển thị bằng SVG tự viết hay thư viện; nếu chưa triển khai Quiz, điểm sản phẩm lấy trực tiếp từ seed.
8. **Email:** có SMTP trong môi trường demo hay chỉ hiển thị trạng thái dev cho các chức năng S.
9. **Thanh toán chuyển khoản:** nhà cung cấp VietQR/ảnh QR tĩnh, cấu hình tài khoản và format nội dung chuyển khoản ngoài mã đơn.
10. **Số bước checkout:** đã chốt ba bước theo FR-CO-01; cần chốt chi tiết validation và điều hướng giữa ba bước.
11. **Nguồn chuẩn hóa:** thời điểm chuyển bản Markdown hiện tại thành `docs/SPEC.md` và nội dung nào cần cập nhật để phản ánh quyết định PostgreSQL, BR-10, tiền/coupon và Freshness.

---

## 12. Các tài liệu và đầu ra tiếp theo

### 12.1. Đã tạo trong bước này

- `docs/PRD.md` — tài liệu yêu cầu sản phẩm này.

### 12.2. Cần tạo sau khi được duyệt theo thứ tự đề xuất

1. `docs/SPEC.md` — bản đặc tả chuẩn đã cập nhật, giữ file nguồn hiện tại nguyên trạng.
2. Tài liệu quyết định hoặc changelog yêu cầu để ghi rõ các thay đổi đã duyệt so với file nguồn.
3. Ma trận phân quyền Staff/Admin theo route và thao tác.
4. Đề xuất schema/migration PostgreSQL chi tiết để duyệt.
5. Traceability matrix liên kết FR/BR → milestone → test case.
6. `database/schema.sql` hoặc bộ migration PostgreSQL sau khi schema được duyệt.
7. Seed dữ liệu MVP sau khi chốt schema.
8. Các sơ đồ báo cáo: use case, ERD, order state, checkout activity, MVC và sitemap.

### 12.3. Điều kiện bắt đầu triển khai code

Không bắt đầu code nghiệp vụ trước khi hoàn tất tối thiểu:

- `docs/SPEC.md` đã được tạo/cập nhật và là nguồn chuẩn.
- Quyết định PostgreSQL được phản ánh thống nhất trong công nghệ, schema và migration.
- Schema/migration PostgreSQL đã được duyệt.
- Ma trận quyền backend đã được duyệt.
- Phạm vi MVP tại §3.1 và test bắt buộc tại §8.1 được dùng làm baseline.

