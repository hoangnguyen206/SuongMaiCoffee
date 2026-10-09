(() => {
  const content = document.querySelector('#cart-content');
  const status = document.querySelector('#cart-status');
  const modeIndicator = document.querySelector('#cart-mode');
  let cart = null;
  let busy = false;

  function showMessage(message, kind = '') {
    status.textContent = message;
    status.className = `status${kind ? ` ${kind}` : ''}`;
    status.hidden = !message;
  }

  function money(value) { return `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`; }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
  function errorMessage(error) {
    const conflicts = error.details?.conflicts || [];
    if (conflicts.length) return `${error.message} Tối đa dòng bị ảnh hưởng: ${conflicts.map(item => item.max_acceptable_quantity).join(', ')}.`;
    const fields = Object.values(error.fields || {}).flat();
    return fields.length ? fields.join(' ') : (error.message || 'Không thể cập nhật giỏ hàng.');
  }

  function renderPricing() {
    const pricing = cart.pricing;
    return `<div class="cart-summary"><p><span>Tạm tính</span><strong>${money(pricing.subtotal_vnd)}</strong></p><p><span>Giảm giá</span><strong>-${money(pricing.discount_vnd)}</strong></p><p><span>Vận chuyển</span><strong>${money(pricing.shipping_vnd)}</strong></p><p class="grand-total"><span>Tổng cộng</span><strong>${money(pricing.grand_total_vnd)}</strong></p><div class="coupon-row"><label for="coupon-code">Mã giảm giá</label><div><input id="coupon-code" type="text" maxlength="80" placeholder="WELCOME10" value="${escapeHtml(cart.coupon?.code || '')}"><button id="apply-coupon" class="button button-quiet" type="button">Áp dụng</button>${cart.coupon ? '<button id="clear-coupon" class="text-button" type="button">Gỡ mã</button>' : ''}</div></div><p class="hint">Giá và các khoản phí được hiển thị bằng đồng Việt Nam.</p><a class="button inline-button" href="/checkout/">Tiến hành checkout</a></div>`;
  }

  function render() {
    if (!cart) return;
    modeIndicator.textContent = cart.mode === 'customer' ? 'Giỏ hàng tài khoản — đã đăng nhập' : 'Giỏ hàng khách — được lưu trong phiên này';
    content.setAttribute('aria-busy', 'false');
    if (!cart.lines.length) {
      content.innerHTML = '<div class="empty-state"><h2>Giỏ hàng đang trống</h2><p>Hãy ghé cửa hàng để chọn cà phê phù hợp với bạn.</p><a class="button inline-button" href="/catalog/">Tiếp tục mua sắm</a></div>';
      return;
    }
    content.innerHTML = `<div class="cart-heading"><h2>Sản phẩm đã chọn</h2><span>${cart.lines.reduce((sum, line) => sum + line.quantity, 0)} sản phẩm</span></div><div class="line-list">${cart.lines.map(line => `<article class="cart-line" data-line-id="${line.id}"><div class="line-copy"><h3>${escapeHtml(line.product_name)}</h3><p>${escapeHtml(line.variant_label)} · ${escapeHtml(line.grind_label)}</p><p class="availability">${line.available ? `Còn hàng: ${line.available_quantity}` : 'Tạm hết hàng'}</p></div><div class="line-actions"><label>Số lượng<input class="quantity-input" type="number" min="1" max="20" value="${line.quantity}" inputmode="numeric" aria-label="Số lượng ${escapeHtml(line.product_name)}"></label><p class="line-total">Thành tiền: <strong>${money(line.line_total_vnd)}</strong></p><button class="remove-button" type="button">Xóa</button></div></article>`).join('')}</div>${renderPricing()}`;
    content.querySelectorAll('.quantity-input').forEach(input => input.addEventListener('change', updateLine));
    content.querySelectorAll('.remove-button').forEach(button => button.addEventListener('click', removeLine));
    content.querySelector('#apply-coupon')?.addEventListener('click', () => applyCoupon(content.querySelector('#coupon-code').value));
    content.querySelector('#clear-coupon')?.addEventListener('click', () => run(() => window.CartApi.clearCoupon(), 'Đã gỡ mã giảm giá.'));
  }

  async function run(operation, successMessage = '') {
    if (busy) return;
    busy = true; content.setAttribute('aria-busy', 'true'); showMessage('Đang cập nhật…');
    try { const response = await operation(); cart = response; render(); showMessage(successMessage, successMessage ? 'success' : ''); }
    catch (error) { showMessage(errorMessage(error), 'error'); content.setAttribute('aria-busy', 'false'); }
    finally { busy = false; }
  }
  function updateLine(event) { const line = event.target.closest('.cart-line'); return run(() => window.CartApi.updateLine(line.dataset.lineId, event.target.value)); }
  function removeLine(event) { const line = event.target.closest('.cart-line'); return run(() => window.CartApi.removeLine(line.dataset.lineId), 'Đã xóa sản phẩm khỏi giỏ.'); }
  function applyCoupon(code) { return run(() => window.CartApi.applyCoupon(code), 'Đã áp dụng mã giảm giá.'); }

  (async () => {
    try { await window.CartApi.session(); cart = await window.CartApi.getCart(); render(); }
    catch (error) { content.setAttribute('aria-busy', 'false'); showMessage(errorMessage(error), 'error'); }
  })();
})();
