# CLAUDE.md — Sương Mai Coffee Roasters

## 1. Mục đích và thứ tự đọc

Đây là repository của website thương mại điện tử Sương Mai Coffee Roasters. Trước khi thay đổi tài liệu hoặc code:

1. Đọc file này.
2. Đọc `docs/SPEC.md`.
3. Đọc contract liên quan nếu đã tồn tại.
4. Kiểm tra `docs/PROGRESS.md` để xác nhận task/milestone được phép làm.
5. Kiểm tra `docs/DECISIONS.md` để biết quyết định hiện hành.

Nếu thiếu tài liệu nền, phát hiện mâu thuẫn hoặc chưa rõ yêu cầu, báo blocker và chờ quyết định; không tự suy diễn thành code.

## 2. Tài liệu chuẩn

Khi có mâu thuẫn, áp dụng theo thứ tự:

1. Quyết định được duyệt trong `docs/DECISIONS.md`.
2. `docs/SPEC.md`.
3. Contract đã được duyệt và tồn tại trong repository.
4. `docs/PRD.md`.
5. `docs/PLAN.md`.
6. File nguồn trong `docs/source/`.

File nguồn trong `docs/source/` là bất biến: không sửa, đổi tên hoặc di chuyển. `docs/PROGRESS.md` là nguồn duy nhất cho trạng thái tiến độ; không sao chép trạng thái động sang tài liệu khác.

## 3. Trạng thái dự án

Task/milestone dùng đúng một trong các trạng thái:

- `Todo`
- `In progress`
- `Blocked`
- `Done`

Chỉ ghi `Done` khi có evidence và test phù hợp. Cập nhật owner, worktree, phụ thuộc, kiểm thử gần nhất và ngày cập nhật trong `docs/PROGRESS.md`.

## 4. Phạm vi MVP

MVP gồm M0–M6, các chức năng đã chọn `FR-CT-05`, `FR-OR-05`, `FR-CN-07`, `FR-AD-12`, và dữ liệu roast batch tối thiểu cho `FR-CT-06`.

Không tự đưa vào MVP: Subscription, wholesale end-to-end, full Quiz/Brew Lab, blog, review, wishlist, newsletter, online payment, loyalty ngoài phạm vi được duyệt, hoặc full roast-batch management. Không tạo trước schema 39 bảng.

Dashboard Subscription phải hiển thị `Chưa triển khai` hoặc empty state rõ ràng; không seed số liệu giả. Asset/nội dung chưa được duyệt phải dùng placeholder có nhãn `PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC.`

## 5. Quyết định và quy tắc kỹ thuật bắt buộc

- PostgreSQL là DBMS duy nhất; không hỗ trợ đồng thời MySQL/MariaDB.
- PHP là backend; không tự đổi sang Node.js, MongoDB hoặc MySQL.
- Tiền lưu/tính bằng số nguyên VND, không dùng số thực.
- Backend enforce session, authentication, role, permission và CSRF; ẩn/disable UI không thay thế authorization.
- Password dùng `password_hash()`; truy vấn dùng prepared statements; output phải được escape; regenerate session ID sau login.
- Login failure limit: 5 lần/15 phút.
- Checkout gồm ba bước riêng: giao hàng → vận chuyển/thanh toán → xác nhận.
- Pricing order: giá hàng → subscription discount (chỉ khi module bật) → coupon → điểm (chỉ khi được triển khai) → shipping.
- Phần trăm discount làm tròn xuống đến đồng; fixed coupon không vượt eligible merchandise; coupon mặc định cộng dồn với subscription trừ khi điều kiện loại trừ.
- Điểm đổi tối đa 20% tiền hàng sau subscription/coupon và trước shipping, nếu loyalty được bật.
- Cart line identity là `(variant_id, grind_option_id)`; tối đa 20 sản phẩm mỗi dòng.
- Order creation là một transaction; order item giữ snapshot; mỗi status transition được ghi lịch sử; cancel hợp lệ phải hoàn tồn chính xác một lần.
- Không suy ra tồn batch từ `produced_qty_g`; quan hệ batch–variant–inventory phải được duyệt.
- Freshness +30 là mốc thưởng thức ngon nhất, không phải hạn an toàn; không dùng nhãn “Còn tốt” đến ngày +45; sau +30 chỉ thông báo đã qua mốc thưởng thức ngon nhất.

## 6. Gate P1

Trước khi P1 contracts được duyệt, không tạo migration, schema triển khai, schema-dependent seed, business route/controller/service hoặc code nghiệp vụ. Không chốt bằng code các điểm còn mở về schema, quyền, API, view, PostgreSQL version, coupon redemption, batch/inventory, search hoặc guest lookup.

Nếu phát hiện công việc yêu cầu thay đổi schema, API, permission, MVP scope hoặc ownership, dừng phần phụ thuộc và xin duyệt trước.

## 7. Ownership

**Frontend sở hữu:** templates, styles/CSS, JavaScript UI, assets/placeholders và UI rendering states.

**Backend sở hữu:** routes, controllers, services, persistence/schema/migrations, validation và business logic.

**Tech lead sở hữu/duyệt:** canonical docs và shared contracts; thay đổi ownership chéo, shared route/config/layout hoặc contract dùng chung.

Không để hai worktree cùng sửa một shared file khi chưa có owner/approval rõ ràng. Không tạo branch/worktree, cài package, commit hoặc push nếu chưa được yêu cầu/duyệt.

## 8. Cách thực hiện task

Trước khi ghi file hoặc thực hiện thay đổi, nêu:

1. File sẽ tạo/sửa.
2. Nội dung dự kiến.
3. Quyết định đã chốt có liên quan.
4. Điểm còn mở.
5. Lệnh/thao tác dự định.
6. Rủi ro và kiểm thử dự kiến.

Chỉ thay đổi đúng các file đã được người dùng duyệt. Không tạo code/migration/seed khi yêu cầu chỉ là tài liệu.

## 9. Bảo mật và dữ liệu

- Không ghi password, session secret, token hoặc thông tin nhạy cảm vào log.
- Cấu hình/secret không được đặt trong public document root hoặc commit secret thật.
- Upload phải kiểm MIME, extension và kích thước; dùng tên file ngẫu nhiên.
- Guest order lookup phải tránh enumeration và tuân theo rate limit đã duyệt.
- Không suy diễn hành vi xóa/cascade; tuân theo data model được duyệt.

## 10. Kiểm thử và báo cáo

Dùng `docs/TEST_PLAN.md` để chọn test acceptance liên quan. Nếu chưa chạy được test, ghi `Not run`/`Blocked` và lý do; không báo pass hoặc chuyển task sang `Done` khi thiếu evidence.

Khi hoàn tất, báo file thay đổi, nội dung chính, test chạy/kết quả, test chưa chạy và residual blocker. Cập nhật tiến độ trong `docs/PROGRESS.md`; quyết định mới chỉ ghi vào `docs/DECISIONS.md` sau khi được duyệt.
