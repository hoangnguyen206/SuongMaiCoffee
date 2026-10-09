# CLAUDE.md — Sương Mai Coffee Roasters

## 1. Mục đích và cách đọc tài liệu

Đây là repository của website thương mại điện tử Sương Mai Coffee Roasters. Làm việc theo chế độ **CODE-FIRST** để hoàn thiện MVP nhanh và nhất quán với code hiện có.

Trước khi thay đổi, đọc các tài liệu cần thiết cho task:

1. Đọc file này.
2. Đọc phần liên quan trong `docs/SPEC.md` và `docs/PRD.md`.
3. Đọc `docs/API_CONTRACT.md`, `docs/database-schema-proposal.md` hoặc tài liệu kỹ thuật khác khi cần hiểu chức năng.
4. Đọc `docs/DECISIONS.md` và `docs/PROGRESS.md` để lấy bối cảnh, không coi sign-off, phase hoặc trạng thái trong đó là điều kiện chặn code.

Nếu tài liệu thiếu chi tiết, tự chọn default đơn giản, nhất quán với code hiện có và ghi assumption ngắn trong báo cáo cuối. Chỉ dừng khi có nguy cơ mất dữ liệu, tác động production, lộ secret, quyền nguy hiểm hoặc thay đổi phạm vi lớn.

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

`docs/PROGRESS.md` là báo cáo tiến độ tham khảo, không phải gate chặn implementation. Cập nhật khi task đã có thay đổi và evidence phù hợp; không dừng code chỉ vì phase hoặc milestone còn `Todo`, `In progress` hay `Blocked`.

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

## 6. CODE-FIRST

Có thể triển khai trực tiếp MVP và các phần cần thiết để chạy bài tập trên lớp, gồm migration, seed, API, backend, frontend, route và test. Không dùng phase/gate P1/P2/P3, sign-off tài liệu, view contract hoặc trạng thái `PROGRESS.md` làm điều kiện chặn code.

Không cần xin phép cho từng task hoặc file. Tự quyết các chi tiết kỹ thuật nhỏ theo default đơn giản, nhất quán với code hiện có và SPEC/PRD. Không mở rộng sang tính năng ngoài MVP nếu chưa được yêu cầu.

Chỉ dừng hoặc hỏi lại khi thao tác có thể làm mất dữ liệu, kết nối production/Render, lộ hoặc ghi secret, thay đổi quyền nguy hiểm, phá worktree của người khác, hoặc mở rộng phạm vi lớn. Không dùng code để thay thế các quyết định về an toàn dữ liệu và production.

## 7. Ownership và an toàn thay đổi

**Frontend sở hữu:** templates, styles/CSS, JavaScript UI, assets/placeholders và UI rendering states.

**Backend sở hữu:** routes, controllers, services, persistence/schema/migrations, validation và business logic.

Giữ ownership rõ ràng và tránh hai worktree cùng sửa một shared file khi có thể. Có thể sửa các file liên quan trong cùng task khi cần để hoàn thiện chức năng; không cần approval riêng cho từng file. Không tạo branch/worktree, cài package, commit hoặc push nếu chưa được yêu cầu/cho phép.

## 8. Cách thực hiện task

Trước khi ghi file hoặc thực hiện thay đổi, nêu ngắn trong tiến trình:

1. File dự kiến tạo/sửa.
2. Nội dung và assumption chính.
3. Lệnh/thao tác dự định.
4. Rủi ro và kiểm thử dự kiến.

Có thể tiếp tục với default hợp lý; không dừng để hỏi sign-off tài liệu, phase, proposal hoặc approval cho từng file/task. Chỉ thay đổi đúng phạm vi user yêu cầu và các file phụ thuộc trực tiếp cần thiết để hoàn thành.

## 9. Bảo mật và dữ liệu

- Không ghi password, session secret, token hoặc thông tin nhạy cảm vào log.
- Cấu hình/secret không được đặt trong public document root hoặc commit secret thật.
- Upload phải kiểm MIME, extension và kích thước; dùng tên file ngẫu nhiên.
- Guest order lookup phải tránh enumeration và tuân theo rate limit đã duyệt.
- Không suy diễn hành vi xóa/cascade; tuân theo data model được duyệt.

## 10. Kiểm thử và báo cáo

Dùng `docs/TEST_PLAN.md` để chọn test acceptance liên quan khi có thể. Nếu chưa chạy được test, ghi `Not run`/`Blocked` và lý do; không báo pass giả.

Khi hoàn tất, báo file thay đổi, nội dung chính, test chạy/kết quả, test chưa chạy, assumption và residual blocker. Cập nhật `docs/PROGRESS.md` khi phù hợp; không để trạng thái hoặc thiếu sign-off trong tài liệu chặn implementation.
