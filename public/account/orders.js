(() => {
  const status = document.querySelector('#status');
  const container = document.querySelector('#orders');
  const statusLabel = value => ({ pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', roasting: 'Đang rang', shipping: 'Đang giao', completed: 'Hoàn tất', cancelled: 'Đã hủy' })[value] || 'Đang cập nhật';
  const money = amount => `${new Intl.NumberFormat('vi-VN').format(Number(amount) || 0)}đ`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  (async () => {
    try {
      await window.CartApi.session();
      const orders = await window.CartApi.accountOrders();
      if (!orders.length) {
        status.textContent = 'Bạn chưa có đơn hàng nào.';
        status.className = 'empty';
        return;
      }
      container.innerHTML = orders.map(order => `<article class="order-card"><div><h2><a href="/account/order/?code=${encodeURIComponent(order.order_code)}">${escape(order.order_code)}</a></h2><p>${new Date(order.created_at).toLocaleString('vi-VN')}</p></div><div><strong>${statusLabel(order.status)}</strong><p>${order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p></div><strong>${money(order.grand_total_vnd)}</strong></article>`).join('');
      status.textContent = `${orders.length} đơn hàng`;
    } catch (error) {
      status.textContent = error.message || 'Vui lòng đăng nhập để xem đơn hàng.';
      status.className = 'error';
      if (error.status === 401) status.insertAdjacentHTML('afterend', '<p><a href="/">Đăng nhập để tiếp tục</a> · <a href="/orders/lookup/">Tra cứu bằng mã đơn</a></p>');
    }
  })();
})();
