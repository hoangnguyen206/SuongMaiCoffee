# Browser Regression QA Checklist

Checklist thủ công độc lập cho website hiện tại. Không thay thế test contract/API trong `docs/TEST_PLAN.md`.

## Cách dùng

- **Môi trường:** ghi URL, commit/build, trình duyệt + phiên bản, ngày chạy và người chạy trước khi bắt đầu.
- **Trạng thái mỗi mục:** `Not run` (chưa chạy), `Pass`, `Fail`, hoặc `Blocked` (ghi blocker).
- Ghi evidence ngắn: URL, bước tái hiện, screenshot hoặc log DevTools. Không ghi password, session cookie, token hay PII thật.
- Chạy bằng dữ liệu demo/placeholder được cấp; không tạo dữ liệu thương hiệu chính thức để đạt trạng thái mong muốn.

| Trường | Giá trị |
|---|---|
| URL/build/commit | `____________________________` |
| Trình duyệt + phiên bản | `____________________________` |
| Viewport chạy | `375px / 1440px / khác: ______` |
| Ngày / người chạy | `____________________________` |
| Kết quả tổng | `Not run` |

## Phạm vi và giới hạn hiện tại

- **Đang có thể kiểm tra:** Catalog read-only (`/catalog/`) và Account/Auth (`/account/`): đăng ký, đăng nhập, session/profile, đổi mật khẩu, đăng xuất theo môi trường có backend.
- **Đã có smoke evidence nhưng cần chạy lại độc lập:** Catalog listing/filter/sort, suggestion có dấu, product detail, loading và responsive 390px/1440px.
- **Chưa được coi là đã kiểm chứng:** viewport 375px và shell site-wide; search không dấu, search p95; freshness boundary đầy đủ; empty state với dữ liệu/filter hợp lệ; MCP Playwright.
- **Roadmap hoặc chưa triển khai trong MVP:** cart, checkout/order, guest order lookup, admin, subscription, wholesale, Quiz/Brew Lab, blog, review, wishlist, newsletter, online payment và loyalty. Đánh dấu `Blocked — chưa triển khai`, không coi là lỗi regression.
- Empty/error Catalog trước đây có một phần **mock-only**; chỉ đánh dấu `Pass` khi đã chạy bằng trạng thái backend/dữ liệu hợp lệ, không chỉ bằng response giả lập.
- `/favicon.ico` từng trả 404 trong smoke evidence. Xác nhận lại trên build hiện tại; không suy ra `Pass` chỉ vì có file placeholder SVG.

## 1. Preflight và baseline

- [ ] `Not run` — Mở `/`, `/catalog/` và `/account/`; không bị redirect bất ngờ hoặc blank page.
- [ ] `Not run` — Hard reload từng trang; CSS và JavaScript tải thành công.
- [ ] `Not run` — DevTools Console/Network đã mở để ghi lỗi trong suốt lần chạy.
- [ ] `Not run` — Ghi lại lỗi đã biết trước khi test để phân biệt lỗi mới và lỗi tồn tại.

## 2. Catalog read-only

### Listing, filter và sort

- [ ] `Not run` — `/catalog/` hiển thị heading, ghi chú placeholder, trạng thái tải rồi danh sách sản phẩm hoặc empty state có giải thích.
- [ ] `Not run` — Mỗi card có tên, thông tin/giá phù hợp và thao tác mở chi tiết; placeholder được gắn nhãn rõ ràng.
- [ ] `Not run` — Chọn **Danh mục** lọc đúng; bỏ lọc trả về trạng thái danh sách phù hợp.
- [ ] `Not run` — Chọn **Vùng trồng** lọc đúng; kết hợp với danh mục không làm mất filter âm thầm.
- [ ] `Not run` — Đổi **Sắp xếp** sang mới nhất, giá tăng dần, giá giảm dần; thứ tự hiển thị đúng và không lỗi console.
- [ ] `Not run` — Khi filter không có kết quả, hiển thị empty state hữu ích; nếu chỉ có mock response thì ghi `Blocked — mock-only`.

### Search và product detail

