(() => {
  'use strict';

  const PAGE_SIZE = 10;

  const status = document.querySelector('#status');
  const container = document.querySelector('#orders');
  const authBox = document.querySelector('#orders-auth');
  const body = document.querySelector('#orders-body');
  const countLine = document.querySelector('#orders-count');
  const moreButton = document.querySelector('#orders-more');
  const clearButton = document.querySelector('#orders-clear');
  const searchInput = document.querySelector('#orders-q');
  const statusSelect = document.querySelector('#orders-status');
  const rangeSelect = document.querySelector('#orders-range');
  const sortSelect = document.querySelector('#orders-sort');

  const helpers = () => window.SmReorder || {};
  const esc = value => (helpers().escapeHtml || (input => String(input ?? '')))(value);
  const money = value => (helpers().money || (input => `${Number(input) || 0}đ`))(value);
  const fmtDate = value => (helpers().fmtDate || (() => ''))(value);
  const shortCode = value => (helpers().shortCode || (input => String(input || '')))(value);
  const badge = value => (helpers().badge || (() => ''))(value);

  function toast(message, options) {
    if (window.SM && typeof window.SM.toast === 'function') window.SM.toast(message, options);
  }

  let allOrders = [];
  let visible = PAGE_SIZE;
  let searchTimer = 0;

  function renderSkeletons() {
    container.replaceChildren();
    for (let index = 0; index < 3; index++) {
      const card = document.createElement('div');
      card.className = 'card skeleton-row';
      card.setAttribute('aria-hidden', 'true');
      card.innerHTML = '<div class="sm-skeleton" style="width:104px;height:84px"></div>' +
        '<div><div class="sm-skeleton sm-skeleton-line" style="width:45%"></div>' +
        '<div class="sm-skeleton sm-skeleton-line" style="width:70%"></div></div>' +
        '<div class="sm-skeleton" style="width:90px;height:32px"></div>';
      container.append(card);
    }
  }

  function orderCard(order) {
    const card = document.createElement('article');
    card.className = 'card card-hover order-card';
    card.innerHTML = '<div class="order-thumbs" aria-hidden="true"></div>';
    const info = document.createElement('div');
    info.className = 'order-info';
    // TODO(backend): API /account/orders chưa trả món trong đơn nên card chưa có
    // thumbnail món; chỉ hiện monogram SM nền kem.
    info.innerHTML = `<h2 class="order-code"><a href="/account/order/?code=${encodeURIComponent(order.order_code || '')}">${esc(shortCode(order.order_code))}</a></h2>` +
      `<p class="order-meta">${esc(fmtDate(order.created_at))} · Mã đầy đủ: ${esc(order.order_code || '')}</p>`;
    const badgeHtml = badge(order.status);
    if (badgeHtml) info.insertAdjacentHTML('beforeend', badgeHtml);
    if (order.payment_status) {
      info.insertAdjacentHTML('beforeend', `<p class="order-pay">${order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>`);
    }
    card.append(info);
    const side = document.createElement('div');
    side.className = 'order-side';
    side.innerHTML = `<span class="order-total">${esc(money(order.grand_total_vnd))}</span>`;
    const actions = document.createElement('div');
    actions.className = 'order-actions';
    const detail = document.createElement('a');
    detail.className = 'button button-sm button-outline';
    detail.href = `/account/order/?code=${encodeURIComponent(order.order_code || '')}`;
    detail.textContent = 'Chi tiết';
    const buyback = document.createElement('button');
    buyback.className = 'button button-sm';
    buyback.type = 'button';
    buyback.textContent = 'Mua lại';
    buyback.addEventListener('click', () => reorderOrder(order.order_code, buyback));
    actions.append(detail, buyback);
    side.append(actions);
    card.append(side);
    if (window.SM && typeof window.SM.reveal === 'function') window.SM.reveal(card);
    else card.classList.add('is-visible');
    return card;
  }

  async function reorderOrder(code, button) {
    if (!code || !window.CartApi || !helpers().reorderItems) return;
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Đang thêm…';
    try {
      const order = await window.CartApi.accountOrder(code);
      const items = Array.isArray(order.items) ? order.items : [];
      await helpers().reorderItems(items.map(item => ({
        product_name: item.product_name,
        variant_label: item.variant_label,
        grind_label: item.grind_label,
        quantity: item.quantity,
      })));
    } catch (error) {
      toast((error && error.message) || 'Không tải được chi tiết đơn để mua lại.', { type: 'error' });
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  function filtered() {
    const query = searchInput.value.trim().toLowerCase();
    const wantedStatus = statusSelect.value;
    const rangeDays = rangeSelect.value === 'all' ? 0 : Number(rangeSelect.value);
    const now = Date.now();
    let list = allOrders.filter(order => {
      if (wantedStatus && String(order.status) !== wantedStatus) return false;
      if (query && !String(order.order_code || '').toLowerCase().includes(query)) return false;
      if (rangeDays > 0) {
        const time = new Date(order.created_at).getTime();
        if (Number.isNaN(time) || now - time > rangeDays * 86400000) return false;
      }
      return true;
    });
    const sort = sortSelect.value;
    if (sort === 'oldest') list = [...list].reverse();
    else if (sort === 'value') list = [...list].sort((a, b) => (Number(b.grand_total_vnd) || 0) - (Number(a.grand_total_vnd) || 0));
    return list;
  }

  function render() {
    const list = filtered();
    const hasFilter = Boolean(searchInput.value.trim() || statusSelect.value || rangeSelect.value !== 'all' || sortSelect.value !== 'newest');
    clearButton.hidden = !hasFilter;
    countLine.textContent = list.length ? `Tìm thấy ${list.length} đơn hàng.` : '';
    container.replaceChildren();
    if (!allOrders.length) {
      const empty = document.createElement('div');
      empty.className = 'card empty-state';
      empty.innerHTML = '<img src="/assets/ui/icon-bean.svg" alt="" width="72" height="72" loading="lazy">' +
        '<h3>Bạn chưa có đơn nào.</h3><p>Bắt đầu với một mẻ rang mới từ Đà Lạt nhé.</p>' +
        '<p><a class="button" href="/catalog/">Khám phá cửa hàng</a></p>';
      empty.querySelector('img').addEventListener('error', event => event.target.remove(), { once: true });
      container.append(empty);
      moreButton.hidden = true;
      return;
    }
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'card empty-state';
      // TODO(asset): empty-search.svg chưa có — dùng tạm icon hạt cà phê.
      empty.innerHTML = '<img src="/assets/ui/icon-bean.svg" alt="" width="72" height="72" loading="lazy">' +
        '<h3>Không tìm thấy đơn phù hợp.</h3><p>Thử đổi từ khóa hoặc nới điều kiện lọc nhé.</p>';
      empty.querySelector('img').addEventListener('error', event => event.target.remove(), { once: true });
      container.append(empty);
      moreButton.hidden = true;
      return;
    }
    list.slice(0, visible).forEach(order => container.append(orderCard(order)));
    moreButton.hidden = visible >= list.length;
    syncUrl();
  }

  function syncUrl() {
    try {
      const url = new URL(window.location.href);
      const query = searchInput.value.trim();
      if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
      if (statusSelect.value) url.searchParams.set('status', statusSelect.value); else url.searchParams.delete('status');
      if (rangeSelect.value !== 'all') url.searchParams.set('range', rangeSelect.value); else url.searchParams.delete('range');
      if (sortSelect.value !== 'newest') url.searchParams.set('sort', sortSelect.value); else url.searchParams.delete('sort');
      window.history.replaceState({}, '', url);
    } catch { /* no-op */ }
  }

  function applyUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('q')) searchInput.value = params.get('q');
      const validStatus = ['pending', 'confirmed', 'roasting', 'shipping', 'completed', 'cancelled'];
      if (validStatus.includes(params.get('status'))) statusSelect.value = params.get('status');
      if (['all', '30', '180'].includes(params.get('range'))) rangeSelect.value = params.get('range');
      if (['newest', 'oldest', 'value'].includes(params.get('sort'))) sortSelect.value = params.get('sort');
    } catch { /* no-op */ }
  }

  document.querySelector('#orders-toolbar').addEventListener('submit', event => event.preventDefault());
  searchInput.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => { visible = PAGE_SIZE; render(); }, 300);
  });
  [statusSelect, rangeSelect, sortSelect].forEach(select => select.addEventListener('change', () => { visible = PAGE_SIZE; render(); }));
  moreButton.addEventListener('click', () => { visible += PAGE_SIZE; render(); });
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    statusSelect.value = '';
    rangeSelect.value = 'all';
    sortSelect.value = 'newest';
    visible = PAGE_SIZE;
    render();
  });

  (async () => {
    applyUrl();
    renderSkeletons();
    try {
      await window.CartApi.session();
      const orders = await window.CartApi.accountOrders();
      allOrders = Array.isArray(orders) ? orders : [];
      status.textContent = allOrders.length ? `${allOrders.length} đơn hàng.` : 'Bạn chưa có đơn hàng nào.';
      authBox.hidden = true;
      body.hidden = false;
      render();
    } catch (error) {
      container.replaceChildren();
      if (error && error.status === 401) {
        status.textContent = 'Vui lòng đăng nhập để xem đơn hàng.';
        authBox.hidden = false;
        body.hidden = true;
      } else {
        status.textContent = (error && error.message) || 'Không thể tải đơn hàng lúc này.';
        countLine.textContent = '';
      }
    }
  })();
})();
