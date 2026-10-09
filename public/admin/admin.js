(() => {
  const loginPanel = document.querySelector('#login-panel');
  const loginForm = document.querySelector('#login-form');
  const dashboard = document.querySelector('#dashboard');
  const status = document.querySelector('#status');
  const orders = document.querySelector('#orders');
  const detail = document.querySelector('#order-detail');
  const inventory = document.querySelector('#inventory');
  const filter = document.querySelector('#status-filter');
  const money = value => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const messages = error => Object.values(error.fields || {}).flat().join(' ') || error.message || 'Không thể hoàn tất yêu cầu.';
  function show(message, kind = '') { status.textContent = message; status.className = kind; }
  async function loadOrders() {
    try {
      const list = await window.CartApi.adminOrders(filter.value);
      orders.innerHTML = list.length ? list.map(order => `<button class="order-row" data-code="${escape(order.order_code)}" type="button"><strong>${escape(order.order_code)}</strong><span>${escape(order.status)}</span><span>${money(order.grand_total_vnd)}</span></button>`).join('') : '<p>Chưa có đơn hàng.</p>';
      orders.querySelectorAll('[data-code]').forEach(button => button.addEventListener('click', () => loadOrder(button.dataset.code)));
    } catch (error) { show(messages(error), 'error'); }
  }
  async function loadOrder(code) {
    try {
      const order = await window.CartApi.adminOrder(code);
      detail.innerHTML = `<h3>${escape(order.order_code)}</h3><p>${escape(order.shipping?.recipient_name)} · ${escape(order.shipping?.phone)}</p><p>Tổng: <strong>${money(order.grand_total_vnd)}</strong></p><ul>${order.items.map(item => `<li>${escape(item.product_name)} · ${escape(item.variant_label)} · ${escape(item.grind_label)} · x${item.quantity}</li>`).join('')}</ul><label>Trạng thái<select id="order-status"><option value="pending">Chờ xác nhận</option><option value="confirmed">Đã xác nhận</option><option value="roasting">Đang rang</option><option value="shipping">Đang giao</option><option value="completed">Hoàn tất</option><option value="cancelled">Đã hủy</option></select></label><label>Ghi chú<textarea id="order-note" maxlength="500"></textarea></label><button id="save-status" type="button">Cập nhật trạng thái</button>`;
      detail.querySelector('#order-status').value = order.status;
      detail.querySelector('#save-status').addEventListener('click', async () => {
        try { await window.CartApi.adminUpdateStatus(code, { status: detail.querySelector('#order-status').value, note: detail.querySelector('#order-note').value }); show('Đã cập nhật trạng thái.', 'success'); await loadOrders(); await loadOrder(code); } catch (error) { show(messages(error), 'error'); }
      });
    } catch (error) { show(messages(error), 'error'); }
  }
  async function loadInventory() {
    try {
      const list = await window.CartApi.adminInventory();
      inventory.innerHTML = list.map(lot => `<article class="inventory-row"><div><strong>${escape(lot.product_name)}</strong><span>${escape(lot.variant_label)} · ${escape(lot.pool_kind)}</span></div><strong>${lot.quantity_on_hand}</strong><form data-lot-id="${lot.id}"><input name="quantity_delta" type="number" step="1" placeholder="± số lượng" required><input name="note" maxlength="200" placeholder="Ghi chú bắt buộc" required><button type="submit">Điều chỉnh</button></form></article>`).join('');
      inventory.querySelectorAll('form').forEach(form => form.addEventListener('submit', async event => { event.preventDefault(); const data = new FormData(form); try { await window.CartApi.adminAdjustInventory({ lot_id: Number(form.dataset.lotId), quantity_delta: Number(data.get('quantity_delta')), note: String(data.get('note')) }); show('Đã điều chỉnh tồn kho và ghi audit note.', 'success'); await loadInventory(); } catch (error) { show(messages(error), 'error'); } }));
    } catch (error) { show(messages(error), 'error'); }
  }
  async function start() {
    try {
      const session = await window.AccountApi.session();
      if (session.user?.role !== 'admin') throw Object.assign(new Error('Bạn không có quyền quản trị.'), { status: 403 });
      loginPanel.hidden = true; dashboard.hidden = false; await Promise.all([loadOrders(), loadInventory()]);
    } catch (error) { show(messages(error), 'error'); }
  }
  loginForm.addEventListener('submit', async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(loginForm)); try { const session = await window.AccountApi.login(data); if (session.user?.role !== 'admin') throw new Error('Tài khoản này không có quyền quản trị.'); loginPanel.hidden = true; dashboard.hidden = false; await Promise.all([loadOrders(), loadInventory()]); } catch (error) { show(messages(error), 'error'); } });
  filter.addEventListener('change', loadOrders);
  document.querySelector('#logout').addEventListener('click', async () => { try { await window.AccountApi.logout(); window.location.reload(); } catch (error) { show(messages(error), 'error'); } });
  start();
})();