- [ ] `Not run` — Query rỗng hoặc dưới 2 ký tự không gửi request suggestion không cần thiết; hint tối thiểu 2 ký tự hiển thị đúng.
- [ ] `Not run` — Query tiếng Việt có dấu (ví dụ `cà`) trả suggestion trong giới hạn đã duyệt và mở được product detail.
- [ ] `Not run` — Query tương đương không dấu; hiện chưa có acceptance được chốt, chỉ ghi kết quả quan sát, không đánh dấu Pass theo giả định.
- [ ] `Not run` — Suggestion đóng/mở hợp lý khi click ra ngoài; không che hoặc làm mất focus của input.
- [ ] `Not run` — Mở chi tiết sản phẩm hiển thị thông tin variant/batch tối thiểu đang có; nút quay lại trả về listing và không tạo full page reload ngoài dự kiến.
- [ ] `Not run` — Kiểm tra freshness ở ngày 5, ngày 21, đúng +30 và sau +30 nếu fixture được cung cấp; không có nhãn an toàn thực phẩm hoặc “Còn tốt” sau +30.
- [ ] `Not run` — Loading, lỗi mạng và lỗi server có message/action hữu ích; không để vùng nội dung trắng.

### Catalog network sanity

- [ ] `Not run` — Request categories/origins/products/suggestions/detail trả status và envelope phù hợp với API đang chạy; không có request trùng do một thao tác.
- [ ] `Not run` — Không có 5xx, request treo bất thường, mixed-content, CORS hoặc JSON parse error trong luồng bình thường.
- [ ] `Not run` — Không có giá trị giá/tổng tiền do client tự tin tưởng; ghi `Not applicable` cho slice read-only nếu chưa có luồng giá mua hàng.

## 3. Account/Auth

### Trạng thái chưa đăng nhập và form

- [ ] `Not run` — `/account/` ở trạng thái guest hiển thị tab Đăng nhập và Tạo tài khoản; panel profile không lộ dữ liệu.
- [ ] `Not run` — Chuyển tab bằng click; chỉ form được chọn hiện ra, heading/status cập nhật đúng, không mất nội dung đã nhập ngoài dự kiến.
- [ ] `Not run` — Submit rỗng, email sai định dạng, số điện thoại/mật khẩu thiếu hoặc mật khẩu dưới 8 ký tự bị chặn với thông báo có thể hiểu.
- [ ] `Not run` — Đăng ký dữ liệu hợp lệ trong môi trường test tạo được tài khoản và không hiển thị password/token trong UI, Console hoặc Network log.
- [ ] `Not run` — Email đã tồn tại và credential sai có lỗi trung tính, không làm lộ thông tin tài khoản ngoài policy đã duyệt.
- [ ] `Not run` — Năm lần đăng nhập sai trong 15 phút: nếu environment hỗ trợ kiểm tra, xác nhận throttle/lock; nếu chưa có fixture hoặc approval, ghi `Blocked — security acceptance chưa chạy`.

### Session và profile sau đăng nhập

- [ ] `Not run` — Đăng nhập hợp lệ chuyển sang profile; tên/email/role hiển thị đúng dữ liệu test và không lộ field ngoài quyền.
- [ ] `Not run` — Reload trang và mở lại `/account/`; session giữ đúng trạng thái hoặc hết hạn theo policy, không hiển thị profile tạm cũ.
- [ ] `Not run` — Cập nhật họ tên/số điện thoại hợp lệ rồi reload; dữ liệu lưu đúng. Dữ liệu không hợp lệ bị từ chối rõ ràng.
- [ ] `Not run` — Đổi mật khẩu yêu cầu mật khẩu hiện tại; mật khẩu mới hợp lệ lưu được, sai mật khẩu hiện tại không làm thay đổi tài khoản.
- [ ] `Not run` — Đăng xuất xóa trạng thái authenticated; reload không còn profile và không gọi API protected thành công.
- [ ] `Not run` — Sau login, session ID được thay đổi và cookie flags phù hợp; kiểm tra ở Application/Network nếu environment cho phép, không ghi giá trị cookie vào evidence.
- [ ] `Not run` — Write request Auth bị thiếu/đổi CSRF token bị server từ chối; nếu chưa có cách kiểm tra an toàn ở environment, ghi `Blocked` thay vì bỏ qua.

### Auth network/error sanity

- [ ] `Not run` — Register/login/logout/session/profile/password gọi đúng endpoint/method; không gửi password qua query string.
- [ ] `Not run` — Loading state ngăn submit lặp; lỗi 4xx/5xx hiển thị message hữu ích và không làm mất session hợp lệ ngoài dự kiến.
- [ ] `Not run` — Không có response/log chứa password, session secret, token hoặc dữ liệu PII không cần thiết.

## 4. Responsive — chạy riêng ở 375px và 1440px

### 375px (bắt buộc, chưa được xác minh)

