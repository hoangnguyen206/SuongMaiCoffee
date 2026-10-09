(() => {
  const status = document.querySelector('#status');
  const detail = document.querySelector('#order-detail');
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code') || '';
  const statusLabel = value => ({ pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', roasting: 'Đang rang', shipping: 'Đang giao', completed: 'Hoàn tất', cancelled: 'Đã hủy' })[value] || 'Đang cập nhật';
  const money = value => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  (async () => {
    if (!code) { status.textContent = 'Thiếu mã đơn hàng.'; status.className = 'error'; return; }
    try {
      await window.CartApi.session();
      const order = await window.CartApi.accountOrder(code);
      detail.innerHTML = `<article class="order-card"><h2>${escape(order.order_code)}</h2><p>Trạng thái: <strong>${statusLabel(order.status)}</strong> · Thanh toán: <strong>${order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></p><p>${escape(order.shipping?.recipient_name)} · ${escape(order.shipping?.phone)}</p><p>${escape(order.shipping?.address_line1)}, ${escape(order.shipping?.district)}, ${escape(order.shipping?.province_city)}</p><ul>${order.items.map(item => `<li>${escape(item.product_name)} · ${escape(item.variant_label)} · ${escape(item.grind_label)} · x${item.quantity} · ${money(item.line_total_vnd)}</li>`).join('')}</ul><p>Tạm tính: ${money(order.subtotal_vnd)} · Giảm giá: ${money(order.discount_vnd)} · Vận chuyển: ${money(order.shipping_vnd)}</p><p class="total">Tổng cộng: ${money(order.grand_total_vnd)}</p></article>`;
      status.textContent = 'Đã tải chi tiết đơn hàng.';
    } catch (error) { status.textContent = error.message || 'Không thể tải đơn hàng.'; status.className = 'error'; }
  })();
})();
