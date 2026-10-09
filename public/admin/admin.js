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
  function show(message, kind = '') { status.textContent = message; status.className = kind; status.tabIndex = -1; if (message) status.focus(); }
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
      detail.querySelector('#save-status').addEventListener('click', async () => { try { await window.CartApi.adminUpdateStatus(code, { status: detail.querySelector('#order-status').value, note: detail.querySelector('#order-note').value }); show('Đã cập nhật trạng thái.', 'success'); await loadOrders(); await loadOrder(code); } catch (error) { show(messages(error), 'error'); } });
    } catch (error) { show(messages(error), 'error'); }
  }
  async function loadInventory() {
    try {
      const list = await window.CartApi.adminInventory();
      inventory.innerHTML = list.map(lot => `<article class="inventory-row"><div><strong>${escape(lot.product_name)}</strong><span>${escape(lot.variant_label)} · ${escape(lot.pool_kind)}</span></div><strong>${lot.quantity_on_hand}</strong><form data-lot-id="${lot.id}"><input name="quantity_delta" type="number" step="1" placeholder="± số lượng" required><input name="note" maxlength="200" placeholder="Ghi chú bắt buộc" required><button type="submit">Điều chỉnh</button></form></article>`).join('');
      inventory.querySelectorAll('form').forEach(form => form.addEventListener('submit', async event => { event.preventDefault(); const data = new FormData(form); try { await window.CartApi.adminAdjustInventory({ lot_id: Number(form.dataset.lotId), quantity_delta: Number(data.get('quantity_delta')), note: String(data.get('note')) }); show('Đã điều chỉnh tồn kho và ghi audit note.', 'success'); await loadInventory(); } catch (error) { show(messages(error), 'error'); } }));
    } catch (error) { show(messages(error), 'error'); }
  }
  const panels = [...document.querySelectorAll('[data-admin-panel]')];
  function activateTab(name) { document.querySelectorAll('[data-admin-tab]').forEach(tab => tab.classList.toggle('is-active', tab.dataset.adminTab === name)); panels.forEach(panel => { panel.hidden = panel.dataset.adminPanel !== name; }); }
  document.querySelectorAll('[data-admin-tab]').forEach(tab => tab.addEventListener('click', () => activateTab(tab.dataset.adminTab)));
  function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
  async function loadOverview() { const data = await window.AdminApi.dashboard(); document.querySelector('#kpis').innerHTML = [['Doanh thu', money(data.revenue_vnd)], ['Đơn hôm nay', data.orders_today], ['Đang xử lý', data.active_orders], ['Giá trị đơn TB', money(data.average_order_vnd)], ['Lô sắp hết', data.low_stock_lots]].map(([label, value]) => `<article class="kpi"><span>${label}</span><strong>${escape(value)}</strong></article>`).join(''); }
  let productOptions = {};
  async function loadProducts() { const list = await window.AdminApi.products(); document.querySelector('#products').innerHTML = list.map(product => `<article class="admin-row"><div><strong>${escape(product.name)}</strong><span>${escape(product.origin_name)} · ${money(product.minimum_price_vnd)} · tồn ${product.quantity_on_hand}</span></div><button type="button" data-edit-product="${product.id}">Sửa</button><button type="button" class="secondary" data-toggle-product="${product.id}" data-active="${product.is_active}">${product.is_active ? 'Ẩn' : 'Hiện'}</button></article>`).join('') || '<p>Chưa có sản phẩm.</p>'; document.querySelectorAll('[data-edit-product]').forEach(button => button.addEventListener('click', () => { const product = list.find(item => String(item.id) === button.dataset.editProduct); if (!product) return; const form = document.querySelector('#product-form'); form.hidden = false; form.elements.id.value = product.id; form.elements.name.value = product.name; form.elements.slug.value = product.slug; form.elements.description.value = product.description; form.elements.origin_id.value = product.origin_id || ''; })); document.querySelectorAll('[data-toggle-product]').forEach(button => button.addEventListener('click', async () => { try { await window.AdminApi.productActive(button.dataset.toggleProduct, button.dataset.active !== 'true'); show('Đã cập nhật trạng thái sản phẩm.', 'success'); await loadProducts(); } catch (error) { show(error.message, 'error'); } })); }
  async function loadCoupons() { const list = await window.AdminApi.coupons(); document.querySelector('#coupons').innerHTML = list.map(coupon => `<article class="admin-row"><div><strong>${escape(coupon.code)}</strong><span>${coupon.coupon_type === 'percent' ? `${coupon.percent_value}%` : money(coupon.fixed_value_vnd)} · tối thiểu ${money(coupon.minimum_subtotal_vnd)}</span></div><button type="button" class="secondary" data-toggle-coupon="${coupon.id}" data-active="${coupon.is_active === true || coupon.is_active === 't'}">${coupon.is_active === true || coupon.is_active === 't' ? 'Tắt' : 'Bật'}</button></article>`).join('') || '<p>Chưa có mã giảm giá.</p>'; document.querySelectorAll('[data-toggle-coupon]').forEach(button => button.addEventListener('click', async () => { try { await window.AdminApi.couponActive(button.dataset.toggleCoupon, button.dataset.active !== 'true'); show('Đã cập nhật mã giảm giá.', 'success'); await loadCoupons(); } catch (error) { show(error.message, 'error'); } })); }
  async function loadContent() { const rows = await window.AdminApi.content(); const form = document.querySelector('#content-form'); rows.forEach(row => { if (form.elements.namedItem(row.content_key)) form.elements.namedItem(row.content_key).value = row.content_value; }); }
  document.querySelector('#new-product').addEventListener('click', () => { const form = document.querySelector('#product-form'); form.reset(); form.elements.id.value = ''; form.hidden = false; });
  document.querySelector('#cancel-product').addEventListener('click', () => { document.querySelector('#product-form').hidden = true; });
  document.querySelector('#product-form').addEventListener('submit', async event => { event.preventDefault(); const form = event.currentTarget; try { await window.AdminApi.saveProduct(formData(form), form.elements.id.value || null); show('Đã lưu sản phẩm.', 'success'); form.hidden = true; await loadProducts(); } catch (error) { show(messages(error), 'error'); } });
  document.querySelector('#new-coupon').addEventListener('click', () => { const form = document.querySelector('#coupon-form'); form.reset(); form.elements.id.value = ''; form.hidden = false; });
  document.querySelector('#cancel-coupon').addEventListener('click', () => { document.querySelector('#coupon-form').hidden = true; });
  document.querySelector('#coupon-form').addEventListener('submit', async event => { event.preventDefault(); const form = event.currentTarget; try { await window.AdminApi.saveCoupon(formData(form), form.elements.id.value || null); show('Đã lưu mã giảm giá.', 'success'); form.hidden = true; await loadCoupons(); } catch (error) { show(messages(error), 'error'); } });
  document.querySelector('#content-form').addEventListener('submit', async event => { event.preventDefault(); try { await window.AdminApi.saveContent(formData(event.currentTarget)); show('Đã lưu nội dung cửa hàng.', 'success'); } catch (error) { show(messages(error), 'error'); } });
  async function start() {
    try {
      const session = await window.AccountApi.session();
      if (session.user?.role !== 'admin') throw Object.assign(new Error('Bạn không có quyền quản trị.'), { status: 403 });
      loginPanel.hidden = true; dashboard.hidden = false;
      productOptions = await window.AdminApi.productOptions();
      const origin = document.querySelector('#product-origin');
      origin.replaceChildren(...(productOptions.origins || []).map(item => new Option(item.name, item.id)));
      await Promise.all([loadOverview(), loadProducts(), loadCoupons(), loadContent(), loadOrders(), loadInventory()]);
    } catch (error) { show(messages(error), 'error'); }
  }
  loginForm.addEventListener('submit', async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(loginForm)); try { const session = await window.AccountApi.login(data); if (session.user?.role !== 'admin') throw new Error('Tài khoản này không có quyền quản trị.'); loginPanel.hidden = true; dashboard.hidden = false; await Promise.all([loadOverview(), loadProducts(), loadCoupons(), loadContent(), loadOrders(), loadInventory()]); } catch (error) { show(messages(error), 'error'); } });
  filter.addEventListener('change', loadOrders);
  start();
})();