- [ ] `Not run` — Catalog, Account, 404 và 500 không có horizontal scroll; không bị cắt heading, form, button, status hoặc footer.
- [ ] `Not run` — Header/nav và link skip hoạt động; không có phần tử bị che hoặc chạm khó trên màn hình hẹp.
- [ ] `Not run` — Catalog toolbar chuyển thành layout dùng được; select, suggestion và product detail không tràn viewport.
- [ ] `Not run` — Auth tab, input, validation/status và button đọc/nhấn được; không zoom hoặc gõ bị mất focus bất ngờ.
- [ ] `Not run` — Ảnh/placeholder, card và text không vượt container; kiểm tra cả landscape nếu layout có breakpoint khác.

### 1440px

- [ ] `Not run` — Nội dung nằm trong container, không bị kéo quá rộng; catalog grid, detail và auth panel cân đối.
- [ ] `Not run` — Không có khoảng trống bất thường, overlap, fixed element che CTA hoặc footer bị đẩy sai.
- [ ] `Not run` — Chạy lại một luồng Catalog và một luồng Auth hoàn chỉnh tại viewport này; không chỉ kiểm tra visual tĩnh.

## 5. Keyboard, focus và form labels

- [ ] `Not run` — Từ đầu trang, `Tab` tới skip link; kích hoạt skip link đưa focus tới main content.
- [ ] `Not run` — Có thể hoàn thành Catalog filter/search/detail và Auth login/register/profile/logout chỉ bằng keyboard.
- [ ] `Not run` — Tab order logic, không kẹt trong hidden form/details/suggestion; `Enter`/`Space` kích hoạt control đúng.
- [ ] `Not run` — Mọi focusable control có focus-visible rõ ở nền sáng/tối; không dựa chỉ vào màu hover.
- [ ] `Not run` — Mỗi input/select có accessible name đọc được từ label (đặc biệt login/register/profile/password); label không bị mất khi đổi tab.
- [ ] `Not run` — Error/status được đọc bởi screen reader hoặc live region phù hợp; focus được đưa tới nơi cần sửa khi submit lỗi.
- [ ] `Not run` — Tắt/giảm motion theo `prefers-reduced-motion` không làm mất nội dung hoặc thao tác.

## 6. 404, 500 và an toàn lỗi

- [ ] `Not run` — Mở route không tồn tại; trang 404 có mã/heading, link về trang chủ và cửa hàng, skip link và focus visible.
- [ ] `Not run` — Network response của route không tồn tại là 404; không chỉ render nội dung 404 với status 200.
- [ ] `Not run` — Dùng cơ chế lỗi được duyệt ở staging để tạo 500; trang có message/action hữu ích và không có stack trace, path nội bộ, secret hoặc PII.
- [ ] `Not run` — Network response của lỗi server là 500; không lộ chi tiết exception trong Console/UI production-like.
- [ ] `Not run` — 404/500 chạy được ở 375px và 1440px, link action không tạo loop hoặc 404 mới ngoài dự kiến.

## 7. Assets, Console và Network

- [ ] `Not run` — Reload hard toàn bộ URL đã test; không có 404/403 cho HTML, CSS, JS, font, favicon hoặc placeholder asset ngoài lỗi đã biết.
- [ ] `Not run` — Xác nhận riêng `/favicon.ico` và `/favicon.svg`; nếu còn lỗi favicon đã biết, ghi issue/evidence, không che bằng cách tắt Console.
- [ ] `Not run` — Console không có uncaught exception, unhandled rejection, CSP/mixed-content warning hoặc lỗi accessibility do runtime.
- [ ] `Not run` — Network không có request ngoài origin/endpoint đã biết, retry loop, request chứa credential trong URL, hoặc response MIME sai.
- [ ] `Not run` — Kiểm tra request/response khi login và profile: credentials chỉ ở body HTTPS/same-origin phù hợp; không lưu secret vào localStorage.
- [ ] `Not run` — Lặp lại sau hard reload và khi throttling Fast 3G/offline: loading/error state có thể hiểu, không crash trang.

## Kết luận lần chạy

| Kết quả | Số lượng / ghi chú |
|---|---|
| Pass | `____________________________` |
| Fail | `____________________________` |
| Blocked | `____________________________` |
| Not run | `____________________________` |
| Lỗi mới cần chuyển tiếp | `____________________________` |
| Evidence links/screenshots | `____________________________` |

**Kết luận:** `Not run` — checklist này không tự cập nhật `docs/PROGRESS.md` và không biến mục chưa kiểm chứng thành acceptance.
