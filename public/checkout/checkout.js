(() => {
  const form = document.querySelector('#checkout-form');
  const panels = [...document.querySelectorAll('[data-step-panel]')];
  const indicators = [...document.querySelectorAll('[data-step-indicator]')];
  const nextButton = document.querySelector('#next-button');
  const backButton = document.querySelector('#back-button');
  const title = document.querySelector('#step-title');
  const kicker = document.querySelector('#step-kicker');
  const feedback = document.querySelector('#form-feedback');
  const status = document.querySelector('#checkout-status');
  const summary = document.querySelector('.order-summary');
  const summaryItems = document.querySelector('#summary-items');
  const summaryTotals = document.querySelector('#summary-totals');
  const itemCount = document.querySelector('.item-count');
  const steps = [
    { title: 'Thông tin giao hàng', kicker: 'BƯỚC 1 / 3' },
    { title: 'Vận chuyển & thanh toán', kicker: 'BƯỚC 2 / 3' },
    { title: 'Xác nhận đơn hàng', kicker: 'BƯỚC 3 / 3' },
  ];
  let currentStep = 1;
  let cart = null;
  let submitting = false;
  let idempotencyKey = '';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  function money(value) {
    const amount = Number(value);
    return Number.isSafeInteger(amount) && amount >= 0 ? `${new Intl.NumberFormat('vi-VN').format(amount)}đ` : '—';
  }

  function showMessage(message, kind = '') {
    status.textContent = message;
    status.className = `status-banner${kind ? ` ${kind}` : ''}`;
    status.hidden = !message;
  }

  function renderCart() {
    summary.setAttribute('aria-busy', 'false');
    itemCount.textContent = `${cart.lines.reduce((sum, line) => sum + Number(line.quantity), 0)} sản phẩm`;
    summaryItems.innerHTML = cart.lines.map(line => `<article class="summary-item"><div class="item-art" aria-hidden="true">SM</div><div><h3>${escapeHtml(line.product_name)}</h3><p>${escapeHtml(line.variant_label)} · ${escapeHtml(line.grind_label)} · x${Number(line.quantity)}</p></div><strong>${money(line.line_total_vnd)}</strong></article>`).join('');
    const pricing = cart.pricing;
    summaryTotals.innerHTML = `<div><dt>Tạm tính</dt><dd>${money(pricing.subtotal_vnd)}</dd></div><div><dt>Giảm giá</dt><dd>−${money(pricing.discount_vnd)}</dd></div><div><dt>Vận chuyển</dt><dd>${money(pricing.shipping_vnd)}</dd></div><div class="total-row"><dt>Tổng cộng</dt><dd>${money(pricing.grand_total_vnd)}</dd></div>`;
  }

  function showStep(step, moveFocus = true) {
    currentStep = step;
    panels.forEach(panel => {
      const active = Number(panel.dataset.stepPanel) === step;
      panel.classList.toggle('is-active', active);
      panel.disabled = !active;
    });
    indicators.forEach(indicator => {
      const number = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle('is-current', number === step);
      indicator.classList.toggle('is-complete', number < step);
      if (number === step) indicator.setAttribute('aria-current', 'step');
      else indicator.removeAttribute('aria-current');
    });
    title.textContent = steps[step - 1].title;
    kicker.textContent = steps[step - 1].kicker;
    backButton.hidden = step === 1;
    nextButton.replaceChildren(document.createTextNode(step === 3 ? 'Đặt hàng' : 'Tiếp tục'));
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = step === 3 ? ' ✓' : ' →';
    nextButton.append(arrow);
    nextButton.disabled = !cart || submitting;
    feedback.textContent = '';
    feedback.classList.remove('is-error');
    if (moveFocus) title.focus({ preventScroll: true });
  }

  function validateDelivery() {
    const required = [
      ['recipient-name', 'Vui lòng nhập tên người nhận.'],
      ['recipient-phone', 'Vui lòng nhập số điện thoại.'],
      ['address-line', 'Vui lòng nhập địa chỉ.'],
      ['province', 'Vui lòng nhập tỉnh / thành phố.'],
      ['district', 'Vui lòng nhập quận / huyện.'],
    ];
    let firstInvalid = null;
    required.forEach(([id, message]) => {
      const field = document.getElementById(id);
      const error = document.querySelector(`[data-error-for="${id}"]`);
      const invalid = !field.value.trim();
      field.setAttribute('aria-invalid', String(invalid));
      error.textContent = invalid ? message : '';
      if (invalid && !firstInvalid) firstInvalid = field;
    });
    const email = document.getElementById('recipient-email');
    const emailError = document.querySelector('[data-error-for="recipient-email"]');
    const badEmail = email.value.trim() !== '' && !email.validity.valid;
    email.setAttribute('aria-invalid', String(badEmail));
    emailError.textContent = badEmail ? 'Email không hợp lệ.' : '';
    if (!firstInvalid && badEmail) firstInvalid = email;
    if (firstInvalid) {
      firstInvalid.focus();
      feedback.textContent = 'Kiểm tra các trường được đánh dấu rồi thử lại.';
      return false;
    }
    return true;
  }

  function updateReview() {
    const value = id => document.getElementById(id).value.trim();
    document.getElementById('review-recipient').textContent = value('recipient-name');
    document.getElementById('review-address').textContent = [value('address-line'), value('address-line2'), value('ward'), value('district'), value('province')].filter(Boolean).join(', ');
    const shipping = form.querySelector('[name="shipping_method"]:checked')?.value;
    const payment = form.querySelector('[name="payment_method"]:checked')?.value;
    document.getElementById('review-shipping').textContent = shipping === 'pickup' ? 'Nhận tại điểm bán' : 'Giao hàng tiêu chuẩn';
    document.getElementById('review-payment').textContent = payment === 'bank' ? 'Chuyển khoản ngân hàng' : 'Thanh toán khi nhận hàng';
  }

  function checkoutPayload() {
    const value = id => document.getElementById(id).value.trim();
    return {
      recipient_name: value('recipient-name'),
      phone: value('recipient-phone'),
      email: value('recipient-email') || null,
      address_line1: value('address-line'),
      address_line2: value('address-line2') || null,
      province_city: value('province'),
      district: value('district'),
      ward: value('ward') || null,
      shipping_method: form.querySelector('[name="shipping_method"]:checked')?.value || 'standard',
      payment_method: form.querySelector('[name="payment_method"]:checked')?.value || 'cod',
    };
  }

  async function placeOrder() {
    if (submitting) return;
    submitting = true;
    nextButton.disabled = true;
    backButton.disabled = true;
    feedback.textContent = 'Đang tạo đơn hàng…';
    try {
      const order = await window.CartApi.checkout(checkoutPayload(), idempotencyKey);
      document.querySelector('.checkout-panel').innerHTML = `<div class="confirmation-intro"><span class="confirmation-icon" aria-hidden="true">✓</span><div><p class="panel-kicker">ĐẶT HÀNG THÀNH CÔNG</p><h2>Đơn hàng đã được tạo</h2><p>Mã đơn hàng: <strong>${escapeHtml(order.order_code)}</strong></p></div></div><p>Trạng thái: ${({ pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', roasting: 'Đang rang', shipping: 'Đang giao', completed: 'Hoàn tất', cancelled: 'Đã hủy' })[order.status] || 'Đang cập nhật'}</p><p>Thanh toán: ${order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p><p>Tổng cộng: <strong>${money(order.grand_total_vnd)}</strong></p><p>Hãy lưu mã đơn để tra cứu tình trạng đơn hàng.</p><p><a class="button button-primary" href="/orders/lookup/">Tra cứu đơn hàng</a> <a class="button button-secondary" href="/catalog/">Tiếp tục mua sắm</a></p>`;
      showMessage('Đặt hàng thành công.', 'success');
    } catch (error) {
      const fields = Object.values(error.fields || {}).flat();
      feedback.textContent = fields.length ? fields.join(' ') : (error.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
      feedback.classList.add('is-error');
      nextButton.disabled = false;
      backButton.disabled = false;
      submitting = false;
    }
  }

  form.addEventListener('input', event => {
    if (event.target.matches('[aria-invalid="true"]')) event.target.setAttribute('aria-invalid', 'false');
    const error = document.querySelector(`[data-error-for="${event.target.id}"]`);
    if (error) error.textContent = '';
  });
  form.addEventListener('change', event => {
    if (event.target.matches('input[type="radio"]')) {
      form.querySelectorAll(`input[name="${event.target.name}"]`).forEach(input => input.closest('.choice-card').classList.toggle('is-selected', input.checked));
    }
  });
  backButton.addEventListener('click', () => { if (currentStep > 1 && !submitting) showStep(currentStep - 1); });
  nextButton.addEventListener('click', () => {
    if (currentStep === 1 && !validateDelivery()) return;
    if (currentStep === 2) updateReview();
    if (currentStep < 3) {
      showStep(currentStep + 1);
      return;
    }
    placeOrder();
  });

  (async () => {
    try {
      await window.CartApi.session();
      cart = await window.CartApi.getCart();
      if (!cart.lines.length) {
        showMessage('Giỏ hàng đang trống. Hãy thêm sản phẩm trước khi checkout.', 'error');
        nextButton.disabled = true;
        summaryItems.innerHTML = '<p>Chưa có sản phẩm trong giỏ.</p>';
        summary.setAttribute('aria-busy', 'false');
        return;
      }
      renderCart();
      idempotencyKey = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      nextButton.disabled = false;
      showMessage('Giỏ hàng đã được tải. Giá và số lượng sẽ được xác nhận lại khi bạn đặt hàng.', 'success');
      showStep(1, false);
    } catch (error) {
      showMessage(error.message || 'Không thể tải giỏ hàng. Vui lòng thử lại.', 'error');
      nextButton.disabled = true;
      summary.setAttribute('aria-busy', 'false');
    }
  })();
})();
