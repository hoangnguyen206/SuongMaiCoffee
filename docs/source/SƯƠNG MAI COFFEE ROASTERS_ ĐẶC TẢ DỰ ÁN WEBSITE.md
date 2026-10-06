# **SƯƠNG MAI COFFEE ROASTERS: ĐẶC TẢ DỰ ÁN WEBSITE**

**Học phần:** Thiết kế và triển khai Website | **Đề tài 2:** Website quảng bá cho doanh nghiệp/cơ sở sản xuất **Phiên bản:** 1.0 | **Công nghệ:** HTML/CSS/JS + PHP/MySQL | **Công cụ xây dựng:** Antigravity + Gemini (ảnh)

> **Cách dùng tài liệu này.** Đây là nguồn thông tin duy nhất cho cả nhóm. Mọi mã định danh (FR-xx, BR-xx, bảng CSDL, màu, tên file) được dùng thống nhất xuyên suốt tài liệu. Khi đưa cho Antigravity, hãy đặt file này vào thư mục dự án (ví dụ docs/SPEC.md) và yêu cầu agent đọc toàn bộ trước khi viết code, sau đó làm theo từng Milestone ở Mục 12.

## **1. TỔNG QUAN DỰ ÁN**

### **1.1. Thông tin thương hiệu (toàn bộ là giả định)**

| **Hạng mục**    | **Nội dung**                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Tên thương hiệu | **Sương Mai Coffee Roasters** (viết tắt: SM)                                                                   |
| Đơn vị sở hữu   | Công ty TNHH Cà phê Sương Mai                                                                                  |
| Slogan          | *"Hương cà phê từ sương sớm Đà Lạt"*                                                                           |
| Lĩnh vực        | Rang xay và kinh doanh cà phê đặc sản (specialty coffee)                                                       |
| Mô hình         | Thu mua nông sản từ nông hộ → rang theo lô nhỏ → bán online cho khách lẻ, khách đăng ký định kỳ và quán cà phê |
| Xưởng rang      | 12 Hoàng Văn Thụ, Phường 4, Đà Lạt, Lâm Đồng                                                                   |
| Hotline / Email | 0862295832 / phukhanhkieu@gmail.com                                                                            |
| Giờ làm việc    | 7:30 – 18:00 mỗi ngày                                                                                          |
| Giá trị cốt lõi | Tươi (rang theo lô nhỏ) · Minh bạch (truy xuất nguồn gốc từng lô) · Gần gũi (đồng hành cùng nông hộ)           |

### **1.2. Lý do xây dựng website (dùng cho Chương 1 báo cáo)**

1.  > **Giảm phụ thuộc sàn thương mại điện tử.** Sàn thu phí cao, doanh nghiệp không sở hữu dữ liệu khách hàng và khó kể câu chuyện thương hiệu.

2.  > **Đặc thù sản phẩm cần website riêng.** Cà phê rang xay là hàng tươi, phụ thuộc ngày rang, mức rang và kiểu xay. Sàn không cho khách chọn kiểu xay hay xem thông tin lô rang.

3.  > **Tạo doanh thu ổn định.** Gói đăng ký định kỳ giữ chân khách, vì cà phê là hàng tiêu dùng lặp lại.

4.  > **Mở kênh bán sỉ (B2B).** Quán cà phê, văn phòng cần báo giá theo số lượng, điều mà giỏ hàng thông thường không đáp ứng.

5.  > **Xây dựng niềm tin.** Truy xuất nguồn gốc theo lô và minh bạch vùng trồng giúp phân biệt với hàng đại trà.

### **1.3. Mục tiêu**

| **Loại**    | **Mục tiêu đo lường được**                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| Kinh doanh  | Khách hoàn tất một đơn hàng trong ≤ 5 bước; có kênh nhận đơn lẻ, đơn định kỳ, đơn sỉ trên cùng một hệ thống |
| Sản phẩm    | Website chạy đủ luồng: xem sản phẩm → giỏ hàng → thanh toán → theo dõi đơn → quản trị xử lý đơn             |
| Học thuật   | Đáp ứng đủ 5 mục nội dung báo cáo (xem Mục 15) và demo ổn định, không lỗi nghiêm trọng                      |
| Trải nghiệm | Giao diện nhất quán, responsive, tải trang nhanh (ảnh WebP đã nén)                                          |

### **1.4. Phạm vi**

**Trong phạm vi:** website bán hàng đầy đủ, tài khoản, giỏ hàng, thanh toán (COD, chuyển khoản QR, cổng thanh toán mô phỏng/VNPay sandbox), quản lý đơn, gói đăng ký định kỳ, báo giá sỉ, quiz gợi ý, Brew Lab, truy xuất lô rang, blog, trang quản trị.

**Ngoài phạm vi:** ứng dụng di động, tích hợp vận chuyển thật (GHN/GHTK), thanh toán thật, kế toán, quản lý nhân sự, đa chi nhánh, thanh toán định kỳ tự động bằng thẻ.

### **1.5. Đối tượng sử dụng**

| **Vai trò**                | **Mô tả**                               | **Quyền chính**                                                                                                |
| -------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Khách vãng lai (Guest)** | Chưa đăng nhập                          | Xem sản phẩm, làm quiz, dùng Brew Lab, bỏ vào giỏ, đặt hàng không cần tài khoản, tra cứu đơn bằng mã đơn + SĐT |
| **Khách hàng (Customer)**  | Đã đăng ký                              | Toàn bộ quyền Guest + tài khoản, lịch sử đơn, yêu thích, đánh giá, gói đăng ký, tích điểm                      |
| **Khách sỉ (Wholesale)**   | Chủ quán/doanh nghiệp, được admin duyệt | Quyền Customer + gửi yêu cầu báo giá, xem và chấp nhận báo giá, đặt đơn sỉ                                     |
| **Nhân viên (Staff)**      | Nhân viên xưởng/CSKH                    | Xử lý đơn, cập nhật kho, trả lời liên hệ, duyệt đánh giá                                                       |
| **Quản trị (Admin)**       | Chủ doanh nghiệp                        | Toàn quyền, gồm quản lý người dùng, mã giảm giá, cấu hình, báo cáo                                             |

**Ba persona điển hình:**

  - > **Minh Anh, 26 tuổi, nhân viên văn phòng Hà Nội.** Thích cà phê pha phin cho buổi sáng, ngại chọn vì không biết gu mình. → Cần Quiz gợi ý và gói đăng ký.

  - > **Anh Tuấn, 35 tuổi, chủ quán cà phê nhỏ ở Đà Nẵng.** Cần 10–20 kg mỗi tháng, muốn giá sỉ ổn định. → Cần báo giá sỉ.

  - > **Chị Hạnh, 40 tuổi, mua quà biếu đối tác.** Cần hộp quà đẹp, giao đúng hẹn. → Cần mục Quà tặng, ghi chú thiệp, giao nhanh.

### **1.6. Khảo sát website tham chiếu**

| **Website**                      | **Điểm học được**                                                                                                         | **Áp dụng vào dự án**                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Nipopeto** (chăm sóc thú cưng) | Hero có 2 nút hành động; thẻ nhỏ nổi quanh hình chính; huy hiệu đối tác; menu có mục "Kiến thức", "Hỏi đáp"; nút chat nổi | Hero 2 CTA + thẻ nổi; mục Blog/FAQ; nút liên hệ nổi                                                 |
| **Luna Restaurant** (nhà hàng)   | Màn hình loading có logo; hero video; tông màu nhất quán; nhiều khoảng trắng; giờ mở cửa và liên hệ đặt sẵn ở menu        | Splash loading; hero ảnh/video chậm; design token thống nhất; thông tin xưởng rang ở footer và menu |

### **1.7. Điểm độc đáo của website (USP)**

| **\#** | **Tính năng**                           | **Mô tả ngắn**                                                                                                                                                         | **Giá trị**                                              | **Độ khả thi**          |
| ------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------- |
| U1     | **Quiz "Tìm gu cà phê của bạn"**        | 5 câu hỏi → hồ sơ vị 5 trục → gợi ý 3 sản phẩm kèm % phù hợp                                                                                                           | Giải quyết nỗi đau "không biết chọn gì"                  | Cao                     |
| U2     | **Biểu đồ vị (Flavor Radar)**           | Mỗi sản phẩm có biểu đồ radar 5 trục (chua, đậm, ngọt, đắng, thơm); trang quiz vẽ chồng hồ sơ của khách lên sản phẩm                                                   | Trực quan, nhìn là hiểu                                  | Cao (SVG hoặc Chart.js) |
| U3     | **Truy xuất lô rang (Batch Trace)**     | Mỗi sản phẩm hiển thị "Rang ngày…, ngon nhất đến…"; trang /lo-rang/SM-250915-CD kể câu chuyện lô (vùng, độ cao, hồ sơ rang, điểm cupping). Mã này in thành QR trên túi | Minh bạch, phù hợp bản chất "hàng tươi"                  | Cao                     |
| U4     | **Chọn kiểu xay khi mua**               | Mỗi dòng giỏ hàng có tuỳ chọn xay (nguyên hạt, phin, espresso…)                                                                                                        | Đúng nghiệp vụ cà phê                                    | Cao                     |
| U5     | **Brew Lab**                            | Chọn cách pha → tỷ lệ, nhiệt độ nước, độ xay, bộ đếm giờ theo từng bước; máy tính tỷ lệ pha                                                                            | Biến website thành công cụ hữu ích, tăng thời gian ở lại | Trung bình–Cao          |
| U6     | **Hộp Sương Mai (gói đăng ký)**         | Đăng ký nhận cà phê mỗi 1/2/4 tuần, giảm 10%, tạm dừng/bỏ qua kỳ/hủy                                                                                                   | Doanh thu định kỳ                                        | Trung bình              |
| U7     | **Báo giá sỉ (B2B)**                    | Yêu cầu báo giá → admin lập báo giá → khách chấp nhận → thành đơn                                                                                                      | Mở kênh bán cho quán                                     | Trung bình              |
| U8     | **Hạt tích lũy** (làm nếu dư thời gian) | Tích 1 điểm/10.000đ, đổi 1 điểm = 100đ                                                                                                                                 | Giữ chân khách                                           | Cao nhưng ưu tiên thấp  |

## **2. YÊU CẦU CHỨC NĂNG**

**Ký hiệu ưu tiên:** **M** = Must (bắt buộc), **S** = Should (nên có), **C** = Could (làm nếu dư thời gian).

### **2.1. Module Tài khoản và xác thực (AU)**

| **Mã**   | **Chức năng**                                                                                                         | **Ưu tiên** |
| -------- | --------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-AU-01 | Đăng ký bằng họ tên, email, SĐT, mật khẩu (≥ 8 ký tự, có chữ và số); kiểm tra email trùng                             | M           |
| FR-AU-02 | Đăng nhập/đăng xuất; "ghi nhớ đăng nhập"                                                                              | M           |
| FR-AU-03 | Quên mật khẩu qua email (token hết hạn sau 30 phút); nếu không có SMTP thì hiển thị liên kết đặt lại trong chế độ dev | S           |
| FR-AU-04 | Trang hồ sơ: sửa họ tên, SĐT, ảnh đại diện, đổi mật khẩu                                                              | M           |
| FR-AU-05 | Sổ địa chỉ: thêm/sửa/xóa, đặt địa chỉ mặc định                                                                        | M           |
| FR-AU-06 | Đăng ký tài khoản doanh nghiệp (khách sỉ) kèm tên công ty, mã số thuế; chờ admin duyệt                                | S           |
| FR-AU-07 | Phân quyền theo vai trò (guest, customer, wholesale, staff, admin) cho cả giao diện và máy chủ                        | M           |
| FR-AU-08 | Khi đăng nhập, gộp giỏ hàng của phiên khách vào giỏ của tài khoản                                                     | M           |

