# Test Plan — Sương Mai Coffee Roasters

## 1. Mục tiêu và phạm vi

Test plan là baseline kiểm thử cho MVP: M0–M6, `FR-CT-05`, `FR-OR-05`, `FR-CN-07`, `FR-AD-12`, và dữ liệu roast batch tối thiểu phục vụ `FR-CT-06`.

Subscription, Wholesale, full Quiz, Brew Lab, blog, review, wishlist, newsletter, online payment và loyalty là roadmap; test của các module này không chặn MVP nếu chưa được duyệt đưa vào release.

## 2. Loại kiểm thử

| Loại | Mục đích |
|---|---|
| Unit | Business rule/validator độc lập. |
| Integration | PHP–PostgreSQL, transaction, session và persistence. |
| API | Method/path/auth/CSRF/request/response/error/status/idempotency. |
| Security | Authorization, CSRF, XSS, SQL injection, session và anti-enumeration. |
| UI/E2E | User journey, responsive view và trạng thái render. |
| Regression | Lặp acceptance test bị ảnh hưởng bởi thay đổi. |
| Deploy smoke | Configuration, PostgreSQL compatibility, health check và luồng chính. |

## 3. Quy ước trạng thái/evidence

- `Pass`: kết quả mong đợi đạt.
- `Fail`: kết quả mong đợi không đạt.
- `Blocked`: chưa chạy được do dependency/môi trường; ghi blocker.
- `Not run`: chưa chạy; không được coi là Pass.
- Evidence có thể là command/output, test report, screenshot, log hoặc CI link; ghi nguồn evidence trong `docs/PROGRESS.md`.

## 4. Ma trận traceability

| Requirement/acceptance | Test ID | Loại | Milestone | Priority |
|---|---|---|---|---|
| FR-AU-01/02, password policy | TC-AUTH-01–02 | API/Security/E2E | P5 | Must |
| FR-AU-04/05 | TC-AUTH-03–04 | API/E2E | P5 | Must |
| FR-AU-07 | TC-AUTH-05, TC-SEC-01 | Security/API | P5/P8 | Must |
| FR-AU-08, BR-15 | TC-CART-06 | Integration/E2E | P6 | Must |
| FR-CT-01–04 | TC-CAT-01–02 | API/E2E | P4 | Must |
| FR-CT-05 | TC-SEARCH-01–04 | API/UI/Performance | P4 | Selected S |
| FR-CT-06, FR-BT-01 | TC-PRODUCT-01, TC-FRESH-01–04 | API/UI/Boundary | P4 | Must; MVP batch data only, after P1 schema approval |
| FR-CA-01–04/06/07 | TC-CART-01–05 | API/Integration/E2E | P6 | Must |
| BR-01–06 | TC-PRICE-01–03 | Unit/Integration | P6/P7 | Must, applicable modules only |
| FR-CO-01–07 | TC-ORDER-01–03 | Integration/E2E | P7 | Must |
| BR-07/08/09 | TC-ORDER-04–09 | Unit/Integration/API | P7/P8 | Must |
| FR-OR-01–03 | TC-ACCOUNT-ORDER-01–03 | API/E2E | P7 | Must |
| FR-OR-05 | TC-LOOKUP-01–05 | Security/API/E2E | P7 | Selected S |
| FR-CN-01–05 | TC-CONTENT-01–04 | UI/E2E | P3 | Must |
| FR-CN-07 | TC-ERROR-01–02 | UI/Integration | P3 | Selected S |
| FR-AD-01–05/08/09 | TC-ADMIN-01–05 | API/Security/E2E | P8 | Must |
| FR-AD-12 | TC-CONFIG-01–03 | API/Security/E2E | P8 | Selected S |
| NFR-02/03 | TC-SEC-01–08 | Security/API | P5–P8 | Must |
| NFR-04/05/06 | TC-NFR-01–04 | Performance/UI/Accessibility | P3/P9 | Must |
| NFR-09 | TC-NFR-05 | Unit/UI | P2–P9 | Must |
| NFR-11/12 | TC-DB-01–03 | Integration/Deploy smoke | P2/P9 | Must |

