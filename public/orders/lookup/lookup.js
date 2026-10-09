(() => {
  const form = document.querySelector('#lookup-form');
  const status = document.querySelector('#status');
  const result = document.querySelector('#result');
  const statusLabel = value => ({ pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', roasting: 'Đang rang', shipping: 'Đang giao', completed: 'Hoàn tất', cancelled: 'Đã hủy' })[value] || 'Đang cập nhật';
  const money = value => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    result.hidden = true;
    status.className = '';
    status.textContent = 'Đang tra cứu…';
    const data = new FormData(form);
    try {
      await window.CartApi.session();
      const order = await window.CartApi.lookupOrder({ order_code: String(data.get('order_code') || '').trim(), phone: String(data.get('phone') || '').trim() });
      result.innerHTML = `<h2>Đơn hàng ${escape(order.order_code)}</h2><p>Trạng thái: <strong>${statusLabel(order.status)}</strong></p><ul>${(order.items || []).map(item => `<li>${escape(item.product_name)} · ${escape(item.variant_label)} · ${escape(item.grind_label)} · x${Number(item.quantity)}</li>`).join('')}</ul><p>Tạm tính: ${money(order.subtotal_vnd)} · Giảm giá: ${money(order.discount_vnd)} · Vận chuyển: ${money(order.shipping_vnd)}</p><p class="total">Tổng cộng: ${money(order.grand_total_vnd)}</p>`;
      result.hidden = false;
      status.textContent = 'Đã tìm thấy đơn hàng.';
      status.className = 'success';
    } catch (error) {
      status.textContent = error.message || 'Không tìm thấy đơn hàng phù hợp.';
      status.className = 'error';
    }
  });
})();
