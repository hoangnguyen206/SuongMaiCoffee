/* ==========================================================================
   Suong Mai — Admin console logic (FRONTEND-ONLY redesign).
   - Giu nguyen route/API/payload/CSRF/session/validation nhu code cu.
   - Trang thai don chi render qua SM.orderBadgeHTML (contract badge_map).
   - Thieu field API => AN phan do + TODO(backend), khong bia so lieu.
   ========================================================================== */
(() => {
  'use strict';

  const SM = window.SM || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = typeof SM.escapeHtml === 'function'
    ? SM.escapeHtml
    : (value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])));

  const money = value => `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}đ`;
  const num = value => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
  const badge = status => (typeof SM.orderBadgeHTML === 'function' ? SM.orderBadgeHTML(status) : '');
  const parseDate = value => new Date(String(value || '').replace(' ', 'T'));
  const fmtDateTime = value => {
    const date = parseDate(value);
    return Number.isNaN(date.getTime()) ? String(value ?? '') : date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };
  const fmtDay = value => {
    const date = parseDate(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const shortCode = code => {
    const text = String(code || '');
    return text.length > 12 ? `${text.slice(0, 6)}…${text.slice(-4)}` : text;
  };
  const debounce = (fn, wait = 300) => {
    let timer = null;
    return (...args) => { window.clearTimeout(timer); timer = window.setTimeout(() => fn(...args), wait); };
  };
  const errorMessage = error => Object.values(error.fields || {}).flat().join(' ') || error.message || 'Không thể hoàn tất yêu cầu.';

  const statusEl = $('#status');
  function showStatus(message, kind = '') {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.className = `admin-status${kind ? ` is-${kind}` : ''}`;
  }
  function toast(message, type = 'info', options = {}) {
    try {
      if (typeof SM.toast === 'function') SM.toast(message, { type, ...options });
      else showStatus(message, type === 'error' ? 'is-error' : '');
    } catch (err) { showStatus(message); }
  }

  /* ---------------------------------------------------------------- state */
  const state = {
    user: null,
    tab: 'overview',
    dashboard: null,
    orders: [],
    products: [],
    coupons: [],
    lots: [],
    origins: [],
    loaded: { overview: false, orders: false, products: false, coupons: false, inventory: false, content: false },
    filters: {
      orders: { q: '', status: new Set(), from: '', to: '', sort: 'newest', per: 10, page: 1 },
      products: { q: '', page: 1, per: 10 },
      inventory: { q: '', filter: '', sort: 'qty_asc', page: 1, per: 25 },
      coupons: { q: '' },
    },
  };

  const TAB_TITLES = {
    overview: 'Tổng quan', orders: 'Đơn hàng', products: 'Sản phẩm',
    inventory: 'Tồn kho', coupons: 'Mã giảm giá', content: 'Nội dung giới thiệu',
  };
  const TAB_SEARCH = { orders: '#orders-search', products: '#products-search', inventory: '#inventory-search', coupons: '#coupons-search' };
  // Luong don hang dung 1 buoc (khop allowed map backend, doc tu CommerceRepository).
  const NEXT_STEP = { pending: ['confirmed', 'Xác nhận đơn'], confirmed: ['roasting', 'Bắt đầu rang'], roasting: ['shipping', 'Giao cho vận chuyển'], shipping: ['completed', 'Hoàn tất đơn'] };
  const CANCELLABLE = new Set(['pending', 'confirmed']);

  /* ------------------------------------------------- hash state (tab + loc don) */
  function readHash() {
    const params = new URLSearchParams(String(window.location.hash || '').replace(/^#/, ''));
    const tab = String(params.get('tab') || 'overview');
    if (TAB_TITLES[tab]) state.tab = tab;
    const statuses = String(params.get('ostatus') || '').split(',').map(s => s.trim()).filter(Boolean);
    state.filters.orders.status = new Set(statuses);
  }
  function writeHash() {
    const params = new URLSearchParams();
    params.set('tab', state.tab);
    if (state.filters.orders.status.size) params.set('ostatus', [...state.filters.orders.status].join(','));
    const next = `#${params.toString()}`;
    if (window.location.hash !== next) window.history.replaceState(null, '', next);
  }

  /* ------------------------------------------------- skeleton + pager dung chung */
  function skeletonRows(tbody, cols, rows = 5) {
    tbody.innerHTML = Array.from({ length: rows }, () =>
      `<tr>${'<td><div class="sm-skeleton sm-skeleton-line">…</div></td>'.repeat(cols)}</tr>`).join('');
  }
  function renderPager(el, page, pages, onPage) {
    if (!el) return;
    if (pages <= 1) { el.innerHTML = ''; return; }
    el.innerHTML = `<button type="button" data-page="prev" ${page <= 1 ? 'disabled' : ''} aria-label="Trang trước">‹</button>` +
      `<span class="admin-muted" aria-live="polite">Trang ${page} / ${pages}</span>` +
      `<button type="button" data-page="next" ${page >= pages ? 'disabled' : ''} aria-label="Trang sau">›</button>`;
    el.querySelector('[data-page="prev"]').addEventListener('click', () => onPage(page - 1));
    el.querySelector('[data-page="next"]').addEventListener('click', () => onPage(page + 1));
  }
  async function copyText(text, label) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement('textarea');
        area.value = text; document.body.appendChild(area); area.select();
        document.execCommand('copy'); area.remove();
      }
      toast(`Đã sao chép ${label}.`, 'success');
    } catch (err) { toast('Không sao chép được. Hãy chép tay nhé.', 'error'); }
  }

  /* ------------------------------------------------- dieu huong tab */
  const sidebar = $('#admin-sidebar');
  const shell = $('#admin-shell');
  function gotoTab(name) {
    if (!TAB_TITLES[name]) return;
    state.tab = name;
    $$('[data-admin-tab]').forEach(tab => {
      const active = tab.dataset.adminTab === name;
      tab.classList.toggle('is-active', active);
      if (active) tab.setAttribute('aria-current', 'page'); else tab.removeAttribute('aria-current');
    });
    $$('[data-admin-panel]').forEach(panel => { panel.hidden = panel.dataset.adminPanel !== name; });
    $('#topbar-title').textContent = TAB_TITLES[name];
    // Search topbar chi hien o tab co tim kiem, dong bo 2 chieu voi o tim cua tab.
    const searchSelector = TAB_SEARCH[name];
    const topbarWrap = $('#topbar-search-wrap');
    const topbarInput = $('#topbar-search');
    if (searchSelector) {
      topbarWrap.hidden = false;
      topbarInput.value = state.filters[name].q || '';
    } else {
      topbarWrap.hidden = true;
    }
    shell.classList.remove('nav-open');
    $('#menu-btn').setAttribute('aria-expanded', 'false');
    $('#admin-scrim').hidden = true;
    writeHash();
  }

  /* ------------------------------------------------- tong quan */
  function daypart() {
    const hour = new Date().getHours();
    if (hour < 5) return 'Đêm nay';
    if (hour < 11) return 'Sáng nay';
    if (hour < 13) return 'Trưa nay';
    if (hour < 18) return 'Chiều nay';
    return 'Tối nay';
  }
  function shortName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : 'bạn';
  }
  function pendingOrders() { return state.orders.filter(o => o.status === 'pending'); }
  function stalePending() {
    const day = 24 * 3600 * 1000;
    const now = Date.now();
    return pendingOrders().filter(o => now - parseDate(o.created_at).getTime() > day);
  }
  function outOfStock() { return state.lots.filter(lot => Number(lot.quantity_on_hand) <= 0); }

  function renderOverview() {
    const data = state.dashboard || {};
    const tasks = pendingOrders().length + outOfStock().length;
    $('#greeting').textContent = tasks > 0
      ? `${daypart()}, Xưởng rang có ${tasks} việc cần làm.`
      : `${daypart()} mọi việc đã xong — chúc một ngày rang thơm.`;

    // Exception banner: don qua 24h chua xac nhan + lo sap het (so dashboard that).
    const banner = $('#exception-banner');
    const lines = [];
    const stale = stalePending();
    if (stale.length) lines.push({ text: `${stale.length} đơn quá 24h chưa xác nhận`, action: 'Xử lý', run: () => { state.filters.orders.status = new Set(['pending']); syncOrderToolbar(); gotoTab('orders'); } });
    if (Number(data.low_stock_lots) > 0) lines.push({ text: `${data.low_stock_lots} lô sắp hết hàng`, action: 'Xem kho', run: () => { state.filters.inventory.sort = 'qty_asc'; $('#inventory-sort').value = 'qty_asc'; gotoTab('inventory'); } });
    banner.hidden = lines.length === 0;
    banner.innerHTML = '';
    lines.forEach(line => {
      const row = document.createElement('div');
      row.append(document.createTextNode(line.text + ' '));
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = line.action;
      button.addEventListener('click', line.run);
      row.appendChild(button);
      banner.appendChild(row);
    });

    // 5 KPI click-to-drill tu API dashboard (khong them delta/sparkline).
    const kpis = [
      { key: 'revenue', label: 'Doanh thu', value: money(data.revenue_vnd), hint: 'Đơn chưa hủy', drill: () => { state.filters.orders.status.clear(); syncOrderToolbar(); gotoTab('orders'); } },
      { key: 'today', label: 'Đơn hôm nay', value: num(data.orders_today), hint: 'Đơn trong ngày', drill: () => { const today = new Date().toISOString().slice(0, 10); state.filters.orders.from = today; state.filters.orders.to = today; syncOrderToolbar(); gotoTab('orders'); } },
      { key: 'active', label: 'Đang xử lý', value: num(data.active_orders), hint: 'Chờ · rang · giao', drill: () => { state.filters.orders.status = new Set(['pending', 'confirmed', 'roasting', 'shipping']); syncOrderToolbar(); gotoTab('orders'); } },
      { key: 'average', label: 'Giá trị đơn TB', value: money(data.average_order_vnd), hint: 'Mỗi đơn', drill: () => { state.filters.orders.sort = 'total_desc'; syncOrderToolbar(); gotoTab('orders'); } },
      { key: 'low', label: 'Lô sắp hết', value: num(data.low_stock_lots), hint: 'Dưới ngưỡng', drill: () => { state.filters.inventory.sort = 'qty_asc'; $('#inventory-sort').value = 'qty_asc'; gotoTab('inventory'); } },
    ];
    const grid = $('#kpis');
    grid.innerHTML = '';
    kpis.forEach(kpi => {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'kpi'; card.setAttribute('role', 'listitem');
      card.innerHTML = `<span>${escape(kpi.label)}</span><strong>${escape(kpi.value)}</strong><small>${escape(kpi.hint)} →</small>`;
      card.addEventListener('click', kpi.drill);
      grid.appendChild(card);
    });

    // Preview: 5 don moi + 5 lo ton thap nhat.
    const recent = [...state.orders].sort((a, b) => parseDate(b.created_at) - parseDate(a.created_at)).slice(0, 5);
    $('#recent-orders').innerHTML = recent.length ? '' : '<p class="admin-empty">Chưa có đơn hàng.</p>';
    recent.forEach(order => {
      const row = document.createElement('button');
      row.type = 'button'; row.className = 'preview-row'; row.dataset.code = order.order_code;
      row.innerHTML = `<span class="grow"><strong>${escape(shortCode(order.order_code))}</strong> · ${escape(order.recipient_name || 'Khách lẻ')}</span>${badge(order.status)}<span class="num">${escape(money(order.grand_total_vnd))}</span>`;
      row.addEventListener('click', () => openOrder(order.order_code));
      $('#recent-orders').appendChild(row);
    });
    const lowest = [...state.lots].sort((a, b) => Number(a.quantity_on_hand) - Number(b.quantity_on_hand)).slice(0, 5);
    $('#low-stock').innerHTML = lowest.length ? '' : '<p class="admin-empty">Chưa có dữ liệu tồn kho.</p>';
    lowest.forEach(lot => {
      const row = document.createElement('button');
      row.type = 'button'; row.className = 'preview-row';
      row.innerHTML = `<span class="grow"><strong>${escape(lot.product_name)}</strong> · ${escape(lot.variant_label)}</span><span class="num ${Number(lot.quantity_on_hand) <= 0 ? 'stock-out' : ''}">${num(lot.quantity_on_hand)}</span>`;
      row.addEventListener('click', () => {
        state.filters.inventory.q = String(lot.product_name || '');
        $('#inventory-search').value = state.filters.inventory.q;
        state.filters.inventory.page = 1;
        renderInventory();
        gotoTab('inventory');
      });
      $('#low-stock').appendChild(row);
    });

    // So dem tren sidebar (so that tu data da load).
    const pendingCount = pendingOrders().length;
    const navOrders = $('#nav-orders-count');
    navOrders.hidden = pendingCount === 0;
    navOrders.textContent = pendingCount > 99 ? '99+' : String(pendingCount);
    const outCount = outOfStock().length;
    const navStock = $('#nav-stock-count');
    navStock.hidden = outCount === 0;
    navStock.textContent = outCount > 99 ? '99+' : String(outCount);
  }

  /* ------------------------------------------------- don hang */
  function syncOrderToolbar() {
    const filters = state.filters.orders;
    $('#orders-search').value = filters.q;
    $$('input[name="ostatus"]').forEach(box => { box.checked = filters.status.has(box.value); });
    $('#orders-from').value = filters.from;
    $('#orders-to').value = filters.to;
    $('#orders-sort').value = filters.sort;
    $('#orders-per').value = String(filters.per);
    if (state.tab === 'orders') $('#topbar-search').value = filters.q;
  }
  function filteredOrders() {
    const filters = state.filters.orders;
    const query = filters.q.trim().toLowerCase();
    let list = state.orders.filter(order => {
      if (filters.status.size && !filters.status.has(order.status)) return false;
      if (query) {
        const haystack = `${order.order_code} ${order.recipient_name || ''} ${order.phone || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      const day = parseDate(order.created_at);
      if (filters.from && day < new Date(`${filters.from}T00:00:00`)) return false;
      if (filters.to && day > new Date(`${filters.to}T23:59:59`)) return false;
      return true;
    });
    if (filters.sort === 'oldest') list.sort((a, b) => parseDate(a.created_at) - parseDate(b.created_at));
    else if (filters.sort === 'total_desc') list.sort((a, b) => Number(b.grand_total_vnd) - Number(a.grand_total_vnd));
    else list.sort((a, b) => parseDate(b.created_at) - parseDate(a.created_at));
    return list;
  }
  function renderOrders() {
    const filters = state.filters.orders;
    const list = filteredOrders();
    const pages = Math.max(1, Math.ceil(list.length / filters.per));
    filters.page = Math.min(Math.max(1, filters.page), pages);
    const start = (filters.page - 1) * filters.per;
    const pageItems = list.slice(start, start + filters.per);
    $('#orders-count').textContent = list.length ? `Hiển thị ${start + 1}–${start + pageItems.length} trong ${list.length} đơn.` : 'Không tìm thấy đơn nào khớp bộ lọc.';

    const tbody = $('#orders-tbody');
    if (!pageItems.length) {
      tbody.innerHTML = '<tr><td colspan="6"><p class="admin-empty">Không có đơn hàng nào.</p></td></tr>';
    } else {
      tbody.innerHTML = pageItems.map(order => `<tr data-code="${escape(order.order_code)}">
        <td data-label="Mã đơn"><span class="code">${escape(shortCode(order.order_code))}</span><button type="button" class="copy-btn" data-copy="${escape(order.order_code)}" aria-label="Sao chép mã đơn ${escape(order.order_code)}">⧉</button></td>
        <td data-label="Khách hàng">${escape(order.recipient_name || 'Khách lẻ')}<span class="sub">${escape(order.phone || '')}</span></td>
        <td data-label="Ngày đặt">${escape(fmtDateTime(order.created_at))}</td>
        <td data-label="Tổng tiền" class="num">${escape(money(order.grand_total_vnd))}</td>
        <td data-label="Trạng thái">${badge(order.status)}</td>
        <td><div class="row-actions"><button type="button" class="mini-btn" data-view="${escape(order.order_code)}">Xem</button></div></td>
      </tr>`).join('');
    }
    renderPager($('#orders-pager'), filters.page, pages, page => { filters.page = page; renderOrders(); });
    writeHash();
  }

  /* Chi tiet don trong drawer: timeline + mon + tien + dia chi + next-step. */
  async function openOrder(code) {
    const detail = $('#order-detail');
    $('#drawer-title').textContent = `Đơn ${shortCode(code)}`;
    detail.innerHTML = '<p class="admin-muted">Đang tải chi tiết đơn…</p>';
    SM.openDrawer?.('order-drawer');
    let order;
    try {
      order = await window.CartApi.adminOrder(code);
    } catch (error) {
      detail.innerHTML = `<p class="admin-muted">${escape(errorMessage(error))}</p>`;
      return;
    }
    const items = Array.isArray(order.items) ? order.items : [];
    const shipping = order.shipping || {};
    const address = [shipping.address_line1, shipping.address_line2, shipping.ward, shipping.district, shipping.province_city].filter(Boolean).join(', ');
    const next = NEXT_STEP[order.status];
    const canCancel = CANCELLABLE.has(order.status);

    detail.innerHTML = `
      <h3 class="drawer-order-code">${escape(order.order_code)}</h3>
      <p class="drawer-meta">${escape(fmtDateTime(order.created_at))} · ${escape(shipping.recipient_name || '')}</p>
      <p>${badge(order.status)}</p>
      <div class="drawer-block"><h3>Hành trình</h3><div id="drawer-timeline"></div></div>
      <div class="drawer-block"><h3>Món đã đặt (${items.length})</h3>
        ${items.length ? items.map(item => `<div class="drawer-item"><span class="grow">${escape(item.product_name)} · ${escape(item.variant_label)} · ${escape(item.grind_label)} × ${num(item.quantity)}</span><span class="num">${escape(money(item.line_total_vnd))}</span></div>`).join('') : '<p class="admin-muted">Không có món nào.</p>'}
      </div>
      <div class="drawer-block drawer-totals"><h3>Thanh toán</h3>
        <div class="row"><span>Tạm tính</span><span>${escape(money(order.subtotal_vnd))}</span></div>
        ${Number(order.discount_vnd) > 0 ? `<div class="row"><span>Giảm giá</span><span>−${escape(money(order.discount_vnd))}</span></div>` : ''}
        <div class="row"><span>Giao hàng</span><span>${escape(money(order.shipping_vnd))}</span></div>
        <div class="row grand"><span>Tổng cộng</span><span>${escape(money(order.grand_total_vnd))}</span></div>
      </div>
      <div class="drawer-block"><h3>Giao tới</h3>
        <p class="drawer-address">${escape(shipping.recipient_name || '')} · ${escape(shipping.phone || '')}<br>${escape(address)}${shipping.email ? `<br>${escape(shipping.email)}` : ''}</p>
      </div>
      <!-- TODO(backend): lich su thao tac (ai/doi gi/luc nao) + van don can API moi — hien an. -->
      <div class="drawer-block"><h3>Cập nhật trạng thái</h3>
        <div class="field drawer-note"><label for="drawer-note">Ghi chú nội bộ</label><textarea id="drawer-note" maxlength="500" placeholder="Ghi chú cho lần đổi này (không bắt buộc)"></textarea></div>
        <div class="drawer-next">
          ${next ? `<button type="button" class="button button-sm" id="drawer-next">${escape(next[1])} →</button>` : '<p class="admin-muted">Đơn đã ở trạng thái cuối.</p>'}
          ${canCancel ? '<button type="button" class="button button-outline button-sm" id="drawer-cancel">Hủy đơn</button>' : ''}
          <button type="button" class="button button-quiet button-sm" id="drawer-print">In đơn</button>
        </div>
      </div>`;

    // Timeline dung chung; API chua tra lich su timestamp => chi truyen status.
    // TODO(backend): order detail can status history timestamps de hien moc tung buoc.
    SM.renderTimeline?.($('#drawer-timeline', detail), { status: order.status });

    $('#drawer-next', detail)?.addEventListener('click', async () => {
      const button = $('#drawer-next', detail);
      button.disabled = true;
      try {
        await window.CartApi.adminUpdateStatus(code, { status: next[0], note: $('#drawer-note', detail).value });
        toast('Đã cập nhật trạng thái đơn.', 'success');
        await refreshAfterOrderChange();
        await openOrder(code);
      } catch (error) { toast(errorMessage(error), 'error'); button.disabled = false; }
    });
    $('#drawer-cancel', detail)?.addEventListener('click', async () => {
      const ok = typeof SM.confirm === 'function'
        ? await SM.confirm({ title: 'Hủy đơn này?', message: 'Tồn kho đã trừ sẽ được hoàn lại. Không thể hoàn tác.', confirmLabel: 'Hủy đơn', danger: true })
        : window.confirm('Hủy đơn này? Tồn kho sẽ được hoàn lại.');
      if (!ok) return;
      try {
        await window.CartApi.adminUpdateStatus(code, { status: 'cancelled', note: $('#drawer-note', detail).value });
        toast('Đã hủy đơn và hoàn tồn kho.', 'success');
        await refreshAfterOrderChange();
        await openOrder(code);
      } catch (error) { toast(errorMessage(error), 'error'); }
    });
    $('#drawer-print', detail)?.addEventListener('click', () => printOrder(order, items));
  }
  async function refreshAfterOrderChange() {
    // Giu nguyen filter khi dong/mo drawer; chi tai lai du lieu.
    try { state.orders = await window.CartApi.adminOrders(''); } catch (err) { /* giu du lieu cu */ }
    try { state.lots = await window.CartApi.adminInventory(); } catch (err) { /* giu du lieu cu */ }
    try { state.dashboard = await window.AdminApi.dashboard(); } catch (err) { /* giu du lieu cu */ }
    renderOrders();
    renderInventory();
    renderOverview();
  }
  function printOrder(order, items) {
    const shipping = order.shipping || {};
    $('#print-sheet').innerHTML = `<h2>Sương Mai Coffee Roasters — Đơn ${escape(order.order_code)}</h2>
      <p>Ngày: ${escape(fmtDateTime(order.created_at))} · Khách: ${escape(shipping.recipient_name || '')} · ${escape(shipping.phone || '')}</p>
      <table><thead><tr><th>Món</th><th>Số lượng</th><th>Thành tiền</th></tr></thead><tbody>
      ${items.map(item => `<tr><td>${escape(item.product_name)} · ${escape(item.variant_label)} · ${escape(item.grind_label)}</td><td>${num(item.quantity)}</td><td>${escape(money(item.line_total_vnd))}</td></tr>`).join('')}
      </tbody></table>
      <p>Tạm tính: ${escape(money(order.subtotal_vnd))} · Giảm: ${escape(money(order.discount_vnd))} · Ship: ${escape(money(order.shipping_vnd))} · <strong>Tổng: ${escape(money(order.grand_total_vnd))}</strong></p>`;
    window.print();
  }

  /* ------------------------------------------------- san pham */
  function findOriginId(originName) {
    // FIX: API products list khong tra origin_id — map origin_name sang id client-side.
    const needle = String(originName || '').trim().toLowerCase();
    const hit = state.origins.find(item => String(item.name || '').trim().toLowerCase() === needle);
    return hit ? String(hit.id) : '';
  }
  function filteredProducts() {
    const query = state.filters.products.q.trim().toLowerCase();
    if (!query) return [...state.products];
    return state.products.filter(product => `${product.name} ${product.slug}`.toLowerCase().includes(query));
  }
  function renderProducts() {
    const filters = state.filters.products;
    const list = filteredProducts();
    const pages = Math.max(1, Math.ceil(list.length / filters.per));
    filters.page = Math.min(Math.max(1, filters.page), pages);
    const start = (filters.page - 1) * filters.per;
    const pageItems = list.slice(start, start + filters.per);
    $('#products-count').textContent = list.length ? `Hiển thị ${start + 1}–${start + pageItems.length} trong ${list.length} sản phẩm.` : 'Không tìm thấy sản phẩm nào.';

    const tbody = $('#products-tbody');
    if (!pageItems.length) {
      tbody.innerHTML = '<tr><td colspan="6"><p class="admin-empty">Chưa có sản phẩm.</p></td></tr>';
    } else {
      tbody.innerHTML = pageItems.map(product => {
        const qty = Number(product.quantity_on_hand) || 0;
        const active = product.is_active === true;
        return `<tr>
        <td data-label="Sản phẩm"><strong>${escape(product.name)}</strong><span class="sub">${escape(product.slug)}</span></td>
        <td data-label="Vùng trồng">${escape(product.origin_name || '—')}</td>
        <td data-label="Giá từ" class="num">${escape(money(product.minimum_price_vnd))}</td>
        <td data-label="Tồn tổng" class="num ${qty <= 0 ? 'stock-out' : 'stock-ok'}">${num(qty)}${qty <= 0 ? ' · Hết' : ''}</td>
        <td data-label="Trạng thái"><span class="${active ? 'sale-on' : 'sale-off'}">${active ? 'Đang bán' : 'Đang ẩn'}</span></td>
        <td><div class="row-actions">
          <label class="switch"><input type="checkbox" data-toggle-product="${product.id}" ${active ? 'checked' : ''} aria-label="${active ? 'Ẩn' : 'Hiện'} sản phẩm ${escape(product.name)}"><span class="switch-track" aria-hidden="true"></span></label>
          <button type="button" class="mini-btn" data-edit-product="${product.id}">Sửa</button>
        </div></td>
      </tr>`;
      }).join('');
    }
    renderPager($('#products-pager'), filters.page, pages, page => { filters.page = page; renderProducts(); });
  }

  const productDialog = $('#product-dialog');
  const productForm = $('#product-form');
  function openProductDialog(product = null) {
    productForm.reset();
    $$('.field-error', productForm).forEach(el => { el.textContent = ''; });
    $('#product-error').hidden = true;
    $$('.field', productForm).forEach(field => field.classList.remove('is-invalid'));
    productForm.elements.id.value = product?.id || '';
    $('#product-dialog-title').textContent = product ? 'Sửa sản phẩm' : 'Thêm sản phẩm';
    if (product) {
      productForm.elements.name.value = product.name || '';
      productForm.elements.slug.value = product.slug || '';
      productForm.elements.description.value = product.description || '';
      // API list khong tra origin_id / 5 chi so vi => map ten vung, giu mac dinh 3.
      productForm.elements.origin_id.value = findOriginId(product.origin_name);
    }
    if (typeof productDialog.showModal === 'function') productDialog.showModal();
    $('#product-name').focus();
  }

  /* ------------------------------------------------- ton kho */
  function lotLabel(lot) {
    // pool_kind 'batch' => hien ma batch; 'unbatched' => "Chua gan lo" (cam lo tieng Anh).
    if (lot.pool_kind === 'batch' && lot.roast_batch_id != null) return `#${lot.roast_batch_id}`;
    return 'Chưa gán lô';
  }
  function filteredLots() {
    const filters = state.filters.inventory;
    const query = filters.q.trim().toLowerCase();
    let list = state.lots.filter(lot => {
      if (filters.filter === 'out' && Number(lot.quantity_on_hand) > 0) return false;
      if (filters.filter === 'unbatched' && lot.pool_kind !== 'unbatched') return false;
      if (query && !`${lot.product_name} ${lot.variant_label}`.toLowerCase().includes(query)) return false;
      return true;
    });
    if (filters.sort === 'qty_desc') list.sort((a, b) => Number(b.quantity_on_hand) - Number(a.quantity_on_hand));
    else if (filters.sort === 'name') list.sort((a, b) => String(a.product_name).localeCompare(String(b.product_name), 'vi'));
    else list.sort((a, b) => Number(a.quantity_on_hand) - Number(b.quantity_on_hand));
    return list;
  }
  function renderInventory() {
    const filters = state.filters.inventory;
    const list = filteredLots();
    const pages = Math.max(1, Math.ceil(list.length / filters.per));
    filters.page = Math.min(Math.max(1, filters.page), pages);
    const start = (filters.page - 1) * filters.per;
    const pageItems = list.slice(start, start + filters.per);
    $('#inventory-count').textContent = list.length ? `Hiển thị ${start + 1}–${start + pageItems.length} trong ${list.length} SKU.` : 'Không tìm thấy SKU nào.';
    // TODO(backend): loc "Sap het" + nguong canh bao + lich su SKU + nut gan lo can API moi — hien an.

    const tbody = $('#inventory-tbody');
    if (!pageItems.length) {
      tbody.innerHTML = '<tr><td colspan="4"><p class="admin-empty">Chưa có dữ liệu tồn kho.</p></td></tr>';
    } else {
      tbody.innerHTML = pageItems.map(lot => {
        const qty = Number(lot.quantity_on_hand) || 0;
        return `<tr>
        <td data-label="Sản phẩm"><strong>${escape(lot.product_name)}</strong><span class="sub">${escape(lot.variant_label)}</span></td>
        <td data-label="Mã lô">${escape(lotLabel(lot))}</td>
        <td data-label="Tồn kho" class="num ${qty <= 0 ? 'stock-out' : 'stock-ok'}" data-qty-for="${lot.id}">${num(qty)}${qty <= 0 ? ' · Hết' : ''}</td>
        <td><form class="adjust-form" data-lot-id="${lot.id}">
          <div class="stepper" role="group" aria-label="Điều chỉnh tồn ${escape(lot.product_name)}">
            <button type="button" data-step="-1" aria-label="Giảm 1">−</button>
            <input name="quantity_delta" type="number" step="1" value="0" aria-label="Số lượng điều chỉnh">
            <button type="button" data-step="1" aria-label="Tăng 1">+</button>
          </div>
          <input type="text" name="note" maxlength="200" placeholder="Ghi chú (bắt buộc)" aria-label="Ghi chú điều chỉnh" required>
          <button type="submit" class="mini-btn">Lưu</button>
        </form></td>
      </tr>`;
      }).join('');
    }
    renderPager($('#inventory-pager'), filters.page, pages, page => { filters.page = page; renderInventory(); });
  }

  /* ------------------------------------------------- ma giam gia */
  function couponValidity(coupon) {
    const from = coupon.starts_at ? fmtDay(coupon.starts_at) : '';
    const to = coupon.ends_at ? fmtDay(coupon.ends_at) : '';
    if (from && to) return `${from} – ${to}`;
    if (to) return `Đến ${to}`;
    if (from) return `Từ ${from}`;
    return '—';
  }
  function renderCoupons() {
    const query = state.filters.coupons.q.trim().toLowerCase();
    const list = query ? state.coupons.filter(c => String(c.code).toLowerCase().includes(query)) : [...state.coupons];
    $('#coupons-count').textContent = list.length ? `${list.length} mã giảm giá.` : 'Không tìm thấy mã nào.';

    const tbody = $('#coupons-tbody');
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7"><p class="admin-empty">Chưa có mã giảm giá.</p></td></tr>';
    } else {
      tbody.innerHTML = list.map(coupon => {
        const active = coupon.is_active === true || coupon.is_active === 't';
        const isPercent = coupon.coupon_type === 'percent';
        return `<tr>
        <td data-label="Mã"><span class="code">${escape(coupon.code)}</span><button type="button" class="copy-btn" data-copy="${escape(coupon.code)}" aria-label="Sao chép mã ${escape(coupon.code)}">⧉</button></td>
        <td data-label="Loại">${isPercent ? 'Phần trăm' : 'Số tiền'}</td>
        <td data-label="Giá trị" class="num">${isPercent ? `${escape(String(coupon.percent_value))}%` : escape(money(coupon.fixed_value_vnd))}</td>
        <td data-label="Đơn tối thiểu" class="num">${escape(money(coupon.minimum_subtotal_vnd))}</td>
        <td data-label="Hiệu lực">${escape(couponValidity(coupon))}</td>
        <td data-label="Trạng thái"><span class="${active ? 'sale-on' : 'sale-off'}">${active ? 'Đang bật' : 'Đang tắt'}</span></td>
        <td><div class="row-actions">
          <label class="switch"><input type="checkbox" data-toggle-coupon="${coupon.id}" ${active ? 'checked' : ''} aria-label="${active ? 'Tắt' : 'Bật'} mã ${escape(coupon.code)}"><span class="switch-track" aria-hidden="true"></span></label>
          <button type="button" class="mini-btn" data-edit-coupon="${coupon.id}">Sửa</button>
        </div></td>
      </tr>`;
      }).join('');
    }
    // TODO(backend): cot Da dung/Gioi han + HSD nhap tay can API moi — hien an.
  }

  const couponDialog = $('#coupon-dialog');
  const couponForm = $('#coupon-form');
  function syncCouponType() {
    const isPercent = couponForm.elements.coupon_type.value === 'percent';
    $('#coupon-percent-wrap').hidden = !isPercent;
    $('#coupon-fixed-wrap').hidden = isPercent;
  }
  function openCouponDialog(coupon = null) {
    couponForm.reset();
    couponForm.elements.coupon_type.value = 'percent';
    $$('.field-error', couponForm).forEach(el => { el.textContent = ''; });
    $('#coupon-error').hidden = true;
    $$('.field', couponForm).forEach(field => field.classList.remove('is-invalid'));
    couponForm.elements.id.value = coupon?.id || '';
    $('#coupon-dialog-title').textContent = coupon ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá';
    if (coupon) {
      couponForm.elements.code.value = coupon.code || '';
      couponForm.elements.coupon_type.value = coupon.coupon_type === 'fixed' ? 'fixed' : 'percent';
      couponForm.elements.percent_value.value = coupon.percent_value ?? '';
      couponForm.elements.fixed_value_vnd.value = coupon.fixed_value_vnd ?? '';
      couponForm.elements.minimum_subtotal_vnd.value = coupon.minimum_subtotal_vnd ?? 0;
    } else {
      couponForm.elements.minimum_subtotal_vnd.value = 0;
    }
    syncCouponType();
    if (typeof couponDialog.showModal === 'function') couponDialog.showModal();
    $('#coupon-code').focus();
  }

  /* ------------------------------------------------- tai du lieu */
  async function loadDashboard() {
    try {
      state.dashboard = await window.AdminApi.dashboard();
    } catch (error) { toast(errorMessage(error), 'error'); }
    renderOverview();
  }
  async function loadOrders() {
    skeletonRows($('#orders-tbody'), 6);
    try {
      state.orders = await window.CartApi.adminOrders('');
    } catch (error) {
      $('#orders-tbody').innerHTML = `<tr><td colspan="6"><p class="admin-empty">${escape(errorMessage(error))}</p></td></tr>`;
      return;
    }
    renderOrders();
  }
  async function loadProducts() {
    skeletonRows($('#products-tbody'), 6);
    try {
      state.products = await window.AdminApi.products('');
    } catch (error) {
      $('#products-tbody').innerHTML = `<tr><td colspan="6"><p class="admin-empty">${escape(errorMessage(error))}</p></td></tr>`;
      return;
    }
    renderProducts();
  }
  async function loadInventory() {
    skeletonRows($('#inventory-tbody'), 4);
    try {
      state.lots = await window.CartApi.adminInventory();
    } catch (error) {
      $('#inventory-tbody').innerHTML = `<tr><td colspan="4"><p class="admin-empty">${escape(errorMessage(error))}</p></td></tr>`;
      return;
    }
    renderInventory();
  }
  async function loadCoupons() {
    try {
      state.coupons = await window.AdminApi.coupons();
    } catch (error) {
      $('#coupons-tbody').innerHTML = `<tr><td colspan="7"><p class="admin-empty">${escape(errorMessage(error))}</p></td></tr>`;
      return;
    }
    renderCoupons();
  }
  async function loadContent() {
    try {
      const rows = await window.AdminApi.content();
      const form = $('#content-form');
      rows.forEach(row => {
        const field = form.elements.namedItem(row.content_key);
        if (field) field.value = row.content_value || '';
      });
    } catch (error) { toast(errorMessage(error), 'error'); }
  }

  function setUser(user) {
    state.user = user || null;
    const name = user?.full_name || user?.email || 'Quản trị';
    $('#side-user').textContent = name;
    const initial = shortName(name).charAt(0).toUpperCase() || 'A';
    $('#side-avatar').textContent = initial;
    $('#top-avatar').textContent = initial;
  }

  /* ------------------------------------------------- su kien */
  function wireEvents() {
    // Sidebar: doi tab + thu gon (nho localStorage) + drawer mobile.
    $$('[data-admin-tab]').forEach(tab => tab.addEventListener('click', () => gotoTab(tab.dataset.adminTab)));
    $$('[data-goto]').forEach(button => button.addEventListener('click', () => gotoTab(button.dataset.goto)));
    try {
      if (window.localStorage.getItem('sm-admin-collapsed') === '1') {
        shell.classList.add('is-collapsed');
        $('#collapse-btn').setAttribute('aria-expanded', 'false');
      }
    } catch (err) { /* bo qua khi khong doc duoc storage */ }
    $('#collapse-btn').addEventListener('click', () => {
      const collapsed = shell.classList.toggle('is-collapsed');
      $('#collapse-btn').setAttribute('aria-expanded', String(!collapsed));
      $('#collapse-btn').textContent = collapsed ? '»' : '«';
      try { window.localStorage.setItem('sm-admin-collapsed', collapsed ? '1' : '0'); } catch (err) { /* no-op */ }
    });
    $('#menu-btn').addEventListener('click', () => {
      const open = shell.classList.toggle('nav-open');
      $('#menu-btn').setAttribute('aria-expanded', String(open));
      $('#admin-scrim').hidden = !open;
    });
    $('#admin-scrim').addEventListener('click', () => {
      shell.classList.remove('nav-open');
      $('#menu-btn').setAttribute('aria-expanded', 'false');
      $('#admin-scrim').hidden = true;
    });

    // Topbar: ngay + search loc client-side theo tab hien tai.
    $('#topbar-date').textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    const topbarInput = $('#topbar-search');
    topbarInput.addEventListener('input', debounce(() => {
      const tab = state.tab;
      if (!TAB_SEARCH[tab]) return;
      state.filters[tab].q = topbarInput.value;
      const tabInput = $(TAB_SEARCH[tab]);
      if (tabInput) tabInput.value = topbarInput.value;
      if (state.filters[tab].page !== undefined) state.filters[tab].page = 1;
      ({ orders: renderOrders, products: renderProducts, inventory: renderInventory, coupons: renderCoupons })[tab]();
    }));

    // Quick action + nut tao moi.
    $('#quick-new-coupon').addEventListener('click', () => openCouponDialog());
    $('#quick-new-product').addEventListener('click', () => openProductDialog());
    $('#new-product').addEventListener('click', () => openProductDialog());
    $('#new-coupon').addEventListener('click', () => openCouponDialog());

    // Toolbar don hang.
    $('#orders-search').addEventListener('input', debounce(() => {
      state.filters.orders.q = $('#orders-search').value;
      if (state.tab === 'orders') topbarInput.value = state.filters.orders.q;
      state.filters.orders.page = 1;
      renderOrders();
    }));
    $$('input[name="ostatus"]').forEach(box => box.addEventListener('change', () => {
      if (box.checked) state.filters.orders.status.add(box.value);
      else state.filters.orders.status.delete(box.value);
      state.filters.orders.page = 1;
      renderOrders();
    }));
    $('#orders-from').addEventListener('change', () => { state.filters.orders.from = $('#orders-from').value; state.filters.orders.page = 1; renderOrders(); });
    $('#orders-to').addEventListener('change', () => { state.filters.orders.to = $('#orders-to').value; state.filters.orders.page = 1; renderOrders(); });
    $('#orders-sort').addEventListener('change', () => { state.filters.orders.sort = $('#orders-sort').value; renderOrders(); });
    $('#orders-per').addEventListener('change', () => { state.filters.orders.per = Number($('#orders-per').value) || 10; state.filters.orders.page = 1; renderOrders(); });
    $('#orders-reset').addEventListener('click', () => {
      state.filters.orders = { q: '', status: new Set(), from: '', to: '', sort: 'newest', per: 10, page: 1 };
      syncOrderToolbar();
      renderOrders();
    });

    // Toolbar san pham / kho / ma.
    $('#products-search').addEventListener('input', debounce(() => {
      state.filters.products.q = $('#products-search').value;
      if (state.tab === 'products') topbarInput.value = state.filters.products.q;
      state.filters.products.page = 1;
      renderProducts();
    }));
    $('#inventory-search').addEventListener('input', debounce(() => {
      state.filters.inventory.q = $('#inventory-search').value;
      if (state.tab === 'inventory') topbarInput.value = state.filters.inventory.q;
      state.filters.inventory.page = 1;
      renderInventory();
    }));
    $('#inventory-filter').addEventListener('change', () => { state.filters.inventory.filter = $('#inventory-filter').value; state.filters.inventory.page = 1; renderInventory(); });
    $('#inventory-sort').addEventListener('change', () => { state.filters.inventory.sort = $('#inventory-sort').value; renderInventory(); });
    $('#coupons-search').addEventListener('input', debounce(() => {
      state.filters.coupons.q = $('#coupons-search').value;
      if (state.tab === 'coupons') topbarInput.value = state.filters.coupons.q;
      renderCoupons();
    }));

    // Uy thac su kien cho cac nut render dong: xem, copy, sua, toggle, stepper.
    document.addEventListener('click', event => {
      const view = event.target.closest('[data-view]');
      if (view) { openOrder(view.dataset.view); return; }
      const copy = event.target.closest('[data-copy]');
      if (copy) { copyText(copy.dataset.copy, 'mã'); return; }
      const editProduct = event.target.closest('[data-edit-product]');
      if (editProduct) {
        const product = state.products.find(item => String(item.id) === editProduct.dataset.editProduct);
        if (product) openProductDialog(product);
        return;
      }
      const editCoupon = event.target.closest('[data-edit-coupon]');
      if (editCoupon) {
        const coupon = state.coupons.find(item => String(item.id) === editCoupon.dataset.editCoupon);
        if (coupon) openCouponDialog(coupon);
        return;
      }
      const stepper = event.target.closest('[data-step]');
      if (stepper) {
        const input = stepper.closest('.stepper')?.querySelector('input[name="quantity_delta"]');
        if (input) input.value = String((Number(input.value) || 0) + Number(stepper.dataset.step));
      }
      const closer = event.target.closest('[data-close-dialog]');
      if (closer) closer.closest('dialog')?.close();
    });
    // SPEC BR-16: san pham co don chi duoc AN — toggle optimistic + rollback, khong nut Xoa.
    document.addEventListener('change', async event => {
      const productToggle = event.target.closest('[data-toggle-product]');
      if (productToggle) {
        const id = productToggle.dataset.toggleProduct;
        const active = productToggle.checked;
        productToggle.disabled = true;
        try {
          await window.AdminApi.productActive(id, active);
          const product = state.products.find(item => String(item.id) === String(id));
          if (product) product.is_active = active;
          renderProducts();
          toast(active ? 'Đã hiện sản phẩm.' : 'Đã ẩn sản phẩm.', 'success');
        } catch (error) {
          productToggle.checked = !active;
          toast(errorMessage(error), 'error');
        } finally { productToggle.disabled = false; }
        return;
      }
      const couponToggle = event.target.closest('[data-toggle-coupon]');
      if (couponToggle) {
        const id = couponToggle.dataset.toggleCoupon;
        const active = couponToggle.checked;
        couponToggle.disabled = true;
        try {
          await window.AdminApi.couponActive(id, active);
          const coupon = state.coupons.find(item => String(item.id) === String(id));
          if (coupon) coupon.is_active = active;
          renderCoupons();
          toast(active ? 'Đã bật mã giảm giá.' : 'Đã tắt mã giảm giá.', 'success');
        } catch (error) {
          couponToggle.checked = !active;
          toast(errorMessage(error), 'error');
        } finally { couponToggle.disabled = false; }
      }
    });
    // Dieu chinh ton kho: delta + note bat buoc (mirror validate server).
    document.addEventListener('submit', async event => {
      const form = event.target.closest('[data-lot-id]');
      if (!form) return;
      event.preventDefault();
      const delta = Number(form.elements.quantity_delta.value);
      const note = String(form.elements.note.value || '').trim();
      if (!Number.isInteger(delta) || delta === 0) { toast('Nhập số lượng điều chỉnh khác 0.', 'error'); return; }
      if (!note) { toast('Ghi chú điều chỉnh là bắt buộc.', 'error'); return; }
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      try {
        const result = await window.CartApi.adminAdjustInventory({ lot_id: Number(form.dataset.lotId), quantity_delta: delta, note });
        const lot = state.lots.find(item => String(item.id) === String(result.lot_id));
        if (lot) lot.quantity_on_hand = result.quantity_on_hand;
        const cell = document.querySelector(`[data-qty-for="${result.lot_id}"]`);
        if (cell) {
          const qty = Number(result.quantity_on_hand) || 0;
          cell.className = `num ${qty <= 0 ? 'stock-out' : 'stock-ok'}`;
          cell.textContent = `${num(qty)}${qty <= 0 ? ' · Hết' : ''}`;
        }
        form.elements.quantity_delta.value = '0';
        form.elements.note.value = '';
        renderOverview();
        toast('Đã điều chỉnh tồn kho và ghi audit note.', 'success');
      } catch (error) { toast(errorMessage(error), 'error'); }
      finally { submit.disabled = false; }
    });

    // Dialog dong khi bam nen ngoai.
    $$('.admin-dialog').forEach(dialog => dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    }));
    couponForm.elements.coupon_type.addEventListener('change', syncCouponType);

    // Luu san pham: field BAM DUNG API (ten/slug/vung/mo ta/5 chi so vi).
    productForm.addEventListener('submit', async event => {
      event.preventDefault();
      $$('.field', productForm).forEach(field => field.classList.remove('is-invalid'));
      $$('.field-error', productForm).forEach(el => { el.textContent = ''; });
      const elements = productForm.elements;
      const profiles = ['acidity', 'body', 'sweetness', 'bitterness', 'aroma'].map(key => Number(elements[key].value));
      const payload = {
        name: elements.name.value.trim(),
        slug: elements.slug.value.trim(),
        origin_id: elements.origin_id.value ? Number(elements.origin_id.value) : '',
        description: elements.description.value.trim(),
        acidity: profiles[0], body: profiles[1], sweetness: profiles[2], bitterness: profiles[3], aroma: profiles[4],
      };
      const invalid = (name, message) => {
        const error = productForm.querySelector(`[data-error-for="${name}"]`);
        if (error) error.textContent = message;
        error?.closest('.field')?.classList.add('is-invalid');
      };
      let hasError = false;
      if (!payload.name || payload.name.length > 200) { invalid('name', 'Tên sản phẩm từ 1–200 ký tự.'); hasError = true; }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) { invalid('slug', 'Slug chỉ gồm chữ thường, số và gạch nối.'); hasError = true; }
      if (!Number.isInteger(payload.origin_id) || payload.origin_id < 1) { invalid('origin_id', 'Chọn vùng trồng.'); hasError = true; }
      if (!payload.description || payload.description.length > 1000) { invalid('description', 'Mô tả từ 1–1000 ký tự.'); hasError = true; }
      if (profiles.some(value => !Number.isInteger(value) || value < 1 || value > 5)) {
        const banner = $('#product-error');
        banner.textContent = 'Hồ sơ vị phải là số nguyên từ 1 đến 5.';
        banner.hidden = false;
        hasError = true;
      }
      if (hasError) return;
      const submit = $('#product-submit');
      submit.disabled = true;
      try {
        await window.AdminApi.saveProduct(payload, elements.id.value || null);
        productDialog.close();
        await loadProducts();
        toast('Đã lưu sản phẩm.', 'success');
      } catch (error) {
        const banner = $('#product-error');
        banner.textContent = errorMessage(error);
        banner.hidden = false;
      } finally { submit.disabled = false; }
    });

    // Luu ma giam gia: field BAM DUNG API (ma/loai/gia tri/don toi thieu).
    couponForm.addEventListener('submit', async event => {
      event.preventDefault();
      $$('.field', couponForm).forEach(field => field.classList.remove('is-invalid'));
      $$('.field-error', couponForm).forEach(el => { el.textContent = ''; });
      const elements = couponForm.elements;
      const type = elements.coupon_type.value === 'fixed' ? 'fixed' : 'percent';
      const payload = {
        code: elements.code.value.trim().toUpperCase(),
        coupon_type: type,
        percent_value: type === 'percent' ? Number(elements.percent_value.value) : null,
        fixed_value_vnd: type === 'fixed' ? Number(elements.fixed_value_vnd.value) : null,
        minimum_subtotal_vnd: Number(elements.minimum_subtotal_vnd.value),
      };
      const invalid = (name, message) => {
        const error = couponForm.querySelector(`[data-error-for="${name}"]`);
        if (error) error.textContent = message;
        error?.closest('.field')?.classList.add('is-invalid');
      };
      let hasError = false;
      if (!/^[A-Z0-9_-]{3,80}$/.test(payload.code)) { invalid('code', 'Mã 3–80 ký tự: chữ hoa, số, gạch nối/gạch dưới.'); hasError = true; }
      if (type === 'percent' && (!Number.isInteger(payload.percent_value) || payload.percent_value < 1 || payload.percent_value > 100)) { invalid('percent_value', '% giảm từ 1 đến 100.'); hasError = true; }
      if (type === 'fixed' && (!Number.isInteger(payload.fixed_value_vnd) || payload.fixed_value_vnd < 0)) { invalid('fixed_value_vnd', 'Số tiền giảm phải ≥ 0.'); hasError = true; }
      if (!Number.isInteger(payload.minimum_subtotal_vnd) || payload.minimum_subtotal_vnd < 0) { invalid('minimum_subtotal_vnd', 'Đơn tối thiểu phải ≥ 0.'); hasError = true; }
      if (hasError) return;
      const submit = $('#coupon-submit');
      submit.disabled = true;
      try {
        await window.AdminApi.saveCoupon(payload, elements.id.value || null);
        couponDialog.close();
        await loadCoupons();
        toast('Đã lưu mã giảm giá.', 'success');
      } catch (error) {
        const banner = $('#coupon-error');
        banner.textContent = errorMessage(error);
        banner.hidden = false;
      } finally { submit.disabled = false; }
    });

    // Luu noi dung gioi thieu.
    $('#content-form').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form).entries());
      const banner = $('#content-error');
      banner.hidden = true;
      const submit = $('#content-submit');
      submit.disabled = true;
      try {
        await window.AdminApi.saveContent(data);
        toast('Đã lưu nội dung cửa hàng.', 'success');
      } catch (error) {
        banner.textContent = errorMessage(error);
        banner.hidden = false;
      } finally { submit.disabled = false; }
    });

    // Dang xuat co confirm.
    $('#logout-btn').addEventListener('click', async () => {
      const name = shortName(state.user?.full_name);
      const ok = typeof SM.confirm === 'function'
        ? await SM.confirm({ title: `Đăng xuất nhé, ${name}?`, message: 'Bạn sẽ cần đăng nhập lại để vào khu vực quản trị.', confirmLabel: 'Đăng xuất', danger: true })
        : window.confirm('Đăng xuất khỏi khu vực quản trị?');
      if (!ok) return;
      try { await window.AccountApi.logout(); }
      catch (err) { /* van tai lai de xoa trang thai console */ }
      window.location.reload();
    });
  }

  /* ------------------------------------------------- khoi dong */
  async function enterConsole(session) {
    setUser(session.user);
    $('#login-view').hidden = true;
    shell.hidden = false;
    try {
      const options = await window.AdminApi.productOptions();
      state.origins = Array.isArray(options.origins) ? options.origins : [];
      $('#product-origin').replaceChildren(...state.origins.map(item => new Option(item.name, item.id)));
    } catch (error) { toast(errorMessage(error), 'error'); }
    syncOrderToolbar();
    gotoTab(state.tab);
    await Promise.allSettled([loadDashboard(), loadOrders(), loadProducts(), loadCoupons(), loadContent(), loadInventory()]);
    // Ve lai tong quan sau khi tat ca du lieu ve (preview + banner can orders/lots).
    renderOverview();
    showStatus('');
  }

  async function start() {
    wireEvents();
    readHash();
    $('#topbar-date').textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    $('#login-form').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const banner = $('#login-error');
      banner.hidden = true;
      const submit = $('#login-submit');
      submit.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        const session = await window.AccountApi.login(data);
        if (session.user?.role !== 'admin') {
          try { await window.AccountApi.logout(); } catch (err) { /* no-op */ }
          throw new Error('Tài khoản này không có quyền quản trị.');
        }
        await enterConsole(session);
      } catch (error) {
        banner.textContent = errorMessage(error);
        banner.hidden = false;
      } finally { submit.disabled = false; }
    });

    try {
      const session = await window.AccountApi.session();
      if (session.user?.role !== 'admin') throw Object.assign(new Error('Bạn không có quyền quản trị.'), { status: 403 });
      await enterConsole(session);
    } catch (error) {
      // Chua login hoac khong phai admin => hien cong dang nhap, an console.
      $('#login-view').hidden = false;
      shell.hidden = true;
      if (error.status !== 401 && error.status !== 403) showStatus(errorMessage(error), 'error');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