## 4.1. Evidence thực thi Catalog slice (2026-10-07)

Các kết quả dưới đây ghi nhận slice Catalog read-only trên Docker local (PHP 8.4.26, PostgreSQL 17.11) và browser smoke bằng Chrome headless. Đây là evidence triển khai/slice, không phải sign-off API contract P1, full P4 acceptance, CI/Render compatibility hoặc MCP Playwright run. Empty/error state dùng các kỹ thuật kiểm tra riêng được ghi rõ bên dưới.

| Test/acceptance | Kết quả | Evidence và giới hạn |
|---|---|---|
| TC-CAT-01/02 — Catalog listing và dữ liệu public | Pass theo kết quả được báo cáo | Hai sản phẩm demo placeholder tải từ Catalog API/PostgreSQL; categories/origins/products HTTP 200. Không phải dữ liệu thương mại/tồn kho thật. |
| TC-CAT-01/02 — Category/origin filter và sort | Pass theo Chrome headless smoke được báo cáo | Category/origin filter và giá tăng/giảm hoạt động với dữ liệu thật. Chỉ xác minh filter/sort được implement trong slice; không xác nhận mọi filter/sort còn trong Draft API. |
| TC-PRODUCT-01 — Product detail/variants | Pass một phần theo kết quả được báo cáo | Search suggestion mở product detail và hiển thị variants. Freshness demo có batch 5 ngày; boundary acceptance TC-FRESH-01–04 chưa xác minh đầy đủ. |
| TC-SEARCH-01 — Suggestions với query có dấu | Pass theo kết quả được báo cáo | Query `cà` trả suggestions qua HTTP/API 200 và browser smoke; xác nhận luồng có dấu, không chứng minh normalization dấu/không dấu. |
| TC-SEARCH-02 — Tìm kiếm tương đương không dấu | Not run | Vietnamese diacritic normalization còn mở theo OPEN-007; không suy diễn hành vi. |
| TC-SEARCH-03 — Query rỗng/ngắn | Pass ở service/contract smoke; browser UI guard chưa được ghi nhận như test riêng | PHP Catalog contract/integration checks giới hạn query dưới 2 ký tự; acceptance cho toàn bộ normalized API behavior còn theo OPEN-007. |
| TC-SEARCH-04 — Search p95 | Not run | Chưa có fixture/profile/CI gate được duyệt; không có benchmark evidence. |
| TC-NFR-02 / responsive Catalog | Pass theo Chrome headless smoke được báo cáo | 1440px và 390px; không tràn ngang. TC-NFR-01 375px + hamburger của site-wide shell không được suy ra từ đây. |
| TC-NFR-06 — Loading state | Pass theo Chrome headless smoke được báo cáo | Loading message quan sát được trước khi response API hoàn tất. |
| TC-NFR-06 — Empty state | Mock-only | UI empty message được render khi browser smoke cung cấp mock response rỗng; chưa xác minh với filter hợp lệ trên dữ liệu PostgreSQL thật. Không tạo data mới để đạt trạng thái này. |
| TC-NFR-06 — Error state | Pass cho UI error path theo Chrome headless smoke được báo cáo | Request products bị chặn; UI hiển thị `Failed to fetch`. Đây là lỗi mạng được mô phỏng, không phải lỗi backend 5xx. |
| Browser console/network | Không có lỗi nghiêm trọng theo kết quả được báo cáo | Không runtime exception hoặc 5xx trong luồng bình thường; `/favicon.ico` trả 404 và được ghi nhận là lỗi asset đã biết. |
| TC-DB-01 — Migration/seed/integration local | Pass theo kết quả được báo cáo | Migration, demo seed và PostgreSQL integration chạy trong Docker local; không kết nối production. Integration test tạo/dọn schema riêng. |
| TC-DB-02 — PostgreSQL compatibility | Local smoke only | PostgreSQL 17 container và app health/query được báo healthy; CI, Render và version approval chưa xác minh. |
| PHP/JS/static regression smoke | Pass theo kết quả được báo cáo | PHP syntax, bootstrap smoke, Catalog contract smoke, router smoke, JavaScript syntax và `git diff --check`. |
| Playwright MCP | Chưa xác minh/chưa chạy | MCP Playwright không có kết quả chạy được xác nhận trong phiên; browser evidence là Chrome headless, không phải MCP Playwright. |