### **2.2. Module Danh mục sản phẩm và tìm kiếm (CT)**

| **Mã**   | **Chức năng**                                                                                                                                                                                                                         | **Ưu tiên** |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-CT-01 | Danh mục: Cà phê hạt/bột, Cà phê túi lọc, Dụng cụ pha chế, Quà tặng & Combo                                                                                                                                                           | M           |
| FR-CT-02 | Trang cửa hàng dạng lưới, phân trang hoặc "tải thêm" bằng AJAX                                                                                                                                                                        | M           |
| FR-CT-03 | Bộ lọc: mức rang, vùng trồng, nhóm hương vị (tag), khoảng giá, loại sản phẩm, còn hàng                                                                                                                                                | M           |
| FR-CT-04 | Sắp xếp: mới nhất, giá tăng/giảm, bán chạy, đánh giá cao                                                                                                                                                                              | M           |
| FR-CT-05 | Tìm kiếm có gợi ý (autocomplete) theo tên, vùng, hương vị                                                                                                                                                                             | S           |
| FR-CT-06 | Trang chi tiết: thư viện ảnh, giá theo biến thể, chọn khối lượng và kiểu xay, mô tả, thông tin nguồn gốc, bảng thông số (giống, sơ chế, độ cao, mức rang), Flavor Radar, **thông tin lô rang mới nhất**, đánh giá, sản phẩm liên quan | M           |
| FR-CT-07 | Hiển thị nhãn: *Mới*, *Giảm giá*, *Hết hàng*, *Bán chạy*                                                                                                                                                                              | S           |
| FR-CT-08 | Danh sách yêu thích (wishlist)                                                                                                                                                                                                        | S           |
| FR-CT-09 | Danh sách "Đã xem gần đây" lưu bằng cookie/localStorage                                                                                                                                                                               | C           |
| FR-CT-10 | Nút "Pha thế nào?" trên trang sản phẩm dẫn tới Brew Lab với phương pháp phù hợp                                                                                                                                                       | S           |

### **2.3. Module Giỏ hàng (CA)**

| **Mã**   | **Chức năng**                                                                       | **Ưu tiên** |
| -------- | ----------------------------------------------------------------------------------- | ----------- |
| FR-CA-01 | Thêm vào giỏ bằng AJAX, mở mini-cart (ngăn kéo bên phải) không tải lại trang        | M           |
| FR-CA-02 | Sửa số lượng, xóa dòng, đổi kiểu xay ngay trong giỏ                                 | M           |
| FR-CA-03 | Cùng biến thể nhưng khác kiểu xay là hai dòng riêng                                 | M           |
| FR-CA-04 | Kiểm tra tồn kho khi thêm/sửa; báo lỗi rõ ràng                                      | M           |
| FR-CA-05 | Hiển thị thanh tiến độ "Còn X đ nữa để được miễn phí vận chuyển"                    | S           |
| FR-CA-06 | Áp mã giảm giá và hiển thị số tiền giảm                                             | M           |
| FR-CA-07 | Giỏ hàng khách vãng lai lưu theo phiên (session); khách đã đăng nhập lưu trong CSDL | M           |

### **2.4. Module Thanh toán và đặt hàng (CO)**

| **Mã**   | **Chức năng**                                                                                                                          | **Ưu tiên**                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| FR-CO-01 | Checkout 3 bước trên một trang: Thông tin giao hàng → Vận chuyển & thanh toán → Xác nhận                                               | M                                 |
| FR-CO-02 | Đặt hàng không cần tài khoản (nhập họ tên, SĐT, email, địa chỉ); khách đã đăng nhập chọn địa chỉ có sẵn                                | M                                 |
| FR-CO-03 | Phương thức: **COD**, **chuyển khoản** (hiển thị mã QR + nội dung chuyển khoản = mã đơn), **thanh toán online mô phỏng/VNPay sandbox** | M (COD, chuyển khoản), S (online) |
| FR-CO-04 | Tính tiền theo BR-03 đến BR-06 (phí ship, mã giảm giá, điểm) và hiển thị chi tiết                                                      | M                                 |
| FR-CO-05 | Ghi chú đơn hàng; tuỳ chọn "Đây là quà tặng" kèm lời nhắn thiệp                                                                        | S                                 |
| FR-CO-06 | Trang xác nhận đơn thành công kèm mã đơn; gửi email xác nhận                                                                           | M (trang), S (email)              |
| FR-CO-07 | Trừ tồn kho khi tạo đơn trong một giao dịch CSDL (transaction)                                                                         | M                                 |
| FR-CO-08 | Trang thanh toán lại nếu thanh toán online thất bại                                                                                    | S                                 |

### **2.4b. Module Đơn hàng phía khách (OR)**

| **Mã**   | **Chức năng**                                                                | **Ưu tiên** |
| -------- | ---------------------------------------------------------------------------- | ----------- |
| FR-OR-01 | Lịch sử đơn hàng, lọc theo trạng thái                                        | M           |
| FR-OR-02 | Chi tiết đơn với **timeline trạng thái** (từ order\_status\_history)         | M           |
| FR-OR-03 | Hủy đơn khi ở trạng thái *Chờ xác nhận* hoặc *Đã xác nhận*; hoàn lại tồn kho | M           |
| FR-OR-04 | Mua lại (reorder): thêm toàn bộ sản phẩm của đơn cũ vào giỏ                  | S           |
| FR-OR-05 | Tra cứu đơn cho khách vãng lai bằng mã đơn + SĐT                             | S           |
| FR-OR-06 | Đánh giá sản phẩm từ đơn đã hoàn tất                                         | S           |

### **2.5. Module Gói đăng ký "Hộp Sương Mai" (SU)**

| **Mã**   | **Chức năng**                                                                                                              | **Ưu tiên** |
| -------- | -------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-SU-01 | Trang giới thiệu gói với lợi ích: giảm 10%, miễn phí vận chuyển, đổi sản phẩm tự do, tạm dừng bất cứ lúc nào               | S           |
| FR-SU-02 | Tạo gói: chọn 1–3 sản phẩm, khối lượng, kiểu xay, chu kỳ (1/2/4 tuần), địa chỉ, ngày giao đầu tiên                         | S           |
| FR-SU-03 | Quản lý gói trong tài khoản: xem lịch giao tiếp theo, đổi sản phẩm, đổi chu kỳ, **tạm dừng, tiếp tục, bỏ qua kỳ tới, hủy** | S           |
| FR-SU-04 | Admin xem danh sách gói và các gói **đến hạn** trong 7 ngày                                                                | S           |
| FR-SU-05 | Admin bấm "Tạo đơn kỳ này" để sinh đơn từ gói (nguồn đơn = subscription), tự cập nhật next\_delivery\_date                 | S           |

> **Cân đối khả thi:** không làm tự động chạy nền hay trừ tiền định kỳ. Việc sinh đơn do admin kích hoạt bằng nút hoặc script cron/generate\_subscription\_orders.php chạy thủ công khi demo.

### **2.6. Module Báo giá sỉ (WS)**

| **Mã**   | **Chức năng**                                                                                       | **Ưu tiên** |
| -------- | --------------------------------------------------------------------------------------------------- | ----------- |
| FR-WS-01 | Trang "Dành cho quán cà phê/doanh nghiệp": lợi ích, bậc giá tham khảo, form yêu cầu báo giá         | S           |
| FR-WS-02 | Form gồm: tên đơn vị, người liên hệ, SĐT, email, sản phẩm quan tâm, ước tính kg/tháng, lời nhắn     | S           |
| FR-WS-03 | Admin xem yêu cầu, **lập báo giá** (chọn biến thể, số lượng, đơn giá, hiệu lực 7 ngày, ghi chú)     | S           |
| FR-WS-04 | Khách xem báo giá trong tài khoản và **chấp nhận/từ chối**; chấp nhận sẽ sinh đơn (nguồn wholesale) | S           |
| FR-WS-05 | In báo giá ra PDF/trang in                                                                          | C           |

### **2.7. Module Quiz và Flavor Radar (QZ)**

| **Mã**   | **Chức năng**                                                                                 | **Ưu tiên** |
| -------- | --------------------------------------------------------------------------------------------- | ----------- |
| FR-QZ-01 | Quiz 5 câu, mỗi câu 3–5 đáp án có biểu tượng; thanh tiến độ; chuyển câu mượt                  | S           |
| FR-QZ-02 | Tính hồ sơ vị theo thuật toán ở BR-10                                                         | S           |
| FR-QZ-03 | Trang kết quả: radar hồ sơ khách, **3 sản phẩm phù hợp nhất kèm % phù hợp**, nút thêm vào giỏ | S           |
| FR-QZ-04 | Lưu kết quả (theo tài khoản hoặc phiên) và có nút "Làm lại"                                   | C           |
| FR-QZ-05 | Admin sửa câu hỏi/đáp án/điểm số trong trang quản trị                                         | C           |
| FR-QZ-06 | Chia sẻ kết quả bằng liên kết                                                                 | C           |

### **2.8. Module Brew Lab (BL)**

| **Mã**   | **Chức năng**                                                                                  | **Ưu tiên** |
| -------- | ---------------------------------------------------------------------------------------------- | ----------- |
| FR-BL-01 | Chọn phương pháp pha: Phin, V60/Pour-over, Espresso, French Press, Moka Pot, Cold Brew         | S           |
| FR-BL-02 | Hiển thị công thức: tỷ lệ cà phê:nước, nhiệt độ nước, độ xay, tổng thời gian                   | S           |
| FR-BL-03 | **Máy tính tỷ lệ**: nhập lượng cà phê (g) hoặc lượng nước (ml) → tự tính phần còn lại          | S           |
| FR-BL-04 | **Bộ đếm giờ theo bước** (ví dụ: ủ 30 giây → rót 1 → rót 2…), có âm báo/rung nhẹ khi sang bước | C           |
| FR-BL-05 | Gợi ý sản phẩm phù hợp với phương pháp đã chọn (liên kết sang cửa hàng đã lọc)                 | S           |

### **2.9. Module Truy xuất lô rang (BT)**

| **Mã**   | **Chức năng**                                                                                                                                              | **Ưu tiên** |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-BT-01 | Trang chi tiết sản phẩm hiển thị: *Rang ngày DD/MM/YYYY · Ngon nhất đến DD/MM/YYYY* và nhãn độ tươi (Rất tươi ≤ 7 ngày, Tươi ≤ 21 ngày, Còn tốt ≤ 45 ngày) | S           |
| FR-BT-02 | Trang công khai /lo-rang/{batch\_code}: vùng, độ cao, giống, sơ chế, hồ sơ rang, điểm cupping, ghi chú của người rang                                      | S           |
| FR-BT-03 | Admin tạo/sửa lô rang; khi chuyển đơn sang *Đang rang/đóng gói* có thể gán lô (mặc định lô mới nhất của sản phẩm)                                          | S           |
| FR-BT-04 | Admin xuất mã QR cho từng lô (dùng thư viện JS tạo QR)                                                                                                     | C           |

### **2.10. Module Nội dung (CN)**

