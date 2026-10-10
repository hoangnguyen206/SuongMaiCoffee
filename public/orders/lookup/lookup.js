/* ==========================================================================
   Suong Mai Coffee Roasters — Tra cuu don hang (/orders/lookup/lookup.js)
   Giu NGUYEN hanh vi: 2 field + POST /api/v1/orders/lookup qua CartApi,
   loi trung tinh khong phan biet ma don / SDT (chong enumeration).
   Hien thi dung field API tra ve; thieu field nao thi AN + TODO.

   Field that tu guest lookup (src/Repositories/CommerceRepository.php):
     order_code, status, subtotal_vnd, discount_vnd, shipping_vnd,
     grand_total_vnd, items[{product_name, variant_label, grind_label,
     unit_price_vnd, quantity, line_total_vnd}], created_at
   KHONG co: dia chi giao (guest-safe), don vi van chuyen, ma van don,
   ngay giao du kien, lich su trang thai, anh san pham.

   Mapping status -> label: DUNG window.SM.badgeMap (contract):
     pending Chờ xác nhận / confirmed Đã xác nhận / roasting Đang rang /
     shipping Đang giao / completed Đã giao / cancelled Đã hủy
   ========================================================================== */
(() => {
  'use strict';

  const form = document.querySelector('#lookup-form');
  const formCard = document.querySelector('#lookup-form-card');
  const status = document.querySelector('#status');
  const result = document.querySelector('#result');
  const errorBox = document.querySelector('#lookup-error');
  const submitButton = document.querySelector('#lookup-submit');
  const submitLabel = submitButton ? submitButton.querySelector('.lookup-submit-label') : null;
  const codeInput = document.querySelector('#order-code');
  const phoneInput = document.querySelector('#phone');
  if (!form || !status || !result) return;

  const escape = (window.SM && typeof window.SM.escapeHtml === 'function')
    ? window.SM.escapeHtml
    : (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const money = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`;
  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  function initials(name) {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'SM';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  function setLoading(loading) {
    if (!submitButton) return;
    submitButton.disabled = loading;
    submitButton.classList.toggle('is-loading', loading);
    submitButton.setAttribute('aria-busy', loading ? 'true' : 'false');
    if (submitLabel) submitLabel.textContent = loading ? 'Đang tra cứu…' : 'Tra cứu →';
  }

  function showFieldError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function hideFieldError() {
    if (!errorBox) return;
    errorBox.textContent = '';
    errorBox.hidden = true;
  }

  // Validate client nhe: chi check rong (giong hanh vi cu) + format SDT VN co ban.
  // Thong diep loi API (404/422/429) giu nguyen tu backend, khong phan biet field.
  function clientError(code, phone) {
    if (!code || !phone) return 'Vui lòng nhập mã đơn hàng và số điện thoại.';
    const digits = phone.replace(/[\s.()-]+/g, '');
    if (!/^(0[1-9][0-9]{8}|\+84[1-9][0-9]{8,9}|84[1-9][0-9]{8,9})$/.test(digits)) {
      return 'Số điện thoại chưa đúng — ví dụ 0901234567.';
    }
    return '';
  }

  // Auto-format SDT: nhom 4-3-3 khi go (0901 234 567). Backend tu strip
  // khoang trang khi normalize nen dinh dang nay an toan.
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      const digits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
      const parts = [];
      if (digits.length > 0) parts.push(digits.slice(0, 4));
      if (digits.length > 4) parts.push(digits.slice(4, 7));
      if (digits.length > 7) parts.push(digits.slice(7));
      if (phoneInput.value !== parts.join(' ')) phoneInput.value = parts.join(' ');
    });
  }

  function renderNotFound(message) {
    result.hidden = false;
    result.innerHTML =
      `<div class="notfound">` +
      `<div class="notfound-visual" aria-hidden="true">?</div>` +
      `<h2>Chưa tìm thấy đơn này.</h2>` +
      `<p>${escape(message || 'Không tìm thấy đơn hàng phù hợp.')}</p>` +
      `<ul class="notfound-check">` +
      `<li>Kiểm tra lại mã đơn trong SMS/email xác nhận.</li>` +
      `<li>Dùng đúng số điện thoại đã đặt hàng.</li>` +
      `<li>Đơn mới đặt? Chờ vài phút rồi thử lại.</li>` +
      `</ul>` +
      `<div class="result-actions">` +
      `<button class="btn-outline" type="button" data-lookup-again>Thử lại</button>` +
      `<a class="btn-solid" href="#contact">Liên hệ hỗ trợ</a>` +
      `</div></div>`;
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const again = result.querySelector('[data-lookup-again]');
    if (again) again.addEventListener('click', resetLookup);
  }

  function renderOrder(order) {
    const badgeHTML = (window.SM && typeof window.SM.orderBadgeHTML === 'function')
      ? window.SM.orderBadgeHTML(order.status)
      : '';
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsHTML = items.map((item) => {
      const sub = [item.variant_label, item.grind_label].filter(Boolean).map(escape).join(' · ');
      // TODO(asset): order item chưa có ảnh — đang dùng monogram chữ. Cần API trả
      // image_url (packshot /assets/products/*.webp) để hiện thumb thật.
      return `<li class="result-item">` +
        `<span class="result-thumb" aria-hidden="true">${escape(initials(item.product_name))}</span>` +
        `<div><p class="result-item-name">${escape(item.product_name)}</p>` +
        (sub ? `<p class="result-item-sub">${sub}</p>` : '') + `</div>` +
        `<div class="result-item-right"><span class="result-item-qty">×${Number(item.quantity) || 0}</span>` +
        `<span class="result-item-price">${money(item.line_total_vnd)}</span></div></li>`;
    }).join('');
    const created = formatDate(order.created_at);

    result.hidden = false;
    result.innerHTML =
      `<div class="result-head">` +
      `<h2 class="result-code"><small>Đơn hàng</small>${escape(order.order_code)}</h2>` +
      `<button class="copy-btn" type="button" data-copy-code>Sao chép mã</button>` +
      `</div>` +
      (badgeHTML ? `<p class="result-meta">${badgeHTML}</p>` : '') +
      (created ? `<p class="result-meta">Đặt ngày ${escape(created)}</p>` : '') +
      // TODO(backend): ngày giao dự kiến (ETA) chưa có trong guest lookup —
      // cần field estimated_delivery_date mới hiện dòng "Dự kiến giao".
      // TODO(backend): đơn vị vận chuyển + mã vận đơn (copyable) chưa có —
      // cần field carrier_name + tracking_code mới hiện khối vận chuyển.
      // TODO(backend): hóa đơn/invoice chưa có — cần field invoice_url
      // (hoặc invoice_no) mới hiện nút "Tải hóa đơn".
      // Guest-safe: API cố ý KHÔNG trả địa chỉ/SĐT/email — không render.
      `<div class="result-timeline" id="order-timeline"></div>` +
      (itemsHTML ? `<ul class="result-items">${itemsHTML}</ul>` : '') +
      `<div class="result-totals">` +
      `<div class="row"><span>Tạm tính</span><strong>${money(order.subtotal_vnd)}</strong></div>` +
      `<div class="row"><span>Giảm giá</span><strong>−${money(order.discount_vnd)}</strong></div>` +
      `<div class="row"><span>Vận chuyển</span><strong>${money(order.shipping_vnd)}</strong></div>` +
      `<div class="row grand"><span>Tổng cộng</span><strong>${money(order.grand_total_vnd)}</strong></div>` +
      `</div>` +
      (Number(order.discount_vnd) > 0
        ? `<p class="result-note">Đơn của bạn đã được áp dụng ưu đãi — cảm ơn bạn đã chọn Sương Mai.</p>`
        : '') +
      `<div class="result-actions">` +
      `<button class="btn-outline" type="button" data-lookup-again>Tra cứu đơn khác</button>` +
      `<a class="btn-solid" href="/catalog/">Mua thêm cà phê</a>` +
      `</div>`;

    // Timeline + badge qua renderer dùng chung (contract); times/descs thiếu
    // thì renderer tự ẩn — không bịa timestamp từng chặng.
    // TODO(backend): lịch sử trạng thái (order_status_history) chưa expose cho
    // guest — cần field status_times{confirmed,roasting,shipping,completed}.
    // TODO(backend): banner delay/su co (vang nhat + nut Chat ho tro) can API
    // expose trang thai delay/ly do — hien API chi tra 6 status chuan, chua build.
    if (window.SM && typeof window.SM.renderTimeline === 'function') {
      window.SM.renderTimeline('#order-timeline', { status: order.status });
    }
    const copyButton = result.querySelector('[data-copy-code]');
    if (copyButton) copyButton.addEventListener('click', copyOrderCode);
    const again = result.querySelector('[data-lookup-again]');
    if (again) again.addEventListener('click', resetLookup);
    if (window.SM && typeof window.SM.reveal === 'function') {
      try { window.SM.reveal(result); } catch (ignored) { /* no-op */ }
    }
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function copyOrderCode(event) {
    const button = event.currentTarget;
    const code = result.querySelector('.result-code');
    const text = code ? code.textContent.replace(/^Đơn hàng\s*/, '').trim() : '';
    if (!text) return;
    const done = () => {
      if (window.SM && typeof window.SM.toast === 'function') {
        window.SM.toast('Đã sao chép mã đơn.', { type: 'success' });
      } else {
        button.textContent = 'Đã sao chép ✓';
        window.setTimeout(() => { button.textContent = 'Sao chép mã'; }, 2000);
      }
    };
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        done();
      } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
        done();
      }
    } catch (ignored) {
      if (window.SM && typeof window.SM.toast === 'function') {
        window.SM.toast('Không sao chép được — bạn giữ mã để copy nhé.', { type: 'warning' });
      }
    }
  }

  function resetLookup() {
    result.hidden = true;
    result.innerHTML = '';
    status.className = 'lookup-status';
    status.textContent = '';
    hideFieldError();
    if (formCard) formCard.hidden = false;
    if (codeInput) {
      codeInput.focus();
      codeInput.select();
    }
    if (formCard) formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideFieldError();
    const data = new FormData(form);
    const code = String(data.get('order_code') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const invalid = clientError(code, phone);
    if (invalid) {
      showFieldError(invalid);
      status.className = 'lookup-status';
      status.textContent = '';
      return;
    }
    result.hidden = true;
    result.innerHTML = '';
    setLoading(true);
    status.className = 'lookup-status';
    status.textContent = 'Đang tra cứu…';
    try {
      await window.CartApi.session();
      const order = await window.CartApi.lookupOrder({ order_code: code, phone });
      renderOrder(order);
      status.textContent = 'Đã tìm thấy đơn hàng.';
      status.className = 'lookup-status is-success';
    } catch (error) {
      // Lỗi trung tính từ backend (404 NOT_FOUND / 422 / 429 / 503) — giữ
      // nguyên message, không phân biệt field nào sai (chống enumeration).
      const message = (error && error.message) || 'Không tìm thấy đơn hàng phù hợp.';
      status.textContent = '';
      status.className = 'lookup-status';
      renderNotFound(message);
    } finally {
      setLoading(false);
    }
  });
})();