Empty/error UI smoke có dùng response rỗng giả lập và request bị chặn có chủ ý; không thay thế test với filter/data hợp lệ. Các kết quả browser, migration/seed và integration trong bảng là **theo kết quả kiểm thử được báo cáo**; không diễn giải thành acceptance toàn MVP.

## 5. MVP acceptance tests

### 5.1. Cart, pricing, coupon and merge

| ID | Scenario | Expected result | Trace |
|---|---|---|---|
| T01 / TC-CART-01 | Same variant added with two grind options | Two separate cart lines; subtotal correct | FR-CA-01–03, BR-15 |
| T02 / TC-PRICE-01 | Subtotal changes from 480,000đ to 520,000đ | Shipping changes from 30,000đ to 0đ | BR-03 |
| T03 / TC-PRICE-02 | Apply `WELCOME10` to 300,000đ eligible order | Discount 30,000đ; invalid repeat is rejected per coupon conditions | BR-04/05 |
| T04 / TC-CART-02 | Requested quantity exceeds stock | Clear validation/business error; no order created | BR-02 |
| T05 / TC-CART-03 | One line quantity exceeds 20 | Reject; never silently exceed maximum | BR-15 |
| T06 / TC-CART-04 | Guest cart merges on login | After P1 API contract approval: identity follows contract; distinct grind stays separate; conflicts reject atomically without clamp and cart remains unchanged | FR-AU-08 |
| T07 / TC-PRICE-03 | Subscription/points features are not enabled | No phantom subscription/points discount; total is deterministic | BR-05/06, MVP scope |
| T08 / TC-CART-05 | Duplicate add/update request | Result follows approved idempotency/duplicate policy; no unintended duplicate | API contract gate |

### 5.2. Checkout, orders and inventory

| ID | Scenario | Expected result | Trace |
|---|---|---|---|
| T09 / TC-ORDER-01 | Valid COD checkout | One transaction creates order, items, payment/history; `pending`; stock decremented | FR-CO-01–07 |
| T10 / TC-ORDER-02 | Valid bank-transfer checkout | Success page shows order code and approved transfer/QR instructions | FR-CO-03/06 |
| T11 / TC-ORDER-03 | Stock becomes insufficient at checkout | Transaction rolls back; no partial order; stock never negative | BR-02, FR-CO-07 |
| T12 / TC-ORDER-04 | Cancel order in `confirmed` | `cancelled`, stock restored exactly once, history recorded | FR-OR-03, BR-07 |
| T13 / TC-ORDER-05 | Cancel order in `shipping` | Rejected; order and stock unchanged | BR-07 |
| T14 / TC-ORDER-06 | Transition `pending → shipping` | Rejected as skipped transition | BR-07 |
| T15 / TC-ORDER-07 | Sequential transitions through completion | Only valid transitions accepted; each gets history | BR-07 |
| T16 / TC-ORDER-08 | COD order completed | Payment becomes `paid` per policy | BR-08 |
| T17 / TC-ORDER-09 | Retry/reload order creation | No duplicate order under approved idempotency policy | FR-CO-07 |
| T18 / TC-ORDER-10 | Product/variant changes after order | Order snapshot retains purchased labels and price | BR-16 |

### 5.3. Catalog, batch, freshness and search