| **Mã**   | **Chức năng**                                                                                              | **Ưu tiên** |
| -------- | ---------------------------------------------------------------------------------------------------------- | ----------- |
| FR-CN-01 | Trang chủ (cấu trúc ở Mục 6)                                                                               | M           |
| FR-CN-02 | Trang "Câu chuyện": sứ mệnh, vùng nguyên liệu, **timeline quy trình** (Thu hái → Sơ chế → Rang → Đóng gói) | M           |
| FR-CN-03 | Blog "Góc cà phê": danh sách, phân loại, tìm kiếm, bài chi tiết, bài liên quan                             | S           |
| FR-CN-04 | Liên hệ: form (lưu CSDL), bản đồ nhúng, thông tin xưởng                                                    | M           |
| FR-CN-05 | FAQ dạng accordion; Chính sách giao hàng, đổi trả, bảo mật                                                 | M           |
| FR-CN-06 | Đăng ký nhận bản tin bằng email                                                                            | S           |
| FR-CN-07 | Trang 404 và 500 đẹp, có đường dẫn quay lại                                                                | S           |

### **2.11. Module Đánh giá, yêu thích, tích điểm (RV)**

| **Mã**   | **Chức năng**                                                              | **Ưu tiên** |
| -------- | -------------------------------------------------------------------------- | ----------- |
| FR-RV-01 | Chỉ khách đã mua (đơn hoàn tất) mới được đánh giá, 1 đánh giá/sản phẩm/đơn | S           |
| FR-RV-02 | Đánh giá 1–5 sao kèm nhận xét; hiển thị điểm trung bình và phân bố sao     | S           |
| FR-RV-03 | Đánh giá cần admin/nhân viên duyệt trước khi hiển thị                      | S           |
| FR-RV-04 | Tích điểm khi đơn hoàn tất; dùng điểm ở checkout; xem lịch sử điểm         | C           |

### **2.12. Module Quản trị (AD)**

| **Mã**   | **Chức năng**                                                                                                                                                   | **Ưu tiên** |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| FR-AD-01 | **Dashboard**: doanh thu hôm nay/tuần/tháng, số đơn theo trạng thái, top sản phẩm, biểu đồ doanh thu 30 ngày (Chart.js), cảnh báo sắp hết hàng, gói sắp đến hạn | M           |
| FR-AD-02 | Quản lý sản phẩm: CRUD, upload nhiều ảnh, biến thể (khối lượng, giá, tồn kho), tag hương vị, điểm 5 trục vị, bật/tắt hiển thị                                   | M           |
| FR-AD-03 | Quản lý danh mục, vùng trồng, kiểu xay                                                                                                                          | M           |
| FR-AD-04 | Quản lý đơn: lọc theo trạng thái/ngày/mã, xem chi tiết, **đổi trạng thái hợp lệ**, ghi chú nội bộ, **in phiếu giao hàng**                                       | M           |
| FR-AD-05 | Quản lý kho: xem tồn, nhập thêm tồn, ngưỡng cảnh báo (mặc định 10)                                                                                              | M           |
| FR-AD-06 | Quản lý lô rang (FR-BT-03)                                                                                                                                      | S           |
| FR-AD-07 | Quản lý gói đăng ký, yêu cầu báo giá sỉ (FR-SU-04/05, FR-WS-03)                                                                                                 | S           |
| FR-AD-08 | Quản lý người dùng: xem, khóa/mở khóa, duyệt khách sỉ, đổi vai trò (chỉ Admin)                                                                                  | M           |
| FR-AD-09 | Quản lý mã giảm giá                                                                                                                                             | M           |
| FR-AD-10 | Quản lý banner trang chủ, bài viết blog, đánh giá, liên hệ, bản tin                                                                                             | S           |
| FR-AD-11 | Quản lý quiz và Brew Lab (FR-QZ-05, nội dung phương pháp pha)                                                                                                   | C           |
| FR-AD-12 | Cấu hình hệ thống: phí ship, ngưỡng miễn phí, thông tin xưởng, tài khoản ngân hàng/QR                                                                           | S           |
| FR-AD-13 | Báo cáo: doanh thu theo ngày/tháng, theo sản phẩm; xuất CSV                                                                                                     | S           |

## **3. QUY TẮC NGHIỆP VỤ**

