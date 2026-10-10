(() => {
  'use strict';

  const status = document.querySelector('#status');
  const detail = document.querySelector('#order-detail');
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code') || '';

  const helpers = () => window.SmReorder || {};
  const esc = value => (helpers().escapeHtml || (input => String(input ?? '')))(value);
  const money = value => (helpers().money || (input => `${Number(input) || 0}đ`))(value);
  const fmtDateTime = value => (helpers().fmtDateTime || (() => ''))(value);
  const badge = value => (helpers().badge || (() => ''))(value);

  function toast(message, options) {
    if (window.SM && typeof window.SM.toast === 'function') window.SM.toast(message, options);
  }

  function showError(message, loginHint) {
    detail.replaceChildren();
    status.textContent = message;
    const box = document.createElement('div');
    box.className = 'card empty-state';
    box.innerHTML = '<img src="/assets/ui/order-not-found.svg" alt="" width="72" height="72" loading="lazy">' +
      `<h3>${esc(message)}</h3>` +
      (loginHint
        ? '<p><a class="button" href="/account/">Đăng nhập để tiếp tục</a> <a class="button button-outline" href="/orders/lookup/">Tra cứu bằng mã đơn</a></p>'
        : '<p><a class="button button-outline" href="/account/orders.html">Về danh sách đơn</a></p>');
    box.querySelector('img').addEventListener('error', event => event.target.remove(), { once: true });
    detail.append(box);
  }

  function paymentLabel(method, paymentStatus) {
    if (paymentStatus === 'paid') return 'Đã thanh toán';
    if (method === 'bank') return 'Chuyển khoản (chưa thanh toán)';
    if (method === 'cod') return 'Thanh toán khi nhận hàng';
    return 'Chưa thanh toán';
  }

  function addressLines(shipping) {
    if (!shipping) return [];
    const street = [shipping.address_line1, shipping.address_line2].filter(Boolean).join(', ');
    const area = [shipping.ward, shipping.district, shipping.province_city].filter(Boolean).join(', ');
    return [street, area].filter(Boolean);
  }

  async function render(order) {
    detail.replaceChildren();
    status.textContent = `Đặt lúc ${fmtDateTime(order.created_at)}.`;

    // Thẻ tóm tắt + timeline dùng chung.
    const journey = document.createElement('section');
    journey.className = 'card timeline-card';
    const badgeHtml = badge(order.status);
    journey.innerHTML = '<h3>Hành trình đơn hàng</h3><div class="detail-summary"></div><div class="timeline-slot"></div>';
    const summary = journey.querySelector('.detail-summary');
    summary.innerHTML = `<div><div class="detail-code-row"><h2>${esc(order.order_code)}</h2><button class="button button-sm button-outline copy-btn" type="button">Sao chép mã</button></div>` +
      `<p class="detail-meta">${esc(fmtDateTime(order.created_at))}${order.payment_status ? ` · ${esc(paymentLabel(order.payment_method, order.payment_status))}` : ''}</p></div>`;
    if (badgeHtml) summary.insertAdjacentHTML('beforeend', badgeHtml);
    summary.querySelector('.copy-btn').addEventListener('click', async event => {
      const button = event.currentTarget;
      try {
        await navigator.clipboard.writeText(String(order.order_code || ''));
        toast('Đã sao chép mã đơn.', { type: 'success' });
      } catch {
        toast('Không sao chép được. Giữ để chọn mã nhé.', { type: 'warning' });
      }
      button.blur();
    });
    detail.append(journey);
    // Timeline: API chưa trả lịch sử mốc thời gian từng bước nên chỉ truyền status;
    // các mốc giờ ẩn (không bịa) — xem TODO backend dưới.
    // TODO(backend): API /account/orders/{code} chưa trả order_status_history nên
    // timeline chưa có mốc giờ từng bước (times/descs). Hiện chỉ tô trạng thái.
    if (window.SM && typeof window.SM.renderTimeline === 'function') {
      window.SM.renderTimeline(journey.querySelector('.timeline-slot'), { status: order.status });
    }

    const grid = document.createElement('div');
    grid.className = 'detail-grid';

    // Món đã đặt.
    const itemsCard = document.createElement('section');
    itemsCard.className = 'card detail-card';
    itemsCard.innerHTML = '<h3>Món đã đặt</h3><div class="item-list"></div>';
    const itemList = itemsCard.querySelector('.item-list');
    const items = Array.isArray(order.items) ? order.items : [];
    if (!items.length) {
      itemList.innerHTML = '<p class="hint">Đơn hàng chưa có món nào.</p>';
    }
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'item-row';
      const thumb = document.createElement('div');
      thumb.className = 'item-thumb';
      thumb.setAttribute('aria-hidden', 'true');
      row.append(thumb);
      const copy = document.createElement('div');
      copy.innerHTML = `<h4>${esc(item.product_name || 'Cà phê Sương Mai')}</h4>` +
        `<p>${esc([item.variant_label, item.grind_label].filter(Boolean).join(' · '))} · x${Number(item.quantity) || 1}</p>`;
      row.append(copy);
      const price = document.createElement('div');
      price.className = 'item-price';
      price.innerHTML = `<strong>${esc(money(item.line_total_vnd))}</strong><span>${esc(money(item.unit_price_vnd))}/gói</span>`;
      row.append(price);
      itemList.append(row);
      // Thumbnail that theo slug (async, không chặn render).
      if (helpers().resolveSlug && helpers().thumbImg) {
        helpers().resolveSlug(item.product_name).then(slug => {
          if (!slug) return;
          const img = helpers().thumbImg(slug, item.product_name, 112, 112);
          if (img) thumb.append(img);
        });
      }
    }
    grid.append(itemsCard);

    // Thanh toán + giao hàng.
    const side = document.createElement('div');
    side.className = 'order-detail';
    const payCard = document.createElement('section');
    payCard.className = 'card detail-card';
    // Vận đơn + hóa đơn: CHỈ hiện khi API trả field thật.
    // TODO(backend): tracking_number + invoice_url chưa có trong API nên chưa hiện.
    payCard.innerHTML = '<h3>Thanh toán</h3><dl class="money-rows"></dl>';
    const rows = payCard.querySelector('.money-rows');
    const moneyRow = (label, value, grand = false) => {
      const wrap = document.createElement('div');
      if (grand) wrap.className = 'grand';
      wrap.innerHTML = `<dt>${esc(label)}</dt><dd>${esc(money(value))}</dd>`;
      rows.append(wrap);
    };
    moneyRow('Tạm tính', order.subtotal_vnd);
    moneyRow('Giảm giá', order.discount_vnd);
    moneyRow('Vận chuyển', order.shipping_vnd);
    moneyRow('Tổng cộng', order.grand_total_vnd, true);
    side.append(payCard);

    const ship = order.shipping || {};
    if (ship.recipient_name || ship.phone || ship.address_line1) {
      const shipCard = document.createElement('section');
      shipCard.className = 'card detail-card';
      shipCard.innerHTML = '<h3>Giao hàng</h3><div class="ship-lines"></div>';
      const lines = shipCard.querySelector('.ship-lines');
      if (ship.recipient_name || ship.phone) {
        lines.insertAdjacentHTML('beforeend', `<p><strong>${esc(ship.recipient_name || '')}</strong>${ship.phone ? ` · ${esc(ship.phone)}` : ''}</p>`);
      }
      addressLines(ship).forEach(line => lines.insertAdjacentHTML('beforeend', `<p>${esc(line)}</p>`));
      side.append(shipCard);
    }
    grid.append(side);
    detail.append(grid);

    // Hành động: mua lại + hỗ trợ.
    const actions = document.createElement('div');
    actions.className = 'detail-actions';
    const buyback = document.createElement('button');
    buyback.className = 'button';
    buyback.type = 'button';
    buyback.textContent = `Mua lại ${items.length ? `(${items.length} món)` : ''}`.trim();
    buyback.disabled = !items.length;
    buyback.addEventListener('click', async () => {
      if (!helpers().reorderItems) return;
      buyback.disabled = true;
      const original = buyback.textContent;
      buyback.textContent = 'Đang thêm…';
      try {
        await helpers().reorderItems(items.map(item => ({
          product_name: item.product_name,
          variant_label: item.variant_label,
          grind_label: item.grind_label,
          quantity: item.quantity,
        })));
      } finally {
        buyback.disabled = false;
        buyback.textContent = original;
      }
    });
    const support = document.createElement('a');
    support.className = 'button button-outline';
    support.href = '/orders/lookup/';
    support.textContent = 'Liên hệ hỗ trợ';
    actions.append(buyback, support);
    detail.append(actions);
  }

  (async () => {
    if (!code) { showError('Thiếu mã đơn hàng.'); return; }
    try {
      await window.CartApi.session();
      const order = await window.CartApi.accountOrder(code);
      await render(order);
    } catch (error) {
      if (error && error.status === 401) showError('Vui lòng đăng nhập để xem đơn hàng.', true);
      else if (error && error.status === 404) showError('Không tìm thấy đơn hàng này.');
      else showError((error && error.message) || 'Không thể tải đơn hàng lúc này.');
    }
  })();
})();