| ID | Scenario | Expected result | Trace |
|---|---|---|---|
| T19 / TC-PRODUCT-01 | Product detail has an available batch | After P1 schema/API approval, show newest available batch using only MVP-minimal batch data; does not test full batch-management workflow | FR-CT-06, FR-BT-01 |
| T20 / TC-FRESH-01 | Roast date was 5 days ago | “Rất tươi”; best-enjoyed date is roast date +30 | BR-11 |
| T21 / TC-FRESH-02 | Roast date was 21 days ago | “Tươi”; no safety claim | BR-11 |
| T22 / TC-FRESH-03 | Roast date is at +30 boundary | Show approved past/at-best-enjoyed-date message | BR-11 |
| T23 / TC-FRESH-04 | Batch past +30 or unavailable | No “Còn tốt” through +45; no inventory inferred from `produced_qty_g` | BR-02/11 |
| T24 / TC-SEARCH-01 | Sufficient-length Vietnamese query with diacritics | Suggestions within approved scope and limit | FR-CT-05 |
| T25 / TC-SEARCH-02 | Equivalent query without diacritics | Run only after Vietnamese normalization behavior is approved under OPEN-007 | FR-CT-05 |
| T26 / TC-SEARCH-03 | Empty/too-short query | UI does not issue a search below the approved minimum; normalized short-query API behavior awaits OPEN-007 approval | FR-CT-05 |
| T57 / TC-SEARCH-04 | Search response latency | Benchmark only after profile/fixture/CI gate are approved; report p95 against the approved measurement scope | FR-CT-05 |

### 5.4. Guest order lookup

| ID | Scenario | Expected result | Trace |
|---|---|---|---|
| T27 / TC-LOOKUP-01 | Correct order code and phone | After field-level permission sign-off, returns only the approved allowlisted fields; never returns PII per DEC-030 | FR-OR-05 |
| T28 / TC-LOOKUP-02 | Incorrect phone | Neutral error; does not reveal whether an order exists | FR-OR-05/security |
| T29 / TC-LOOKUP-03 | Malformed order code | Validation error without data disclosure; whether malformed requests count toward the limit awaits OPEN-008 approval | FR-OR-05 |
| T30 / TC-LOOKUP-04 | Requests exceed lookup limit | Baseline 5/15m IP-hash limit and 15m cooldown; exact window/counting mechanics run after OPEN-008 sign-off | Security contract |
| T31 / TC-LOOKUP-05 | Repeated code enumeration | Neutral mismatch and approved baseline rate limit enforced server-side; trusted-proxy/store-failure mechanics after OPEN-008 sign-off | Security contract |

### 5.5. Authentication and security

| ID | Scenario | Expected result | Trace |
|---|---|---|---|
| T32 / TC-SEC-01 | Customer opens admin endpoint | 403/redirect per contract; no admin data returned | FR-AU-07 |
| T33 / TC-SEC-02 | Staff changes role/config/pricing policy without permission | Rejected server-side | Permission matrix |
| T34 / TC-SEC-03 | Write POST/AJAX lacks CSRF token | Rejected; no data mutation | NFR-02 |
| T35 / TC-SEC-04 | Five failed logins within 15 minutes | Login throttling/lock behavior follows approved policy | NFR-03 |
| T36 / TC-SEC-05 | Successful login | Session ID regenerated; secure cookie attributes applied | NFR-02 |
| T37 / TC-SEC-06 | Submit `<script>alert(1)</script>` | Rendered as text; script does not execute | NFR-02 |
| T38 / TC-SEC-07 | Submit `' OR 1=1 --` | Cannot bypass authentication or query constraints | NFR-02 |
| T39 / TC-SEC-08 | Invalid upload MIME/size/extension | Rejected; unsafe file is not exposed | NFR-03 |

### 5.6. Content, error pages, administration and configuration