| **Mã**    | **Quy tắc**                                                                                                                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BR-01** | **Biến thể giá.** Mỗi sản phẩm cà phê có 3 biến thể: 250g, 500g, 1kg. Quy ước giá: 500g = giá 250g × 1,9; 1kg = giá 250g × 3,6 (làm tròn đến nghìn đồng). Kiểu xay không làm đổi giá.                                                     |
| **BR-02** | **Tồn kho.** Tồn kho tính theo biến thể. Trừ khi tạo đơn, hoàn lại khi hủy. Không cho đặt vượt tồn. Cảnh báo khi tồn ≤ ngưỡng (mặc định 10).                                                                                              |
| **BR-03** | **Phí vận chuyển.** Đồng giá 30.000đ toàn quốc; **miễn phí khi tạm tính ≥ 500.000đ**; đơn gói đăng ký luôn miễn phí.                                                                                                                      |
| **BR-04** | **Mã giảm giá.** Một đơn dùng tối đa 1 mã. Loại: percent (có trần giảm tối đa), fixed, free\_ship. Kiểm tra: còn hạn, còn lượt, đạt giá trị tối thiểu, giới hạn lượt/khách.                                                               |
| **BR-05** | **Thứ tự tính tiền.** Tạm tính = Σ(đơn giá × SL) → trừ mã giảm → trừ điểm (nếu dùng) → cộng phí ship → Tổng thanh toán. Giảm giá gói đăng ký (10%) áp trên tạm tính trước mã.                                                             |
| **BR-06** | **Điểm.** Tích 1 điểm cho mỗi 10.000đ của tạm tính sau giảm, khi đơn *Hoàn tất*. Đổi 1 điểm = 100đ, tối đa 20% tạm tính.                                                                                                                  |
| **BR-07** | **Trạng thái đơn.** Chờ xác nhận → Đã xác nhận → Đang rang/đóng gói → Đang giao → Hoàn tất. Hủy chỉ khi *Chờ xác nhận* hoặc *Đã xác nhận*. Không được nhảy cóc hoặc quay lui, trừ hủy. Mỗi lần đổi ghi vào order\_status\_history.        |
| **BR-08** | **Trạng thái thanh toán.** unpaid → paid / failed; refunded khi hoàn tiền đơn đã trả. COD chuyển sang paid khi đơn *Hoàn tất*. Chuyển khoản do nhân viên xác nhận thủ công.                                                               |
| **BR-09** | **Mã đơn.** Định dạng SM-YYMMDD-NNNN (NNNN tăng dần trong ngày). **Mã lô rang:** SM-YYMMDD-{MÃ SP}. **Mã báo giá:** BG-YYMM-NNN.                                                                                                          |
| **BR-10** | **Thuật toán quiz.** Hồ sơ khách là vector 5 trục (chua, đậm, ngọt, đắng, thơm) khởi tạo mỗi trục = 3. Mỗi đáp án cộng/trừ điểm theo cột \*\_delta, sau đó giới hạn trong \[1,5\]. Độ phù hợp với sản phẩm: \`match% = round(100 × (1 − Σ |
| **BR-11** | **Độ tươi.** Lấy lô rang mới nhất còn hàng của sản phẩm. Ngon nhất đến = ngày rang + 30 ngày. Nhãn: ≤ 7 ngày *Rất tươi*; ≤ 21 ngày *Tươi*; ≤ 45 ngày *Còn tốt*; quá thì ẩn nhãn.                                                          |
| **BR-12** | **Gói đăng ký.** Giảm 10%, chu kỳ 1/2/4 tuần. *Tạm dừng* không sinh đơn; *Bỏ qua kỳ tới* dời next\_delivery\_date thêm một chu kỳ. Hủy là trạng thái cuối.                                                                                |
| **BR-13** | **Bậc giá sỉ tham khảo** (chỉ mang tính định hướng, giá chốt trong báo giá): từ 5kg/tháng giảm \~8%; từ 20kg giảm \~12%; từ 50kg giảm \~15%. Báo giá có hiệu lực 7 ngày; miễn phí vận chuyển từ 2.000.000đ.                               |
| **BR-14** | **Đánh giá.** Chỉ người đã nhận hàng; mỗi dòng đơn một đánh giá; trạng thái pending → approved/hidden.                                                                                                                                    |
| **BR-15** | **Giỏ hàng.** Khóa dòng giỏ = (biến thể + kiểu xay). Số lượng tối đa mỗi dòng: 20 (sỉ đặt qua báo giá).                                                                                                                                   |
| **BR-16** | **Xoá mềm.** Sản phẩm đã từng có đơn chỉ được *ẩn* (is\_active = 0), không xoá cứng. Đơn hàng lưu bản chụp (snapshot) tên, giá, biến thể tại thời điểm mua.                                                                               |

## **4. YÊU CẦU PHI CHỨC NĂNG**

| **Nhóm**        | **Yêu cầu**                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hiệu năng**   | Ảnh đã nén WebP (hero ≤ 300KB, sản phẩm ≤ 120KB); lazy-load ảnh; CSS/JS gộp và rút gọn khi nộp; tải trang chủ ≤ 3 giây trên localhost; chỉ mục (index) CSDL cho khóa ngoại và cột tìm kiếm                                                                                                                                                                                                                                                               |
| **Bảo mật**     | Mật khẩu password\_hash() (bcrypt/argon2); toàn bộ truy vấn dùng PDO prepared statements; chống XSS (htmlspecialchars khi xuất); **CSRF token** cho mọi form POST/AJAX; kiểm tra phiên và vai trò ở máy chủ; session\_regenerate\_id() khi đăng nhập; giới hạn đăng nhập sai (5 lần/15 phút); upload chỉ nhận jpg/png/webp, kiểm tra MIME và kích thước, đổi tên file; không để lộ lỗi PHP khi chạy thật; thông tin cấu hình nằm ngoài thư mục công khai |
| **Responsive**  | Mobile-first; breakpoints: 480 / 768 / 1024 / 1280px; menu hamburger trên mobile; mini-cart toàn màn hình trên mobile                                                                                                                                                                                                                                                                                                                                    |
| **Khả dụng**    | Nhãn cho form, thông báo lỗi tiếng Việt rõ ràng, độ tương phản màu chữ ≥ 4.5:1, điều hướng bằng bàn phím, thuộc tính alt cho ảnh                                                                                                                                                                                                                                                                                                                         |
| **SEO cơ bản**  | URL thân thiện (/cua-hang/cau-dat-honey), thẻ title/meta description riêng từng trang, Open Graph cho trang sản phẩm và blog, sitemap.xml đơn giản                                                                                                                                                                                                                                                                                                       |
| **Tương thích** | Chrome, Edge, Firefox, Safari bản mới; điện thoại iOS/Android                                                                                                                                                                                                                                                                                                                                                                                            |
| **Bảo trì**     | Kiến trúc MVC, đặt tên nhất quán, bình luận ở các hàm quan trọng, file .env cho cấu hình, file SQL schema.sql + seed.sql để dựng lại hệ thống trong 1 lệnh                                                                                                                                                                                                                                                                                               |
| **Quốc tế hóa** | Giao diện tiếng Việt; tiền tệ VNĐ định dạng 185.000đ; ngày DD/MM/YYYY; múi giờ Asia/Ho\_Chi\_Minh                                                                                                                                                                                                                                                                                                                                                        |

## **5. THIẾT KẾ GIAO DIỆN VÀ TRẢI NGHIỆM (UI/UX)**

### **5.1. Định hướng thẩm mỹ**

**Từ khóa:** ấm áp · thủ công · sang trọng tối giản · sương sớm Đà Lạt. Cảm giác như bước vào một xưởng rang nhỏ có ánh nắng sớm: nhiều khoảng trắng, ảnh lớn, chữ serif tiêu đề, màu đất. **Tránh:** màu sặc sỡ, icon cartoon, gradient tím/xanh kiểu công nghệ, bố cục "template mặc định".

### **5.2. Design Tokens (dùng làm biến CSS :root)**

**Màu sắc**

| **Token**   | **Mã**   | **Dùng cho**                                                        |
| ----------- | -------- | ------------------------------------------------------------------- |
| \--espresso | \#2B1B14 | Chữ chính, header/footer tối, nút chính                             |
| \--roast    | \#4A2E22 | Nền khối nhấn mạnh, hover của nút chính                             |
| \--crema    | \#F5EDE0 | Nền trang chính                                                     |
| \--mist     | \#E8E2D6 | Viền, nền thẻ phụ, đường kẻ                                         |
| \--moss     | \#6B7F5E | Màu nhấn "sương mai" (xanh rêu): tag, huy hiệu, trạng thái tích cực |
| \--caramel  | \#C17F3E | Màu nhấn chính cho CTA nổi bật, sao đánh giá, giá khuyến mãi        |
| \--paper    | \#FFFDF8 | Nền thẻ sản phẩm, form                                              |
| \--danger   | \#B3412F | Lỗi, hết hàng                                                       |
| \--success  | \#4C7A4F | Thành công                                                          |

Tỷ lệ dùng: 60% crema/paper · 25% espresso/roast · 10% moss · 5% caramel.

**Typography**

| **Vai trò** | **Font**               | **Cỡ (desktop / mobile)**         |
| ----------- | ---------------------- | --------------------------------- |
| H1 hero     | Playfair Display 700   | 64 / 38px                         |
| H2          | Playfair Display 600   | 40 / 28px                         |
| H3          | Playfair Display 600   | 26 / 22px                         |
| Nội dung    | Be Vietnam Pro 400     | 17 / 16px, line-height 1.65       |
| Nhãn, nút   | Be Vietnam Pro 500–600 | 14–16px, chữ hoa nhẹ cho nhãn nhỏ |

> Cả hai font đều hỗ trợ đầy đủ dấu tiếng Việt, tải từ Google Fonts, kèm font dự phòng Georgia, serif và system-ui, sans-serif.

**Khoảng cách và hình khối:** thang 4/8/16/24/32/48/80px; container tối đa 1200px; bo góc thẻ 14px, nút 999px (dạng viên), ảnh 16px; bóng mềm 0 8px 24px rgba(43,27,20,.08).

### **5.3. Thành phần giao diện (Component)**

| **Component**                                                 | **Mô tả**                                                                                                                                                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Header**                                                    | Logo trái; menu giữa (Cửa hàng, Tìm gu, Brew Lab, Hộp Sương Mai, Câu chuyện, Blog, Cho quán); phải: tìm kiếm, yêu thích, tài khoản, giỏ hàng có số lượng. Dính khi cuộn, nền trong suốt trên hero rồi chuyển sang crema |
| **Mini-cart**                                                 | Ngăn kéo phải: danh sách dòng, tăng/giảm số lượng, thanh tiến độ freeship, nút "Thanh toán"                                                                                                                             |
| **Product Card**                                              | Ảnh vuông (hover đổi sang ảnh 2), nhãn, tên (serif), vùng + mức rang, tag hương vị (tối đa 3), giá "từ …", nút thêm nhanh                                                                                               |
| **Flavor Radar**                                              | Biểu đồ 5 trục, màu moss mờ, viền caramel                                                                                                                                                                               |
| **Roast Level Bar**                                           | Thanh 4 nấc (Nhạt → Đậm)                                                                                                                                                                                                |
| **Freshness Badge**                                           | Chấm xanh moss + "Rất tươi · rang 3 ngày trước"                                                                                                                                                                         |
| **Option Pills**                                              | Nút dạng viên chọn khối lượng, kiểu xay (chọn: nền espresso, chữ crema)                                                                                                                                                 |
| **Toast**                                                     | Thông báo nhỏ góc dưới phải, tự tắt sau 3 giây                                                                                                                                                                          |
| **Accordion, Tabs, Breadcrumb, Pagination, Skeleton loading** | Dùng thống nhất ở mọi trang                                                                                                                                                                                             |
| **Form**                                                      | Nhãn trên ô nhập, lỗi dưới ô (màu danger), nút gửi có trạng thái loading                                                                                                                                                |

### **5.4. Chuyển động (làm vừa phải để mượt và khả thi)**

  - > **Splash loading** (0,8–1,2 giây): logo + hơi nước bốc lên từ tách cà phê (CSS animation), chỉ hiện ở lần truy cập đầu mỗi phiên.

  - > **Hiện dần khi cuộn:** các khối fade-up (IntersectionObserver).

  - > **Hero:** ảnh phóng chậm (Ken Burns, 20 giây) hoặc video ngắn lặp.

  - > **Thẻ sản phẩm:** hover phóng ảnh 1,04×, nút thêm nhanh trượt lên.

  - > **Thêm vào giỏ:** biểu tượng giỏ "nảy" nhẹ và mini-cart trượt vào.

  - > **Quiz:** chuyển câu bằng trượt ngang; radar vẽ dần khi ra kết quả.

  - > **Tôn trọng** prefers-reduced-motion: tắt chuyển động nếu người dùng yêu cầu.

### **5.5. Bố cục các trang chính**

**Trang chủ (theo thứ tự từ trên xuống)**

1.  > **Hero:** ảnh toàn khung (cà phê, sương sớm, xưởng rang); tiêu đề *"Hương cà phê từ sương sớm Đà Lạt"*; phụ đề; 2 nút: **Khám phá cà phê** (chính) và **Tìm gu của bạn** (phụ); 3 thẻ nổi: *Rang theo lô nhỏ · Giao trong 48 giờ · Truy xuất nguồn gốc*.

2.  > **Dải cam kết:** 4 biểu tượng nhỏ (rang tươi, miễn phí ship từ 500k, đổi trả 7 ngày, hỗ trợ pha chế).

3.  > **Danh mục:** 4 thẻ lớn (Cà phê hạt, Túi lọc, Dụng cụ, Quà tặng).

4.  > **Bán chạy:** carousel 4–8 thẻ sản phẩm.

5.  > **Khối Quiz:** nền roast, tiêu đề *"Chưa biết chọn gì? Trả lời 5 câu hỏi"*, nút bắt đầu, minh họa radar.

6.  > **Câu chuyện & quy trình:** timeline 4 bước, ảnh xưởng rang.

7.  > **Vùng nguyên liệu:** 4–5 thẻ vùng (Cầu Đất, Lạc Dương, Lâm Hà, Đắk Lắk) kèm độ cao.

8.  > **Hộp Sương Mai:** khối mời đăng ký, 3 lợi ích, nút *Bắt đầu*.

9.  > **Đánh giá khách hàng + Góc cà phê:** 3 đánh giá nổi bật, 3 bài blog mới.

10. > **Dành cho quán cà phê:** dải mời xin báo giá.

11. > **Footer:** thông tin xưởng, giờ mở cửa, liên kết nhanh, đăng ký bản tin, mạng xã hội.

**Trang cửa hàng:** thanh breadcrumb; bên trái bộ lọc (thu thành ngăn kéo trên mobile); bên phải lưới 3 cột (desktop), 2 cột (mobile); thanh trên cùng gồm số kết quả và sắp xếp; các chip lọc đang áp dụng có nút xóa.

**Trang chi tiết sản phẩm:** trái là thư viện ảnh (ảnh lớn + dải ảnh nhỏ); phải theo thứ tự: tên → đánh giá sao → giá → **Freshness Badge** → chọn khối lượng → chọn kiểu xay → số lượng → nút **Thêm vào giỏ** + yêu thích → cam kết nhỏ. Bên dưới: tab *Mô tả · Thông số · Cách pha · Đánh giá*; khối **Flavor Radar + Roast Level Bar**; khối **"Câu chuyện của lô này"** (liên kết trang lô rang); sản phẩm liên quan.

**Giỏ hàng/Checkout:** hai cột: trái là các bước, phải là tóm tắt đơn cố định khi cuộn (danh sách, mã giảm, phí ship, tổng). Mobile: tóm tắt đơn thu gọn ở đầu trang.

**Trang Quiz:** toàn màn hình, một câu hỏi mỗi lần, đáp án là các thẻ lớn có biểu tượng, thanh tiến độ; kết quả gồm radar + 3 thẻ gợi ý có % phù hợp.

**Trang tài khoản:** thanh bên (Tổng quan, Đơn hàng, Gói đăng ký, Báo giá, Địa chỉ, Yêu thích, Điểm, Hồ sơ).

**Trang quản trị:** thanh bên tối (espresso); khu vực nội dung nền sáng; thẻ số liệu ở đầu dashboard; bảng có tìm kiếm/lọc; giao diện gọn, ưu tiên rõ ràng hơn trang trí.

## **6. SƠ ĐỒ TRANG (SITEMAP) VÀ ĐƯỜNG DẪN**

### **6.1. Khu vực công khai**

| **Trang**                            | **URL**                                                         | **Ghi chú**                                           |
| ------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------- |
| Trang chủ                            | /                                                               |                                                       |
| Cửa hàng                             | /cua-hang                                                       | tham số lọc: ?rang=\&vung=\&huong-vi=\&gia=\&sap-xep= |
| Danh mục                             | /cua-hang/{category-slug}                                       |                                                       |
| Chi tiết sản phẩm                    | /san-pham/{slug}                                                |                                                       |
| Tìm gu (Quiz)                        | /tim-gu và /tim-gu/ket-qua                                      |                                                       |
| Brew Lab                             | /brew-lab và /brew-lab/{method-slug}                            |                                                       |
| Lô rang                              | /lo-rang/{batch\_code}                                          | đích của mã QR                                        |
| Hộp Sương Mai                        | /hop-suong-mai                                                  |                                                       |
| Dành cho quán                        | /cho-quan                                                       | form báo giá                                          |
| Câu chuyện                           | /cau-chuyen                                                     |                                                       |
| Blog                                 | /goc-ca-phe và /goc-ca-phe/{slug}                               |                                                       |
| Liên hệ, FAQ, Chính sách             | /lien-he, /hoi-dap, /chinh-sach/{slug}                          |                                                       |
| Giỏ hàng, Thanh toán, Đặt thành công | /gio-hang, /thanh-toan, /dat-hang-thanh-cong/{order\_code}      |                                                       |
| Tra cứu đơn                          | /tra-cuu-don                                                    |                                                       |
| Đăng nhập, đăng ký, quên MK          | /dang-nhap, /dang-ky, /quen-mat-khau, /dat-lai-mat-khau/{token} |                                                       |

### **6.2. Khu vực tài khoản (yêu cầu đăng nhập)**

/tai-khoan (tổng quan) · /tai-khoan/don-hang · /tai-khoan/don-hang/{order\_code} · /tai-khoan/goi-dang-ky · /tai-khoan/bao-gia · /tai-khoan/dia-chi · /tai-khoan/yeu-thich · /tai-khoan/diem · /tai-khoan/ho-so

### **6.3. Khu vực quản trị (vai trò staff/admin)**

/admin (dashboard) · /admin/san-pham · /admin/danh-muc · /admin/vung-trong · /admin/lo-rang · /admin/don-hang · /admin/kho · /admin/goi-dang-ky · /admin/bao-gia · /admin/nguoi-dung · /admin/ma-giam-gia · /admin/danh-gia · /admin/bai-viet · /admin/banner · /admin/lien-he · /admin/quiz · /admin/brew-lab · /admin/cai-dat · /admin/bao-cao

### **6.4. Các endpoint AJAX (JSON) chính**

| **Endpoint**                                                 | **Phương thức** | **Chức năng**                    |
| ------------------------------------------------------------ | --------------- | -------------------------------- |
| /api/cart/add, /api/cart/update, /api/cart/remove, /api/cart | POST/GET        | Giỏ hàng                         |
| /api/coupon/apply                                            | POST            | Kiểm tra mã giảm giá             |
| /api/search/suggest?q=                                       | GET             | Gợi ý tìm kiếm                   |
| /api/wishlist/toggle                                         | POST            | Yêu thích                        |
| /api/quiz/submit                                             | POST            | Tính kết quả quiz                |
| /api/shop/filter                                             | GET             | Lọc sản phẩm không tải lại trang |
| /api/orders/{id}/status                                      | POST (admin)    | Đổi trạng thái đơn               |

> Mọi API ghi dữ liệu đều phải kèm CSRF token và trả về JSON dạng { "ok": true|false, "message": "...", "data": {...} }.

## **7. KIẾN TRÚC KỸ THUẬT**

### **7.1. Công nghệ**

| **Lớp**                 | **Công nghệ**                                                                                                                | **Ghi chú**                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Frontend                | HTML5, CSS3 (biến CSS, Grid, Flexbox), JavaScript ES6+ (module, Fetch API)                                                   | Không dùng framework nặng; tự viết CSS theo design token để giao diện độc đáo |
| Thư viện JS             | **Chart.js** (biểu đồ admin, radar), **Swiper** (carousel), **SweetAlert2** hoặc toast tự viết, **qrcodejs** (mã QR lô rang) | Tải qua CDN hoặc lưu cục bộ                                                   |
| Backend                 | **PHP 8.1+**, PDO, mô hình MVC tự viết gọn (front controller + router)                                                       |                                                                               |
| CSDL                    | **MySQL 8 / MariaDB** (POSTGRE SQL), utf8mb4\_unicode\_ci, InnoDB                                                            |                                                                               |
| Thư viện PHP (Composer) | PHPMailer (email), vlucas/phpdotenv (tùy chọn)                                                                               |                                                                               |
| Thanh toán              | COD, chuyển khoản (VietQR hiển thị bằng ảnh QR tĩnh), VNPay Sandbox hoặc trang thanh toán giả lập                            |                                                                               |
| Môi trường              | XAMPP (localhost), Git/GitHub                                                                                                | Deploy thử trên hosting miễn phí hỗ trợ PHP/MySQL (nếu cần)                   |
| Công cụ                 | Antigravity, Figma/Canva, draw.io, Gemini (ảnh), phpMyAdmin                                                                  |                                                                               |

### **7.2. Cấu trúc thư mục**

suongmai/

├─ docs/

│ └─ SPEC.md (tài liệu này)

├─ public/ (document root)

│ ├─ index.php (front controller)

│ ├─ .htaccess (rewrite URL thân thiện)

│ └─ assets/

│ ├─ css/ (tokens.css, base.css, components.css, pages/\*.css)

│ ├─ js/ (app.js, cart.js, shop.js, quiz.js, brewlab.js, admin/\*.js)

│ ├─ img/ (ảnh Gemini đã nén WebP)

│ └─ uploads/ (ảnh sản phẩm do admin tải lên)

├─ app/

│ ├─ Core/ (Router, Controller, Model, View, Database, Auth, Csrf, Validator, Session)

│ ├─ Controllers/ (Home, Shop, Product, Cart, Checkout, Order, Account, Quiz, BrewLab, Batch, Blog, Subscription, Wholesale, Contact, Auth)

│ │ └─ Admin/ (Dashboard, Product, Order, Stock, Batch, User, Coupon, Post, ...)

│ ├─ Models/ (User, Product, Variant, Cart, Order, Coupon, Subscription, Quote, Batch, Quiz, ...)

│ ├─ Services/ (PricingService, StockService, OrderService, QuizService, FreshnessService, MailService)

│ └─ Views/ (layouts/, partials/, pages/, admin/, emails/)

├─ config/ (app.php, routes.php)

├─ database/ (schema.sql, seed.sql)

├─ cron/ (generate\_subscription\_orders.php)

├─ storage/ (logs/)

├─ .env.example

└─ composer.json

> **Nguyên tắc:** logic nghiệp vụ (tính tiền, trừ kho, quiz, độ tươi) nằm trong Services/, không đặt trong view hay controller. Như vậy dễ kiểm thử và dễ giải thích trong báo cáo.

### **7.3. Một số quyết định kỹ thuật cần giữ nhất quán**

1.  > Giá lưu **số nguyên (đồng)** kiểu INT UNSIGNED/BIGINT, không dùng số thực.

2.  > Mọi thao tác tạo đơn nằm trong **một transaction**: tạo đơn → tạo dòng đơn → trừ kho → ghi lịch sử trạng thái → ghi thanh toán.

3.  > Đơn hàng lưu **snapshot** thông tin sản phẩm để thay đổi giá sau này không ảnh hưởng đơn cũ (BR-16).

4.  > slug duy nhất cho sản phẩm, danh mục, bài viết, vùng trồng.

5.  > Ảnh người dùng/admin tải lên lưu ở public/assets/uploads/, tên file ngẫu nhiên.

6.  > Phiên (session) cấu hình httponly, samesite=Lax.

## **8. THIẾT KẾ CƠ SỞ DỮ LIỆU**

### **8.1. Sơ đồ quan hệ tổng quát (Mermaid)**

erDiagram

roles ||--o{ users : has

users ||--o{ addresses : owns

users ||--o| business\_profiles : has

users ||--o{ orders : places

users ||--o{ subscriptions : owns

users ||--o{ reviews : writes

categories ||--o{ products : contains

origins ||--o{ products : grown\_in

products ||--o{ product\_variants : has

products ||--o{ product\_images : has

products ||--o{ roast\_batches : roasted\_as

products }o--o{ flavor\_tags : tagged

orders ||--|{ order\_items : contains

orders ||--o{ order\_status\_history : logs

orders ||--o{ payments : paid\_by

orders }o--o| coupons : uses

order\_items }o--o| roast\_batches : from\_batch

product\_variants ||--o{ order\_items : sold\_as

carts ||--o{ cart\_items : contains

subscriptions ||--|{ subscription\_items : contains

wholesale\_requests ||--o{ quotes : answered\_by

quotes ||--|{ quote\_items : lists

quiz\_questions ||--|{ quiz\_answers : offers

post\_categories ||--o{ posts : groups

### **8.2. Chi tiết các bảng**

> **Quy ước:** PK khóa chính (AUTO\_INCREMENT), FK khóa ngoại, UQ duy nhất, NN không null. Mọi bảng có created\_at DATETIME DEFAULT CURRENT\_TIMESTAMP; bảng có sửa đổi thêm updated\_at. Cột tiền kiểu INT UNSIGNED.

**Nhóm 1: Người dùng (Phase 1)**

| **Bảng**           | **Cột chính**                                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| roles              | id PK, name UQ (admin, staff, customer, wholesale)                                                                                                               |
| users              | id PK, role\_id FK, full\_name NN, email UQ NN, phone, password\_hash NN, avatar, status (active/locked/pending), loyalty\_points INT DEFAULT 0, last\_login\_at |
| addresses          | id PK, user\_id FK, recipient\_name, phone, province, district, ward, street, is\_default TINYINT                                                                |
| business\_profiles | id PK, user\_id FK UQ, company\_name, tax\_code, business\_type, address, approved\_at, approved\_by FK                                                          |
| password\_resets   | id PK, user\_id FK, token\_hash, expires\_at, used\_at                                                                                                           |

**Nhóm 2: Sản phẩm (Phase 1)**

| **Bảng**              | **Cột chính**                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| categories            | id PK, parent\_id FK NULL, name, slug UQ, description, image, sort\_order                                                                                                                                                                                                                                                                                                                       |
| origins               | id PK, name, slug UQ, province, altitude\_min, altitude\_max, description, image                                                                                                                                                                                                                                                                                                                |
| products              | id PK, category\_id FK, origin\_id FK NULL, product\_type (coffee/drip\_bag/equipment/gift), name, slug UQ, short\_desc, description, variety (giống), process (sơ chế), altitude, roast\_level (light/medium/medium\_dark/dark), tasting\_notes, **acidity, body, sweetness, bitterness, aroma TINYINT (1–5)**, is\_featured, is\_active, sold\_count, avg\_rating DECIMAL(2,1), review\_count |
| product\_variants     | id PK, product\_id FK, sku UQ, label (250g, 500g, 1kg, Inox 8cm…), weight\_g NULL, price INT, sale\_price INT NULL, stock\_qty INT, is\_active                                                                                                                                                                                                                                                  |
| product\_images       | id PK, product\_id FK, url, alt, is\_primary, sort\_order                                                                                                                                                                                                                                                                                                                                       |
| flavor\_tags          | id PK, name UQ (Chocolate, Caramel, Cam quýt, Hoa, Hạt dẻ, Mật ong, Trái cây chín…), icon                                                                                                                                                                                                                                                                                                       |
| product\_flavor\_tags | product\_id FK, tag\_id FK (PK kép)                                                                                                                                                                                                                                                                                                                                                             |
| grind\_options        | id PK, name, slug UQ, description, sort\_order (Nguyên hạt, Phin, Espresso, Moka Pot, Pour-over, French Press, Cold Brew)                                                                                                                                                                                                                                                                       |
| roast\_batches        | id PK, product\_id FK, batch\_code UQ, roast\_date DATE, green\_bean\_lot, roast\_profile (nhiệt độ, thời gian), cupping\_score DECIMAL(4,1), notes, produced\_qty\_g                                                                                                                                                                                                                           |

**Nhóm 3: Giỏ hàng, mã giảm giá, yêu thích (Phase 1–2)**

| **Bảng**    | **Cột chính**                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| carts       | id PK, user\_id FK NULL, session\_id NULL, updated\_at                                                                                                                     |
| cart\_items | id PK, cart\_id FK, variant\_id FK, grind\_option\_id FK NULL, quantity; UQ (cart\_id,variant\_id,grind\_option\_id)                                                       |
| wishlists   | user\_id FK, product\_id FK (PK kép)                                                                                                                                       |
| coupons     | id PK, code UQ, type (percent/fixed/free\_ship), value, max\_discount NULL, min\_order, usage\_limit NULL, used\_count, per\_user\_limit, starts\_at, ends\_at, is\_active |

**Nhóm 4: Đơn hàng và thanh toán (Phase 2)**

| **Bảng**               | **Cột chính**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| orders                 | id PK, order\_code UQ, user\_id FK NULL, source (web/subscription/wholesale), subscription\_id FK NULL, quote\_id FK NULL, receiver\_name, receiver\_phone, receiver\_email, shipping\_address, is\_gift TINYINT, gift\_message, note, subtotal, discount\_amount, points\_used, shipping\_fee, grand\_total, coupon\_id FK NULL, payment\_method (cod/bank/online), payment\_status (unpaid/paid/failed/refunded), status (pending/confirmed/roasting/shipping/completed/cancelled), cancelled\_reason, internal\_note |
| order\_items           | id PK, order\_id FK, variant\_id FK, product\_name, variant\_label, grind\_name, unit\_price, quantity, line\_total, batch\_id FK NULL                                                                                                                                                                                                                                                                                                                                                                                  |
| order\_status\_history | id PK, order\_id FK, status, note, changed\_by FK NULL, created\_at                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| payments               | id PK, order\_id FK, method, amount, status, transaction\_ref, paid\_at, raw\_response TEXT                                                                                                                                                                                                                                                                                                                                                                                                                             |
| loyalty\_transactions  | id PK, user\_id FK, order\_id FK NULL, points INT (+/−), type (earn/redeem/adjust), note                                                                                                                                                                                                                                                                                                                                                                                                                                |

**Nhóm 5: Dịch vụ đăng ký và sỉ (Phase 3)**

| **Bảng**            | **Cột chính**                                                                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| subscriptions       | id PK, user\_id FK, address\_id FK, frequency\_weeks (1/2/4), status (active/paused/cancelled), discount\_percent DEFAULT 10, payment\_method, next\_delivery\_date, last\_order\_id FK NULL, paused\_at, cancelled\_at |
| subscription\_items | id PK, subscription\_id FK, variant\_id FK, grind\_option\_id FK NULL, quantity                                                                                                                                         |
| wholesale\_requests | id PK, user\_id FK NULL, company\_name, contact\_name, phone, email, interested\_products, monthly\_kg\_estimate, message, status (new/quoted/accepted/rejected/expired)                                                |
| quotes              | id PK, quote\_code UQ, request\_id FK, total, valid\_until DATE, notes, status (sent/accepted/rejected/expired), created\_by FK                                                                                         |
| quote\_items        | id PK, quote\_id FK, variant\_id FK, grind\_option\_id FK NULL, quantity, unit\_price                                                                                                                                   |

**Nhóm 6: Quiz và Brew Lab (Phase 3)**

| **Bảng**        | **Cột chính**                                                                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| quiz\_questions | id PK, question\_text, sort\_order, is\_active                                                                                                                                                                                      |
| quiz\_answers   | id PK, question\_id FK, answer\_text, icon, acidity\_delta, body\_delta, sweetness\_delta, bitterness\_delta, aroma\_delta (SMALLINT, âm/dương), method\_tag NULL                                                                   |
| quiz\_results   | id PK, user\_id FK NULL, session\_id, profile\_json, recommended\_json, created\_at                                                                                                                                                 |
| brew\_methods   | id PK, name, slug UQ, description, grind\_option\_id FK, ratio\_water DECIMAL(4,1) (ví dụ 15,0 nghĩa là 1:15), water\_temp\_c, total\_time\_sec, steps\_json (mảng bước: tên, thời lượng giây, hướng dẫn), tips, recommended\_roast |

**Nhóm 7: Nội dung và hệ thống (Phase 2–3)**

| **Bảng**                | **Cột chính**                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| reviews                 | id PK, product\_id FK, user\_id FK, order\_item\_id FK UQ, rating TINYINT, title, content, status (pending/approved/hidden)    |
| post\_categories        | id PK, name, slug UQ                                                                                                           |
| posts                   | id PK, category\_id FK, author\_id FK, title, slug UQ, excerpt, content, cover\_image, status (draft/published), published\_at |
| banners                 | id PK, title, subtitle, image, link\_url, button\_text, position, sort\_order, is\_active                                      |
| contacts                | id PK, name, email, phone, subject, message, status (new/read/replied)                                                         |
| newsletter\_subscribers | id PK, email UQ, is\_active                                                                                                    |
| settings                | key PK, value (ví dụ: shipping\_fee, free\_ship\_threshold, low\_stock\_threshold, bank\_info, shop\_address, shop\_hours)     |

**Tổng cộng 39 bảng**, chia theo Phase để làm dần. Phase 1 chỉ cần khoảng 17 bảng đầu tiên là website đã bán hàng được.

### **8.3. Chỉ mục (Index) nên có**

products(slug), products(category\_id, is\_active), products(roast\_level), product\_variants(product\_id), orders(user\_id, created\_at), orders(status, created\_at), order\_items(order\_id), roast\_batches(product\_id, roast\_date), reviews(product\_id, status), subscriptions(status, next\_delivery\_date).

## **9. LUỒNG NGHIỆP VỤ CHÍNH**

### **9.1. Trạng thái đơn hàng**

stateDiagram-v2

\[\*\] --\> pending: Khách đặt hàng

pending --\> confirmed: Nhân viên xác nhận

pending --\> cancelled: Khách/Admin hủy

confirmed --\> roasting: Bắt đầu rang/đóng gói (gán lô rang)

confirmed --\> cancelled: Hủy (hoàn kho)

roasting --\> shipping: Bàn giao vận chuyển

shipping --\> completed: Giao thành công

completed --\> \[\*\]

cancelled --\> \[\*\]

### **9.2. Luồng đặt hàng (khách)**

1.  > Khách xem sản phẩm → chọn khối lượng, kiểu xay → **Thêm vào giỏ** (AJAX, mini-cart mở ra).

2.  > Vào **Giỏ hàng** → kiểm tra, sửa → nhập mã giảm giá (nếu có) → **Thanh toán**.

3.  > **Checkout:** nhập/chọn địa chỉ → chọn phương thức thanh toán → xác nhận.

4.  > Hệ thống kiểm tra tồn kho và mã giảm → **transaction:** tạo đơn, tạo dòng đơn, trừ kho, ghi lịch sử (pending), ghi payments.

5.  > Chuyển đến **Đặt hàng thành công** (hiển thị mã đơn, hướng dẫn chuyển khoản nếu chọn bank) → gửi email.

6.  > Khách theo dõi đơn ở tài khoản hoặc /tra-cuu-don.

### **9.3. Luồng xử lý đơn (nhân viên)**

Vào /admin/don-hang → mở đơn *Chờ xác nhận* → kiểm tra thanh toán → **Xác nhận** → khi bắt đầu chuẩn bị chọn **Đang rang/đóng gói** (gán lô rang, mặc định lô mới nhất) → in **phiếu giao hàng** → **Đang giao** → **Hoàn tất**. Mọi bước ghi vào lịch sử.

### **9.4. Luồng Quiz → mua hàng**

Bắt đầu quiz → trả lời 5 câu → /api/quiz/submit → QuizService tính hồ sơ và độ phù hợp (BR-10) → hiển thị radar + 3 sản phẩm → nút *Thêm vào giỏ* hoặc *Xem chi tiết*.

### **9.5. Luồng đăng ký gói**

Chọn *Bắt đầu* ở /hop-suong-mai → chọn sản phẩm/khối lượng/xay/chu kỳ → chọn địa chỉ và ngày giao đầu → xác nhận (tạo subscriptions + subscription\_items, trạng thái active) → ngày đến hạn, admin bấm **Tạo đơn kỳ này** → đơn nguồn subscription được tạo, next\_delivery\_date += chu kỳ.

### **9.6. Luồng báo giá sỉ**

Khách gửi yêu cầu → admin xem (new) → lập báo giá (quotes, trạng thái sent, yêu cầu chuyển quoted) → khách xem trong /tai-khoan/bao-gia → **Chấp nhận** → hệ thống sinh đơn nguồn wholesale (thanh toán chuyển khoản), yêu cầu chuyển accepted.

## **10. DỮ LIỆU MẪU (SEED)**

### **10.1. Vùng trồng (origins)**

| **Vùng**      | **Tỉnh** | **Độ cao**   | **Mô tả ngắn**                                            |
| ------------- | -------- | ------------ | --------------------------------------------------------- |
| Cầu Đất       | Lâm Đồng | 1.500–1.650m | Vùng Arabica nổi tiếng, khí hậu mát, vị thanh và ngọt hậu |
| Lạc Dương     | Lâm Đồng | 1.400–1.600m | Dưới chân núi Lang Biang, sương nhiều, hương hoa rõ       |
| Lâm Hà        | Lâm Đồng | 900–1.200m   | Đất đỏ bazan, vị cân bằng, nhiều hạt dẻ                   |
| Buôn Ma Thuột | Đắk Lắk  | 500–800m     | Thủ phủ Robusta, vị đậm, béo, hậu đắng                    |
| Sơn La        | Sơn La   | 800–1.200m   | Arabica vùng núi phía Bắc, vị ngọt trái cây (tuỳ chọn)    |

### **10.2. Sản phẩm cà phê (10 sản phẩm; giá là giá 250g)**

Điểm vị theo thứ tự (chua, đậm, ngọt, đắng, thơm), thang 1–5.

| **\#** | **Tên**               | **Vùng**                | **Mức rang** | **Hương vị chính**           | **Điểm (C-Đ-N-Đắng-T)** | **Giá 250g** | **Phù hợp**              |
| ------ | --------------------- | ----------------------- | ------------ | ---------------------------- | ----------------------- | ------------ | ------------------------ |
| 1      | Cầu Đất Honey         | Cầu Đất                 | Vừa          | Mật ong, caramel, cam        | 3-3-4-2-4               | 185.000      | Pour-over, Phin          |
| 2      | Lạc Dương Washed      | Lạc Dương               | Nhạt         | Hoa, chanh, trà đen          | 5-2-3-1-5               | 210.000      | Pour-over                |
| 3      | Đà Lạt Natural        | Cầu Đất                 | Vừa          | Trái cây chín, dâu, vang nhẹ | 3-4-4-2-5               | 195.000      | Pour-over, Cold Brew     |
| 4      | Sương Mai House Blend | Cầu Đất + Buôn Ma Thuột | Vừa đậm      | Chocolate, hạt, caramel đậm  | 2-4-3-3-3               | 135.000      | Phin, Moka, French Press |
| 5      | Phin Truyền Thống     | Buôn Ma Thuột           | Đậm          | Đắng đậm, béo, khói nhẹ      | 1-5-2-5-3               | 120.000      | Phin                     |
| 6      | Espresso Dalat Blend  | Cầu Đất + Lâm Hà        | Vừa đậm      | Chocolate đen, hạt, cam      | 3-4-3-3-4               | 150.000      | Espresso, Moka           |
| 7      | Culi Honey Đắk Lắk    | Buôn Ma Thuột           | Vừa đậm      | Béo, ngọt hậu, cacao         | 1-5-3-4-3               | 140.000      | Phin, Espresso           |
| 8      | Moka Cầu Đất          | Cầu Đất                 | Vừa          | Chocolate, trái cây đỏ       | 4-3-3-2-5               | 230.000      | Pour-over, Phin          |
| 9      | Cold Brew Blend       | Lâm Hà                  | Vừa          | Ngọt, ít chua, hạt dẻ        | 2-3-5-2-3               | 145.000      | Cold Brew, French Press  |
| 10     | Lâm Hà Bourbon        | Lâm Hà                  | Vừa          | Caramel, hạt dẻ, ngọt dịu    | 2-4-4-2-3               | 175.000      | Phin, Moka, Pour-over    |

Giá 500g và 1kg tính theo BR-01. Mỗi sản phẩm có 2–3 tag hương vị, 3–4 ảnh.

### **10.3. Sản phẩm khác**

| **Loại**       | **Sản phẩm (giá tham khảo)**                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Túi lọc        | Hộp 10 túi lọc Cầu Đất Honey (129.000đ); Hộp 10 túi lọc House Blend (99.000đ)                                                                                       |
| Dụng cụ        | Phin inox 8cm (45.000đ); Phễu V60 gốm (220.000đ); Giấy lọc V60 (100 tờ) (85.000đ); Cân điện tử mini 0,1g (290.000đ); Ly sứ Sương Mai 220ml (120.000đ)               |
| Quà tặng/Combo | Hộp Khởi Đầu (1 túi 250g + phin inox + ly sứ) 349.000đ; Hộp Thưởng Thức (2 túi 250g + túi lọc) 549.000đ; Hộp Quà Doanh Nghiệp (4 túi 250g + ly sứ + thiệp) 890.000đ |

**Bảng ánh xạ cách pha → mức rang ưu tiên (dùng cho +5% ở BR-10):**

| **Cách pha (quiz câu 1)** | **Mức rang ưu tiên** |
| ------------------------- | -------------------- |
| Phin                      | Vừa, Vừa đậm, Đậm    |
| Máy espresso/Moka         | Vừa đậm, Đậm         |
| Pour-over (V60)           | Nhạt, Vừa            |
| French Press              | Vừa, Vừa đậm         |
| Cold Brew                 | Vừa, Vừa đậm         |

### **10.4. Quiz (5 câu mẫu)**

Điểm cộng/trừ theo thứ tự (chua, đậm, ngọt, đắng, thơm).

| **Câu**                                  | **Đáp án → điểm**                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Q1. Bạn thường pha cà phê bằng gì?**   | Phin (method=phin) · Máy espresso/Moka (method=espresso) · Phễu V60 (method=pourover) · French Press (method=frenchpress) · Cold Brew (method=coldbrew). Không cộng điểm vị, chỉ lưu method\_tag. |
| **Q2. Vị nào bạn thích nhất?**           | Chua thanh như trái cây (+2, 0, 0, −1, +1) · Đắng đậm mạnh mẽ (−1, +1, 0, +2, 0) · Ngọt dịu như caramel (0, 0, +2, −1, 0) · Cân bằng, dễ uống (0, 0, 0, 0, 0)                                     |
| **Q3. Bạn uống thế nào?**                | Đen, không đường (+1, 0, 0, −1, +1) · Có sữa tươi (−1, +1, 0, +1, 0) · Sữa đặc kiểu Việt (−1, +2, 0, +1, 0) · Thêm đá (0, 0, +1, 0, 0)                                                            |
| **Q4. Mùi hương bạn thích?**             | Hoa và trái cây (+1, 0, 0, 0, +2) · Chocolate và hạt (0, +1, +1, 0, 0) · Mật ong, caramel (0, 0, +2, 0, +1) · Khói, gỗ, đậm đà (−1, +1, 0, +1, 0)                                                 |
| **Q5. Sau khi uống, bạn muốn cảm giác?** | Nhẹ nhàng, thanh mát (+1, −1, 0, −1, +1) · Đậm đà, dư vị lâu (0, +2, 0, +1, 0) · Ngọt hậu, êm (0, 0, +2, −1, 0) · Tỉnh táo, mạnh mẽ (−1, +1, 0, +2, 0)                                            |

### **10.5. Brew Lab (6 phương pháp)**

| **Phương pháp** | **Tỷ lệ (cà phê:nước)** | **Nước**      | **Độ xay** | **Tổng thời gian** | **Gợi ý các bước (có đếm giờ)**                                                       |
| --------------- | ----------------------- | ------------- | ---------- | ------------------ | ------------------------------------------------------------------------------------- |
| Phin            | 1:10                    | 92–95°C       | Vừa-thô    | 4–5 phút           | Tráng phin (20s) → Ủ 30ml nước (30s) → Rót đầy (4 phút)                               |
| V60             | 1:16                    | 92–94°C       | Vừa        | 2:45               | Làm ướt giấy → Ủ 45s (gấp 2 lần lượng cà phê) → Rót lần 2 (đến 60%) → Rót lần 3 (hết) |
| Espresso        | 1:2 (ra ly)             | 92–94°C       | Mịn        | 25–30s             | Dồn bột → Nén → Chiết xuất 25–30s                                                     |
| French Press    | 1:15                    | 94°C          | Thô        | 4 phút             | Rót nước → Ủ 4 phút → Ép nhẹ → Rót ra ngay                                            |
| Moka Pot        | 1:10                    | Nước nóng sẵn | Vừa-mịn    | 4–5 phút           | Đổ nước nóng → Cho bột (không nén) → Đun lửa nhỏ → Dừng khi cà phê ngưng chảy         |
| Cold Brew       | 1:8                     | Nước lạnh     | Thô        | 12–18 giờ          | Trộn → Ủ lạnh → Lọc → Pha loãng theo khẩu vị                                          |

### **10.6. Mã giảm giá mẫu**

| **Mã**     | **Loại**   | **Giá trị**           | **Điều kiện**                    |
| ---------- | ---------- | --------------------- | -------------------------------- |
| WELCOME10  | percent    | 10% (tối đa 50.000đ)  | Đơn đầu tiên, tối thiểu 150.000đ |
| FREESHIP   | free\_ship | –                     | Đơn từ 200.000đ                  |
| SUONGMAI50 | fixed      | 50.000đ               | Đơn từ 600.000đ                  |
| QUATET     | percent    | 15% (tối đa 150.000đ) | Chỉ dành cho danh mục Quà tặng   |

### **10.7. Nội dung blog (8 bài đầu)**

1.  > Cà phê đặc sản là gì? Khác gì cà phê thông thường

2.  > Arabica, Robusta, Culi, Moka: phân biệt trong 5 phút

3.  > Mức rang nhạt, vừa, đậm ảnh hưởng thế nào đến hương vị

4.  > Hướng dẫn pha phin chuẩn cho người mới

5.  > Vì sao nên mua cà phê theo ngày rang?

6.  > Bảo quản cà phê hạt đúng cách tại nhà

7.  > Hành trình một hạt cà phê từ Cầu Đất đến tách của bạn

8.  > Cold brew tại nhà trong 3 bước

### **10.8. Tài khoản mẫu để demo**

| **Vai trò** | **Email**              | **Mật khẩu**   |
| ----------- | ---------------------- | -------------- |
| Admin       | admin@suongmai.example | (đặt khi seed) |
| Nhân viên   | staff@suongmai.example | (đặt khi seed) |
| Khách hàng  | khach@suongmai.example | (đặt khi seed) |
| Khách sỉ    | quan@suongmai.example  | (đặt khi seed) |

Seed thêm khoảng 15–20 đơn hàng mẫu với đủ trạng thái và 10–15 đánh giá để dashboard và biểu đồ không bị trống khi demo.

## **11. HÌNH ẢNH VỚI GEMINI**

### **11.1. Danh mục ảnh cần tạo**

| **Nhóm**                             | **Số lượng**        | **Tỷ lệ/Kích thước xuất** | **Ghi chú**                                                 |
| ------------------------------------ | ------------------- | ------------------------- | ----------------------------------------------------------- |
| Hero và banner                       | 3–4                 | 16:9, 1920×1080           | Sương sớm đồi cà phê; xưởng rang; tách cà phê buổi sáng     |
| Ảnh sản phẩm cà phê                  | 10 SP × 3 ảnh = 30  | 1:1, 1200×1200            | Túi **trơn**, đặt trên gỗ; 1 ảnh chính, 1 ảnh hạt, 1 ảnh ly |
| Dụng cụ, túi lọc, combo              | 10 sản phẩm × 2 ảnh | 1:1                       | Nền đơn giản                                                |
| Vùng nguyên liệu                     | 4–5                 | 3:2, 1200×800             | Đồi cà phê từng vùng                                        |
| Quy trình                            | 4                   | 3:2                       | Hái, sơ chế, rang, đóng gói                                 |
| Blog                                 | 8                   | 3:2                       | Mỗi bài một ảnh bìa                                         |
| Avatar/chân dung (đánh giá, đội ngũ) | 6–8                 | 1:1                       | Chỉ dùng người hư cấu, không giống người thật nổi tiếng     |
| Brew Lab                             | 6                   | 1:1 hoặc 4:3              | Minh họa mỗi cách pha                                       |

### **11.2. Bộ prompt mẫu (giữ nguyên "phong cách chủ" để ảnh đồng nhất)**

**Đoạn phong cách dùng chung (dán vào mọi prompt):**

> *warm natural morning light, soft shadows, shallow depth of field, earthy palette of espresso brown, cream and moss green, minimal composition, premium specialty coffee brand photography, clean wooden table, no text, no logo, no watermark, high detail*

**Mẫu theo loại:**

  - > **Hero:** Misty coffee plantation hills in Da Lat at sunrise, rows of coffee trees with red cherries in the foreground, golden light through fog, 16:9, \[đoạn phong cách\]

  - > **Túi sản phẩm (trơn):** A matte kraft coffee bag with a blank cream-colored label, standing on a rustic wooden table, a few roasted coffee beans scattered around, soft window light, square 1:1, \[đoạn phong cách\]

  - > **Hạt cà phê:** Close-up of freshly roasted medium coffee beans in a ceramic bowl, steam, macro, \[đoạn phong cách\]

  - > **Dụng cụ:** A ceramic V60 dripper with a paper filter on a glass server, pour-over in progress, 1:1, \[đoạn phong cách\]

### **11.3. Quy tắc để ảnh dùng được**

1.  > **Không để AI vẽ chữ/logo.** Tạo túi trơn, rồi dán nhãn và logo thiết kế riêng (Canva/Figma) để 10 sản phẩm đồng nhất.

2.  > **Khóa phong cách:** dùng đúng một đoạn phong cách và cùng tỷ lệ cho cùng nhóm ảnh; tạo cả loạt trong một phiên trò chuyện để giữ nhất quán.

3.  > **Đặt tên file có hệ thống:** sp-cau-dat-honey-1.webp, hero-1.webp, blog-pha-phin.webp, vung-cau-dat.webp.

4.  > **Nén:** đổi sang WebP, chất lượng 75–82%; hero ≤ 300KB, ảnh sản phẩm ≤ 120KB, blog ≤ 150KB.

5.  > **Văn bản thay thế (alt)** mô tả đúng nội dung từng ảnh.

6.  > **Ghi chú trong báo cáo:** hình ảnh minh họa được tạo bằng công cụ AI, thương hiệu và sản phẩm là giả định.

7.  > Chuẩn bị sẵn **ảnh dự phòng** (placeholder xám + logo) để trang không vỡ khi thiếu ảnh.

## **12. KẾ HOẠCH TRIỂN KHAI VỚI ANTIGRAVITY**

### **12.1. Nguyên tắc làm việc với agent**

1.  > **Cho agent đọc docs/SPEC.md trước**, sau đó yêu cầu nó tóm tắt lại hiểu biết và liệt kê điểm chưa rõ **trước khi viết code**.

2.  > **Chia nhỏ theo Milestone** dưới đây; mỗi lần chỉ giao một milestone kèm tiêu chí nghiệm thu.

3.  > **Làm CSDL trước:** yêu cầu tạo schema.sql và seed.sql đúng Mục 8 và Mục 10, chạy thử trên XAMPP.

4.  > **Bắt buộc giữ nguyên:** design token ở 5.2, cấu trúc thư mục ở 7.2, quy tắc nghiệp vụ BR-xx, quy ước JSON ở 6.4.

5.  > **Sau mỗi milestone:** chạy thử luồng chính bằng tay, ghi lại lỗi, rồi mới sang milestone kế tiếp.

6.  > Nếu agent đề xuất thêm thư viện hoặc đổi kiến trúc, **xem xét lại** có phù hợp với kiến thức của nhóm và với việc giải thích trong báo cáo không.

**Câu mở đầu mẫu:**

> *"Hãy đọc toàn bộ docs/SPEC.md. Đây là website thương mại điện tử Sương Mai Coffee Roasters dùng PHP thuần (MVC), MySQL, HTML/CSS/JS. Hãy tóm tắt kiến trúc bạn sẽ dùng, liệt kê điểm chưa rõ, rồi bắt đầu Milestone 0: dựng khung dự án, tạo database/schema.sql và seed.sql theo Mục 8 và 10. Không làm các milestone sau khi tôi chưa duyệt."*

### **12.2. Các Milestone**

| **MS**  | **Nội dung**                                                                                                                            | **Kết quả cần có (nghiệm thu)**                                       | **Ưu tiên** |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------- |
| **M0**  | Khung dự án, router, .htaccess, kết nối PDO, layout chung, tokens.css, schema.sql, seed.sql                                             | Mở / hiển thị layout rỗng; import SQL thành công; có dữ liệu mẫu      | Bắt buộc    |
| **M1**  | Header/footer, trang chủ, trang tĩnh (Câu chuyện, Liên hệ, FAQ, Chính sách), form liên hệ lưu CSDL                                      | Trang chủ đúng 5.5; responsive; gửi liên hệ lưu được                  | Bắt buộc    |
| **M2**  | Đăng ký/đăng nhập/đăng xuất, phân quyền, hồ sơ, sổ địa chỉ, CSRF                                                                        | Đăng ký rồi đăng nhập được; khách không vào được /admin; form có CSRF | Bắt buộc    |
| **M3**  | Cửa hàng (lọc, sắp xếp, tìm kiếm), chi tiết sản phẩm (biến thể, kiểu xay, Flavor Radar, đánh giá hiển thị)                              | Lọc đúng; chọn biến thể đổi giá; radar hiển thị                       | Bắt buộc    |
| **M4**  | Giỏ hàng AJAX + mini-cart, mã giảm giá, gộp giỏ khi đăng nhập                                                                           | Thêm/sửa/xóa mượt; tính tiền đúng BR-03–05                            | Bắt buộc    |
| **M5**  | Checkout, tạo đơn bằng transaction, trừ kho, trang thành công, lịch sử đơn, timeline, hủy đơn, email (nếu có)                           | Đặt hàng COD và chuyển khoản; kho giảm đúng; hủy hoàn kho             | Bắt buộc    |
| **M6**  | Admin lõi: dashboard, sản phẩm + biến thể + ảnh, danh mục, đơn hàng (đổi trạng thái, in phiếu), kho, người dùng, mã giảm giá            | Admin xử lý trọn vẹn một đơn từ *Chờ xác nhận* đến *Hoàn tất*         | Bắt buộc    |
| **M7**  | **Quiz + Flavor Radar** (U1, U2)                                                                                                        | Làm quiz ra 3 gợi ý đúng thuật toán BR-10                             | Điểm nhấn   |
| **M8**  | **Lô rang + độ tươi** (U3), trang /lo-rang/…                                                                                            | Trang sản phẩm có nhãn tươi; trang lô hiển thị đúng                   | Điểm nhấn   |
| **M9**  | **Brew Lab** (U5)                                                                                                                       | Chọn phương pháp, máy tính tỷ lệ, bộ đếm giờ                          | Điểm nhấn   |
| **M10** | Blog, đánh giá + duyệt, yêu thích, bản tin                                                                                              | Viết/duyệt/hiển thị đánh giá; blog hoạt động                          | Nên có      |
| **M11** | **Gói đăng ký** (U6)                                                                                                                    | Tạo, tạm dừng, bỏ qua, hủy; admin sinh đơn kỳ này                     | Điểm nhấn   |
| **M12** | **Báo giá sỉ** (U7)                                                                                                                     | Gửi yêu cầu → lập báo giá → chấp nhận → thành đơn                     | Nên có      |
| **M13** | Hoàn thiện: animation, splash, 404, SEO cơ bản, tối ưu ảnh, kiểm thử toàn bộ, thanh toán online mô phỏng, tích điểm (nếu còn thời gian) | Chạy qua toàn bộ kịch bản kiểm thử ở Mục 13                           | Hoàn thiện  |

**Gợi ý ưu tiên khi thiếu thời gian:** M0–M6 là **bộ khung bắt buộc** (website đã bán hàng được). Sau đó ưu tiên **M7, M8** (độc đáo mà dễ làm), rồi M11, M9, M12, M10. Bỏ cổng VNPay thật nếu chậm, thay bằng trang mô phỏng.

## **13. KIỂM THỬ VÀ NGHIỆM THU**

### **13.1. Kịch bản kiểm thử chính**

| **\#** | **Kịch bản**                                               | **Kết quả mong đợi**                                          |
| ------ | ---------------------------------------------------------- | ------------------------------------------------------------- |
| T01    | Khách vãng lai thêm 2 sản phẩm khác kiểu xay, mở mini-cart | Hiển thị 2 dòng riêng, tạm tính đúng                          |
| T02    | Đơn tạm tính 480.000đ, sau đó thêm sản phẩm lên 520.000đ   | Phí ship từ 30.000đ → 0đ (BR-03)                              |
| T03    | Áp WELCOME10 cho đơn 300.000đ                              | Giảm 30.000đ; áp lần hai bị từ chối nếu không phải đơn đầu    |
| T04    | Đặt số lượng vượt tồn kho                                  | Báo lỗi, không tạo đơn                                        |
| T05    | Đặt hàng COD thành công                                    | Có mã SM-YYMMDD-NNNN, kho giảm, lịch sử có trạng thái pending |
| T06    | Hủy đơn ở trạng thái *Đã xác nhận*                         | Kho hoàn lại, đơn cancelled                                   |
| T07    | Cố hủy đơn *Đang giao*                                     | Bị chặn                                                       |
| T08    | Admin đổi trạng thái nhảy cóc (pending → shipping)         | Bị chặn                                                       |
| T09    | Truy cập /admin bằng tài khoản khách                       | Chuyển hướng/403                                              |
| T10    | Gửi form không có CSRF token                               | Bị từ chối                                                    |
| T11    | Nhập \<script\>alert(1)\</script\> vào ô đánh giá/liên hệ  | Hiển thị dạng văn bản, không thực thi                         |
| T12    | Nhập ' OR 1=1 -- ở ô tìm kiếm/đăng nhập                    | Không lỗi, không lọt                                          |
| T13    | Làm quiz với đáp án thiên về "chua thanh, hoa, không sữa"  | Sản phẩm số 2, 8, 1 đứng đầu                                  |
| T14    | Sản phẩm có lô rang 5 ngày trước                           | Hiển thị "Rất tươi" và "Ngon nhất đến" = ngày rang + 30       |
| T15    | Tạo gói 2 tuần, bỏ qua kỳ tới                              | next\_delivery\_date tăng 14 ngày                             |
| T16    | Chấp nhận báo giá hết hạn                                  | Bị từ chối                                                    |
| T17    | Giao diện ở 375px                                          | Không tràn ngang; menu hamburger hoạt động                    |
| T18    | Đăng nhập khi giỏ khách vãng lai đã có hàng                | Giỏ được gộp, không mất, không nhân đôi                       |

### **13.2. Tiêu chí nghiệm thu chung**

  - > Toàn bộ chức năng ưu tiên **M** hoạt động đúng, không lỗi nghiêm trọng.

  - > Không có đường dẫn chết (404) trong menu và footer.

  - > Không có lỗi PHP/JS hiện ra màn hình hoặc console khi chạy các kịch bản chính.

  - > Giao diện đúng design token, đồng nhất giữa các trang, không vỡ ở 375px và 1440px.

  - > Có thể dựng lại toàn bộ hệ thống từ schema.sql + seed.sql trên máy mới trong dưới 10 phút.

## **14. RỦI RO VÀ PHƯƠNG ÁN GIẢM THIỂU**

| **Rủi ro**                                                            | **Mức độ** | **Giảm thiểu**                                                              |
| --------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| Phạm vi quá lớn, không kịp                                            | Cao        | Làm theo Milestone, ưu tiên M0–M6, cắt C/S đầu tiên                         |
| Agent sinh code khó hiểu, thành viên không giải thích được khi bảo vệ | Trung bình | Giữ MVC đơn giản, bắt agent bình luận; mỗi thành viên đọc và nắm một module |
| Ảnh AI không đồng nhất                                                | Trung bình | Dùng đoạn phong cách chung; túi trơn + nhãn dán riêng (Mục 11.3)            |
| Hosting miễn phí hạn chế (SMTP, thư viện, giới hạn tài nguyên)        | Trung bình | Demo chính trên localhost; chỉ deploy khi cần và đã kiểm thử                |
| Cổng thanh toán sandbox chậm duyệt                                    | Trung bình | Chuẩn bị trang thanh toán mô phỏng thay thế                                 |
| Mâu thuẫn code khi nhiều người làm                                    | Cao        | Dùng Git với nhánh riêng cho từng module; nhóm trưởng gộp                   |
| Lỗi bảo mật cơ bản                                                    | Trung bình | Kiểm tra theo bảng T09–T12; dùng PDO, CSRF, escape đầu ra                   |
| Dữ liệu demo trống khiến dashboard xấu                                | Thấp       | Seed đơn hàng, đánh giá mẫu (Mục 10.8)                                      |

## **15. ÁNH XẠ SANG BÁO CÁO (5 MỤC YÊU CẦU)**

| **Mục yêu cầu của đề bài**                                      | **Lấy nội dung từ**                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **1. Lý do xây dựng website, đơn vị sở hữu, người sử dụng**     | Mục 1.1, 1.2, 1.5, 1.6                                                                |
| **2. Yêu cầu về nội dung, chức năng, giao diện**                | Mục 1.7, 2 (chức năng), 3 (nghiệp vụ), 4 (phi chức năng), 5.1–5.2 (yêu cầu giao diện) |
| **3. Thiết kế nội dung, chức năng, giao diện, mô hình dữ liệu** | Mục 5 (giao diện), 6 (sitemap), 7 (kiến trúc), 8 (CSDL + ERD), 9 (luồng nghiệp vụ)    |
| **4. Ngôn ngữ lập trình, demo các phần đã cài đặt**             | Mục 7.1 (công nghệ), 12 (các milestone), ảnh chụp màn hình từng module                |
| **5. Đánh giá kết quả và kết luận**                             | Mục 13 (kiểm thử, nghiệm thu), 14 (rủi ro), đối chiếu mục tiêu 1.3                    |

**Sơ đồ nên vẽ cho báo cáo:** Use case tổng quát (theo 5 vai trò ở 1.5); ERD (8.1, vẽ lại bằng draw.io); sơ đồ trạng thái đơn hàng (9.1); sơ đồ hoạt động luồng đặt hàng (9.2); sơ đồ tuần tự cho đăng ký gói (9.5) và Quiz (9.4); sơ đồ kiến trúc MVC (7.2); sitemap (6).

**Kết cấu báo cáo gợi ý:** Lời mở đầu · Chương 1 (Tổng quan, mục 1) · Chương 2 (Phân tích yêu cầu, mục 2) · Chương 3 (Thiết kế, mục 3) · Chương 4 (Cài đặt và demo, mục 4) · Chương 5 (Đánh giá và kết luận, mục 5) · Phụ lục (biên bản họp, bảng điểm thành viên).

*Hết tài liệu. Mọi thông tin về thương hiệu, sản phẩm, số liệu và địa chỉ trong tài liệu này đều là giả định phục vụ mục đích học tập.*