| ID | Scenario | Expected result | Trace |
|---|---|---|---|
| T40 / TC-CONTENT-01 | Open home/static/contact pages | Pages render; valid contact submission persists | FR-CN-01–05 |
| T41 / TC-ERROR-01 | Request unknown route | Styled 404 with return path | FR-CN-07 |
| T42 / TC-ERROR-02 | Production server exception | Styled 500; no stack trace or secret disclosure | FR-CN-07, NFR-03 |
| T43 / TC-ADMIN-01 | Dashboard while Subscription is absent | Shows “Chưa triển khai”/empty state; no fabricated subscription data | FR-AD-01 |
| T44 / TC-ADMIN-02 | Staff updates an order | Only permitted actions; transition obeys lifecycle | FR-AD-04, permissions |
| T45 / TC-ADMIN-03 | Admin edits catalog entities | Validation and active/hidden behavior follow contract | FR-AD-02/03 |
| T46 / TC-ADMIN-04 | Admin receives/increases inventory | Stock changes correctly; audit/history follows approved model | FR-AD-05 |
| T47 / TC-ADMIN-05 | Admin creates/edits coupon | Type/value/date/quota validation enforced | FR-AD-09 |
| T48 / TC-CONFIG-01 | Staff edits system configuration | Rejected | FR-AD-12, permissions |
| T49 / TC-CONFIG-02 | Admin saves valid shipping/bank/QR config | Persists and is used by checkout | FR-AD-12 |
| T50 / TC-CONFIG-03 | Invalid/negative/conflicting configuration | Rejected atomically; no partial config update | FR-AD-12 |
| T51 / TC-REFUND-01 | Cancel a paid order | After P1 schema/API/permission sign-off: exactly one refund case; order is not marked refunded and inventory is not restocked before confirmed success | DEC-029 |
| T52 / TC-REFUND-02 | Refund attempt fails, then retry | After P1 sign-off: failed attempt remains append-only; retry creates a new attempt; failure does not restock; paid-order coupon quota remains held | DEC-024, DEC-029 |
| T53 / TC-REFUND-03 | Refund attempt succeeds; duplicate result/retry is submitted | After P1 sign-off: success, payment/case state and allocation reversals/lot balances/ledger movements commit atomically; each allocation is restocked once | DEC-029, DEC-031 |
| T54 / TC-PII-01 | Guest lookup response | Contains no PII; verify every returned field against the signed-off allowlist before acceptance | DEC-030 |
| T55 / TC-PII-02 | Staff order list/detail responses | After field-level permission sign-off: full address/phone only in order detail when needed for delivery; test other fields against the signed-off matrix | DEC-030 |
| T56 / TC-INV-01 | Batch/unbatched inventory allocation and reversal | After P1 schema sign-off: `pool_kind`/batch consistency, lot-source allocation, ledger movements and one reversal per allocation follow approved schema | DEC-031 |

## 6. Non-functional tests

| ID | Scenario | Expected result |
|---|---|---|
| TC-NFR-01 | Viewport 375px | No horizontal overflow; hamburger works. |
| TC-NFR-02 | Viewport 1440px | Layout fits and respects design container. |
| TC-NFR-03 | Keyboard-only navigation | Forms, menus and dialogs/mini-cart are operable. |
| TC-NFR-04 | `prefers-reduced-motion` enabled | Motion is reduced/disabled. |
| TC-NFR-05 | Currency/date display | `185.000đ`, `DD/MM/YYYY`, `Asia/Ho_Chi_Minh` behavior is correct. |
| TC-NFR-06 | Loading/empty/error states | No blank view; useful message/action is rendered. |
| TC-NFR-07 | Home performance | ≤3 seconds on localhost using a recorded measurement method. |
| TC-DB-01 | Fresh environment setup | Approved PostgreSQL schema/seed setup completes in <10 minutes. |
| TC-DB-02 | Local/container and CI PostgreSQL | Version/features are compatible with approved Render target. |
| TC-DB-03 | Transaction failure injection | Order and inventory writes rollback together. |

## 7. Roadmap tests — not MVP blockers

| ID | Module | Required only if |
|---|---|---|
| TC-RM-01 | Quiz/BR-10 | Full Quiz is approved for a release. |
| TC-RM-02 | Subscription | Subscription is approved for a release. |
| TC-RM-03 | Wholesale | Wholesale workflow is approved for a release. |
| TC-RM-04 | Reviews | Review feature is approved for a release. |
| TC-RM-05 | Brew Lab | Brew Lab is approved for a release. |
| TC-RM-06 | Online payment | Payment integration is approved for a release. |
| TC-RM-07 | Loyalty | Points earning/redemption is approved for a release. |

## 8. Definition of Done

A task/milestone may be marked `Done` only when:

1. Its acceptance criteria are mapped to tests.
2. Required relevant tests pass, or an explicitly approved exception is recorded.
3. Applicable security checks have run.
4. No unrecorded blocker remains.
5. Evidence is recorded in `docs/PROGRESS.md`.
6. Affected contracts/decisions are updated or confirmed unchanged.
