(() => {
  'use strict';

  const content = document.querySelector('#cart-content');
  const status = document.querySelector('#cart-status');
  const modeIndicator = document.querySelector('#cart-mode');
  const stickybar = document.querySelector('#cart-stickybar');
  const stickybarValue = document.querySelector('#cart-stickybar-value');
  const MAX_QTY = 20;
  const LOW_STOCK = 10;

  let cart = null;
  let busy = false;
  let couponCode = '';
  let couponBusy = false;
  let couponMessage = '';
  let couponMessageKind = '';
  let lovedCache = null;
  let lovedFailed = false;
  let grindCache = null;

  // TODO(asset): cac slug chua co file -alt.webp trong /assets/products/
  // (kiambu-caramel-demo, guji-jasmine-demo, sidamo-citrus-demo,
  // cau-dat-filter-demo, cau-dat-natural-demo, cau-dat-washed-demo,
  // dak-lak-dam-demo, son-la-dark-demo, son-la-hoa-qua-demo, son-la-honey-demo,
  // ca-phe-demo-02) thi hover chi phong to anh chinh, khong crossfade.
  const PRODUCT_IMAGES = {
    'kirinyaga-berry-demo': { main: 'kirinyaga-berry-demo.webp', alt: 'kirinyaga-berry-demo-alt.webp' },
    'kiambu-caramel-demo': { main: 'kiambu-caramel-demo.webp' },
    'guji-jasmine-demo': { main: 'guji-jasmine-demo.webp' },
    'sidamo-citrus-demo': { main: 'sidamo-citrus-demo.webp' },
    'yirgacheffe-floral-demo': { main: 'yirgacheffe-floral-demo.webp', alt: 'yirgacheffe-floral-demo-alt.webp' },
    'nyeri-berry-demo': { main: 'nyeri-berry-demo.webp', alt: 'nyeri-berry-demo-alt.webp' },
    'cau-dat-espresso-demo': { main: 'cau-dat-espresso-demo.webp', alt: 'cau-dat-espresso-demo-alt.webp' },
    'cau-dat-honey-demo': { main: 'cau-dat-honey-demo.webp', alt: 'cau-dat-honey-demo-alt.webp' },
    'cau-dat-filter-demo': { main: 'cau-dat-filter-demo.webp' },
    'cau-dat-natural-demo': { main: 'cau-dat-natural-demo.webp' },
    'cau-dat-washed-demo': { main: 'cau-dat-washed-demo.webp' },
    'dak-lak-blend-demo': { main: 'dak-lak-blend-demo.webp', alt: 'dak-lak-blend-demo-alt.webp' },
    'dak-lak-phin-demo': { main: 'dak-lak-phin-demo.webp', alt: 'dak-lak-phin-demo-alt.webp' },
    'dak-lak-dam-demo': { main: 'dak-lak-dam-demo.webp' },
    'son-la-dark-demo': { main: 'son-la-dark-demo.webp' },
    'son-la-hoa-qua-demo': { main: 'son-la-hoa-qua-demo.webp' },
    'son-la-honey-demo': { main: 'son-la-honey-demo.webp' },
    'ca-phe-demo-01': { main: 'ca-phe-demo-01.webp', alt: 'ca-phe-demo-01-alt.webp' },
    'ca-phe-demo-02': { main: 'ca-phe-demo-02.webp' },
  };

  // -- Tien ich render -------------------------------------------------------
  function money(value) {
    const amount = Number(value);
    if (!Number.isSafeInteger(amount) || amount < 0) return 'Giá đang cập nhật';
    return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  function toast(message, options) {
    if (window.SM && typeof window.SM.toast === 'function') window.SM.toast(message, options);
    else window.alert(message);
  }

  function setBusy(next) {
    busy = next;
    if (content) content.setAttribute('aria-busy', next ? 'true' : 'false');
  }

  function showMessage(message, kind = '') {
    if (!status) return;
    status.textContent = message;
    status.className = `status${kind ? ` ${kind}` : ''}`;
    status.hidden = !message;
  }

  function errorMessage(error) {
    const conflicts = error?.details?.conflicts || [];
    if (conflicts.length) {
      const maxes = conflicts.map(item => item.max_acceptable_quantity).filter(value => value != null);
      return `${error.message} Tối đa dòng bị ảnh hưởng: ${maxes.join(', ')}.`;
    }
    if (error?.details?.max_acceptable_quantity != null) {
      return `${error.message} Tối đa còn lại: ${error.details.max_acceptable_quantity}.`;
    }
    const fields = Object.values(error?.fields || {}).flat();
    return fields.length ? fields.join(' ') : (error?.message || 'Không thể cập nhật giỏ hàng.');
  }

  function lineCount() {
    return (cart?.lines || []).reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
  }

  function refreshBadge() {
    if (window.SM && typeof window.SM.updateCartBadge === 'function') window.SM.updateCartBadge(lineCount());
  }

  function productImage(slug, kind) {
    const entry = PRODUCT_IMAGES[String(slug || '')];
    if (!entry) return null;
    const file = kind === 'alt' ? entry.alt : entry.main;
    return file ? `/assets/products/${file}` : null;
  }

  function lineImage(line, kind) {
    const fromProduct = line.product?.slug ? productImage(line.product.slug, kind) : null;
    if (fromProduct) return fromProduct;
    // Cart API khong tra slug: suy tu product_id qua danh sach "Duoc yeu men nhat"
    // da tai; khong doan slug moi.
    const loved = Array.isArray(lovedCache) ? lovedCache : [];
    const match = loved.find(product => String(product.id) === String(line.product_id));
    return match ? productImage(match.slug, kind) : null;
  }

  function lineTags(line) {
    const tags = Array.isArray(line.product?.flavor_tags) ? line.product.flavor_tags : [];
    return tags.slice(0, 3).map(tag => (typeof tag === 'string' ? tag : tag?.name)).filter(Boolean);
  }

  function stockState(line) {
    if (!line.available) return { tone: 'is-out', text: 'Tạm hết hàng' };
    const stock = Number(line.available_quantity);
    if (Number.isSafeInteger(stock) && stock < LOW_STOCK) return { tone: 'is-low', text: `Sắp hết · còn ${stock}` };
    if (Number.isSafeInteger(stock)) return { tone: 'is-ok', text: `Còn hàng · ${stock} gói` };
    return { tone: 'is-ok', text: 'Còn hàng' };
  }

  // -- Coupon ----------------------------------------------------------------
  function renderCoupon() {
    const applied = cart?.coupon?.code ? String(cart.coupon.code) : '';
    if (applied) {
      return `<div class="coupon-applied"><span>Mã ${escapeHtml(applied)}</span><button class="text-button" id="clear-coupon" type="button">Gỡ mã</button></div>`;
    }
    return `<div class="coupon-box"><label for="coupon-code">Mã giảm giá</label><div class="coupon-row"><input id="coupon-code" type="text" maxlength="80" placeholder="WELCOME10" autocomplete="off" spellcheck="false" value="${escapeHtml(couponCode)}"><button id="apply-coupon" class="button" type="button"${couponBusy ? ' disabled' : ''}>${couponBusy ? 'Đang áp…' : 'Áp dụng'}</button></div>${couponMessage ? `<p class="coupon-feedback ${couponMessageKind}" role="status">${escapeHtml(couponMessage)}</p>` : ''}</div>`;
  }

  function bindCoupon() {
    const apply = content.querySelector('#apply-coupon');
    const input = content.querySelector('#coupon-code');
    const clear = content.querySelector('#clear-coupon');
    if (apply && input) {
      apply.addEventListener('click', () => applyCoupon(input.value));
      input.addEventListener('input', () => { couponCode = input.value; });
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') { event.preventDefault(); applyCoupon(input.value); }
      });
    }
    if (clear) clear.addEventListener('click', () => run(() => window.CartApi.clearCoupon(), 'Đã gỡ mã giảm giá.'));
  }

  function applyCoupon(code) {
    const value = String(code || '').trim();
    if (!value) {
      couponMessage = 'Bạn nhập mã giảm giá trước nhé.';
      couponMessageKind = 'is-error';
      render();
      const input = content.querySelector('#coupon-code');
      if (input) input.focus();
      return Promise.resolve();
    }
    couponBusy = true;
    couponMessage = '';
    couponMessageKind = '';
    render();
    return window.CartApi.applyCoupon(value)
      .then(response => {
        cart = response;
        couponCode = '';
        couponMessage = `Đã áp dụng mã ${response?.coupon?.code || value}.`;
        couponMessageKind = 'is-ok';
        render();
        renderMiniCart();
        toast('Đã áp dụng mã giảm giá.', { type: 'success' });
      })
      .catch(error => {
        couponMessage = errorMessage(error);
        couponMessageKind = 'is-error';
        render();
      })
      .finally(() => { couponBusy = false; render(); });
  }

  // -- Render trang chinh ----------------------------------------------------
  function renderLine(line) {
    const safeName = escapeHtml(line.product_name || 'Sản phẩm');
    const variant = [line.variant_label, line.grind_label].filter(Boolean).map(value => escapeHtml(value)).join(' · ');
    const slug = line.product?.slug || null;
    const main = lineImage(line, 'main');
    const alt = lineImage(line, 'alt');
    const tags = lineTags(line);
    const stock = stockState(line);
    const qty = Number(line.quantity) || 1;
    const media = `<span class="cart-line-media" aria-hidden="true">${main ? `<img class="cart-line-img-main" src="${main}" alt="" width="480" height="600" loading="lazy" onerror="this.remove()">` : ''}${alt ? `<img class="cart-line-img-alt" src="${alt}" alt="" width="480" height="600" loading="lazy" onerror="this.remove()">` : ''}</span>`;
    return `<article class="cart-line" data-line-id="${escapeHtml(line.id)}">${slug ? `<a href="/catalog/?product=${encodeURIComponent(slug)}" tabindex="-1">${media}</a>` : media}<div class="cart-line-info"><h3>${slug ? `<a href="/catalog/?product=${encodeURIComponent(slug)}">${safeName}</a>` : safeName}</h3>${variant ? `<p class="cart-line-variant">${variant}</p>` : ''}${tags.length ? `<ul class="cart-line-tags">${tags.map(tag => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>` : ''}<p class="cart-line-stock ${stock.tone}">${escapeHtml(stock.text)}</p></div><div class="cart-line-side"><p class="cart-line-price"><small>${money(line.unit_price_vnd)} / gói</small>${money(line.line_total_vnd)}</p><div class="cart-stepper" role="group" aria-label="Số lượng ${safeName}"><button type="button" data-qty-step="-1" aria-label="Giảm số lượng ${safeName}"${qty <= 1 ? ' disabled' : ''}>−</button><span aria-live="polite">${qty}</span><button type="button" data-qty-step="1" aria-label="Tăng số lượng ${safeName}"${qty >= MAX_QTY ? ' disabled' : ''}>+</button></div><button class="cart-remove" type="button">Xóa</button></div></article>`;
  }

  function renderSummary() {
    const pricing = cart?.pricing || {};
    const discount = Number(pricing.discount_vnd) || 0;
    return `<aside class="cart-summary" aria-labelledby="summary-title"><h2 id="summary-title">Tóm tắt đơn</h2><!-- TODO(backend): API pricing chưa trả ngưỡng miễn phí giao hàng nên chưa có progress bar; khi API có field threshold thì render thanh tiến trình ở đây. --><p class="cart-ship-note">Giao hàng toàn quốc · phí tính ở bước thanh toán.</p><dl class="cart-totals"><div><dt>Tạm tính</dt><dd>${money(pricing.subtotal_vnd)}</dd></div><div class="${discount > 0 ? 'is-discount' : ''}"><dt>Giảm giá</dt><dd>−${money(pricing.discount_vnd)}</dd></div><div><dt>Vận chuyển</dt><dd>${money(pricing.shipping_vnd)}</dd></div><div class="cart-grand"><dt>Tổng cộng</dt><dd>${money(pricing.grand_total_vnd)}</dd></div></dl>${renderCoupon()}<a class="button cart-cta" href="/checkout/">Tiến hành thanh toán →</a><ul class="cart-trust"><li><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V6l7-3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Thanh toán an toàn</li><li><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.6-5.6M20 12a8 8 0 0 1-13.6 5.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M17.5 3.5v4h-4M6.5 20.5v-4h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Đổi trả trong 7 ngày</li></ul><a class="cart-continue" href="/catalog/">← Tiếp tục mua sắm</a></aside>`;
  }

  function miniCard(product) {
    const tags = Array.isArray(product.flavor_tags) ? product.flavor_tags.map(tag => (typeof tag === 'string' ? tag : tag?.name)).filter(Boolean).slice(0, 2) : [];
    const main = productImage(product.slug, 'main');
    const alt = productImage(product.slug, 'alt');
    const inStock = product.available !== false;
    return `<article class="mini-card"><a class="mini-card-media" href="/catalog/?product=${encodeURIComponent(product.slug)}" tabindex="-1" aria-hidden="true">${main ? `<img class="mini-card-img-main" src="${main}" alt="" width="600" height="750" loading="lazy" onerror="this.remove()">` : ''}${alt ? `<img class="mini-card-img-alt" src="${alt}" alt="" width="600" height="750" loading="lazy" onerror="this.remove()">` : ''}</a><p class="mini-card-origin">${escapeHtml(product.origin?.name || product.origin_name || '')}</p><h3><a href="/catalog/?product=${encodeURIComponent(product.slug)}">${escapeHtml(product.name)}</a></h3>${tags.length ? `<p class="mini-card-note">${escapeHtml(tags.join(' · '))}</p>` : ''}<div class="mini-card-foot"><strong>${money(product.minimum_price_vnd)}</strong>${inStock ? `<button class="button" type="button" data-quick-add="${escapeHtml(product.slug)}">Thêm +</button>` : '<span class="mini-card-note">Tạm hết hàng</span>'}</div></article>`;
  }

  function renderLoved(target, heading, sub) {
    if (lovedFailed) {
      target.innerHTML = `<p class="mini-card-note">Chưa tải được gợi ý lúc này, bạn ghé <a href="/catalog/">cửa hàng</a> xem thêm nhé.</p>`;
      return;
    }
    if (!Array.isArray(lovedCache)) {
      target.innerHTML = '<p class="mini-card-note">Đang chọn hạt ngon cho bạn…</p>';
      loadLoved().then(render);
      return;
    }
    const items = lovedCache.slice(0, 3);
    if (items.length === 0) {
      target.innerHTML = '<p class="mini-card-note">Chưa có gợi ý lúc này, bạn ghé cửa hàng xem thêm nhé.</p>';
      return;
    }
    target.innerHTML = `<div class="cart-cross"><h2>${heading}</h2>${sub ? `<p class="cart-cross-sub">${sub}</p>` : ''}<div class="cart-cross-grid">${items.map(miniCard).join('')}</div></div>`;
    target.querySelectorAll('[data-quick-add]').forEach(button => {
      button.addEventListener('click', () => {
        const product = lovedCache.find(item => item.slug === button.dataset.quickAdd);
        if (product) quickAdd(product, button);
      });
    });
  }

  function render() {
    if (!cart || !content) return;
    const count = lineCount();
    modeIndicator.textContent = cart.mode === 'customer'
      ? 'Giỏ hàng tài khoản — đã đăng nhập'
      : 'Giỏ hàng khách — được lưu trong phiên này';
    content.setAttribute('aria-busy', busy ? 'true' : 'false');
    if (!cart.lines.length) {
      if (stickybar) stickybar.hidden = true;
      content.innerHTML = `<div class="cart-empty"><img class="cart-empty-art" src="/assets/ui/empty-cup.svg" alt="" width="120" height="120" loading="lazy" onerror="this.remove()"><h2>Giỏ hàng đang trống</h2><p>Sương sớm đang chờ — chọn 1 trong những hạt được yêu mến nhất nhé.</p><div class="cart-empty-actions"><a class="button" href="/catalog/">Khám phá cửa hàng</a><a class="button button-outline" href="/#brew">Tìm gu của bạn</a></div><div class="cart-loved"><div class="cart-loved-head"><h2>Được yêu mến nhất</h2><a class="text-link" href="/catalog/">Xem tất cả <span aria-hidden="true">↗</span></a></div><div id="loved-list"></div></div></div>`;
      renderLoved(content.querySelector('#loved-list'), '', '');
      // Danh sach trong o trang thai rong render truc tiep card (khong tieu de phu).
      const lovedBox = content.querySelector('#loved-list');
      if (Array.isArray(lovedCache) && lovedCache.length && lovedBox) {
        const items = lovedCache.slice(0, 4);
        lovedBox.innerHTML = `<div class="cart-cross-grid">${items.map(miniCard).join('')}</div>`;
        lovedBox.querySelectorAll('[data-quick-add]').forEach(button => {
          button.addEventListener('click', () => {
            const product = lovedCache.find(item => item.slug === button.dataset.quickAdd);
            if (product) quickAdd(product, button);
          });
        });
      }
      return;
    }
    content.innerHTML = `<div class="cart-grid"><section class="cart-lines-card" aria-label="Sản phẩm đã chọn"><div class="cart-heading"><h2>Sản phẩm đã chọn</h2><p>${count} sản phẩm</p></div><div class="cart-line-list">${cart.lines.map(renderLine).join('')}</div></section>${renderSummary()}</div><div id="cross-list"></div>`;
    content.querySelectorAll('.cart-line').forEach(row => {
      const lineId = row.dataset.lineId;
      const line = cart.lines.find(item => String(item.id) === String(lineId));
      if (!line) return;
      row.querySelectorAll('[data-qty-step]').forEach(button => {
        button.addEventListener('click', () => changeQuantity(line, (Number(line.quantity) || 1) + Number(button.dataset.qtyStep), row, button.dataset.qtyStep));
      });
      row.querySelector('.cart-remove')?.addEventListener('click', () => removeLine(line));
    });
    bindCoupon();
    renderLoved(content.querySelector('#cross-list'), 'Hay đi kèm với giỏ của bạn', 'Thêm 1 gói nữa cho trọn mẻ rang.');
    const total = money(cart.pricing?.grand_total_vnd);
    if (stickybar) {
      if (stickybarValue) stickybarValue.textContent = total;
      stickybar.hidden = false;
    }
  }

  // -- Goij y "Duoc yeu men nhat": newest + con hang --------------------------
  // TODO(backend): API chua co sort theo do pho bien/luot mua nen dung newest;
  // khi API co field popularity hoac sort=popular thi doi sang de dung nghia
  // "duoc yeu men nhat".
  async function loadLoved() {
    if (Array.isArray(lovedCache) || lovedFailed) return lovedCache || [];
    if (!window.CatalogApi || typeof window.CatalogApi.productsWithMeta !== 'function') {
      lovedFailed = true;
      return [];
    }
    try {
      const result = await window.CatalogApi.productsWithMeta({ sort: 'newest', per_page: 20 });
      const items = Array.isArray(result) ? result : (result.data || []);
      lovedCache = items.filter(product => product.available !== false).slice(0, 4);
    } catch {
      lovedFailed = true;
      lovedCache = null;
    }
    return lovedCache || [];
  }

  async function getGrindOptions() {
    if (grindCache) return grindCache;
    grindCache = await window.CartApi.grindOptions();
    return grindCache;
  }

  // -- Thao tac gio hang -----------------------------------------------------
  async function run(operation, successMessage = '') {
    if (busy) return;
    setBusy(true);
    showMessage('Đang cập nhật…');
    try {
      cart = await operation();
      render();
      renderMiniCart();
      refreshBadge();
      showMessage(successMessage, successMessage ? 'success' : '');
    } catch (error) {
      showMessage(errorMessage(error), 'error');
      content.setAttribute('aria-busy', 'false');
    } finally {
      setBusy(false);
      render();
    }
  }

  function changeQuantity(line, quantity, row, step) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) return Promise.resolve();
    // Optimistic UI: cap nhat so hien thi ngay, rollback khi PATCH bi tu choi.
    const previous = Number(line.quantity) || 1;
    line.quantity = quantity;
    const qtyEl = row?.querySelector('.cart-stepper span');
    const minus = row?.querySelector('[data-qty-step="-1"]');
    const plus = row?.querySelector('[data-qty-step="1"]');
    if (row) row.classList.add('is-busy');
    if (qtyEl) qtyEl.textContent = String(quantity);
    if (minus) minus.disabled = quantity <= 1;
    if (plus) plus.disabled = quantity >= MAX_QTY;
    return window.CartApi.updateLine(line.id, quantity)
      .then(response => {
        cart = response;
        render();
        renderMiniCart();
        refreshBadge();
        refocusStepper(line.id, step);
      })
      .catch(error => {
        line.quantity = previous;
        render();
        toast(errorMessage(error), { type: 'error' });
        refocusStepper(line.id, step);
      });
  }

  function refocusStepper(lineId, step) {
    if (!step) return;
    const row = content.querySelector(`[data-line-id="${CSS.escape(String(lineId))}"]`);
    const button = row?.querySelector(`[data-qty-step="${step}"]`);
    if (button && !button.disabled) button.focus({ preventScroll: true });
  }

  function removeLine(line) {
    const saved = {
      variant_id: Number(line.variant_id),
      grind_option_id: Number(line.grind_option_id),
      quantity: Math.min(MAX_QTY, Math.max(1, Number(line.quantity) || 1)),
    };
    const name = line.product_name || 'Sản phẩm';
    run(() => window.CartApi.removeLine(line.id)).then(() => {
      if (!cart || cart.lines.some(item => String(item.id) === String(line.id))) return;
      toast(`Đã xóa ${name} khỏi giỏ.`, {
        type: 'info',
        actionLabel: 'Hoàn tác',
        duration: 5000,
        onAction: async () => {
          try {
            await window.CartApi.session();
            cart = await window.CartApi.addLine(saved);
            render();
            renderMiniCart();
            refreshBadge();
          } catch (error) {
            toast(errorMessage(error), { type: 'error' });
          }
        },
      });
    });
  }

  async function quickAdd(product, button) {
    button.disabled = true;
    try {
      const detail = await window.CatalogApi.product(product.slug);
      const variant = (detail.variants || []).find(item => item.available) || null;
      const grinds = await getGrindOptions();
      if (!variant || grinds.length === 0) {
        toast('Món này vừa hết hàng, bạn xem món khác nhé.', { type: 'warning' });
        return;
      }
      await window.CartApi.session();
      cart = await window.CartApi.addLine({
        variant_id: Number(variant.id),
        grind_option_id: Number(grinds[0].id),
        quantity: 1,
      });
      render();
      await renderMiniCart();
      refreshBadge();
      if (window.SM && typeof window.SM.openDrawer === 'function') window.SM.openDrawer('mini-cart');
      toast(`Đã thêm ${product.name || 'sản phẩm'} vào giỏ`, {
        type: 'success',
        actionLabel: 'Xem giỏ',
        onAction: () => {
          if (window.SM && typeof window.SM.openDrawer === 'function') window.SM.openDrawer('mini-cart');
        },
      });
    } catch (error) {
      const fields = Object.values(error.fields || {}).flat();
      toast(fields.length ? fields.join(' ') : (error.message || 'Không thể thêm vào giỏ.'), { type: 'error' });
    } finally {
      button.disabled = false;
    }
  }

  // -- Mini-cart drawer (giong catalog) --------------------------------------
  function miniThumb(line) {
    const image = document.createElement('img');
    image.className = 'mini-thumb';
    image.width = 72;
    image.height = 88;
    image.loading = 'lazy';
    image.alt = '';
    image.src = lineImage(line, 'main') || '/assets/ui/icon-bean.svg';
    image.addEventListener('error', () => {
      if (image.dataset.fallback === '1') image.style.visibility = 'hidden';
      else {
        image.dataset.fallback = '1';
        image.src = '/assets/ui/icon-bean.svg';
      }
    });
    return image;
  }

  function textNode(tagName, value, className) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    node.textContent = value == null ? '' : String(value);
    return node;
  }

  function renderMiniCart() {
    const linesBox = document.querySelector('#mini-cart-lines');
    const subtotalEl = document.querySelector('#mini-subtotal');
    const titleEl = document.querySelector('#mini-cart-title');
    const upsellBox = document.querySelector('#mini-upsell');
    const upsellList = document.querySelector('#mini-upsell-list');
    if (!linesBox || !subtotalEl || !titleEl) return Promise.resolve();
    if (!cart) {
      linesBox.replaceChildren(textNode('p', 'Đang tải giỏ hàng…', 'mini-empty'));
      if (upsellBox) upsellBox.hidden = true;
      return Promise.resolve();
    }
    const lines = Array.isArray(cart.lines) ? cart.lines : [];
    const count = lineCount();
    titleEl.textContent = count > 0 ? `Giỏ hàng (${count})` : 'Giỏ hàng';
    subtotalEl.textContent = money(cart.pricing?.subtotal_vnd);
    linesBox.replaceChildren();
    if (lines.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'mini-empty';
      const strong = document.createElement('strong');
      strong.textContent = 'Giỏ hàng đang trống';
      empty.append(strong, document.createTextNode(' Ghé cửa hàng chọn vài hạt ngon nhé.'));
      linesBox.append(empty);
    }
    for (const line of lines) {
      const row = document.createElement('div');
      row.className = 'mini-line';
      const info = document.createElement('div');
      info.className = 'mini-info';
      info.append(textNode('p', line.product_name || 'Sản phẩm', 'mini-name'));
      info.append(textNode('p', [line.variant_label, line.grind_label].filter(Boolean).join(' · '), 'mini-variant'));
      const stepper = document.createElement('div');
      stepper.className = 'mini-stepper';
      const minus = textNode('button', '−', '');
      minus.type = 'button';
      minus.setAttribute('aria-label', `Giảm số lượng ${line.product_name || ''}`);
      minus.disabled = Number(line.quantity) <= 1;
      const qty = textNode('span', String(line.quantity));
      const plus = textNode('button', '+', '');
      plus.type = 'button';
      plus.setAttribute('aria-label', `Tăng số lượng ${line.product_name || ''}`);
      plus.disabled = Number(line.quantity) >= MAX_QTY;
      minus.addEventListener('click', () => changeQuantity(line, (Number(line.quantity) || 1) - 1, content.querySelector(`[data-line-id="${CSS.escape(String(line.id))}"]`)));
      plus.addEventListener('click', () => changeQuantity(line, (Number(line.quantity) || 1) + 1, content.querySelector(`[data-line-id="${CSS.escape(String(line.id))}"]`)));
      stepper.append(minus, qty, plus);
      info.append(stepper);
      const right = document.createElement('div');
      right.className = 'mini-right';
      right.append(textNode('span', money(line.line_total_vnd), 'mini-price'));
      const remove = textNode('button', 'Xóa', 'mini-remove');
      remove.type = 'button';
      remove.addEventListener('click', () => removeLine(line));
      right.append(remove);
      row.append(miniThumb(line), info, right);
      linesBox.append(row);
    }
    // Upsell: 2 mon re nhat con hang, chua co trong gio (sort newest).
    if (!upsellBox || !upsellList) return Promise.resolve();
    upsellList.replaceChildren();
    if (!Array.isArray(lovedCache)) {
      upsellBox.hidden = true;
      if (!lovedFailed) loadLoved().then(() => { render(); renderMiniCart(); });
      return Promise.resolve();
    }
    const inCart = new Set(lines.map(line => String(line.product_id)));
    const candidates = lovedCache
      .filter(product => product.available !== false && !inCart.has(String(product.id)))
      .sort((a, b) => Number(a.minimum_price_vnd) - Number(b.minimum_price_vnd))
      .slice(0, 2);
    upsellBox.hidden = candidates.length === 0;
    for (const product of candidates) {
      const item = document.createElement('div');
      item.className = 'mini-upsell-item';
      const thumb = document.createElement('img');
      thumb.width = 52;
      thumb.height = 62;
      thumb.loading = 'lazy';
      thumb.alt = '';
      thumb.src = productImage(product.slug, 'main') || '/assets/ui/icon-bean.svg';
      thumb.addEventListener('error', () => {
        if (thumb.dataset.fallback === '1') thumb.style.visibility = 'hidden';
        else {
          thumb.dataset.fallback = '1';
          thumb.src = '/assets/ui/icon-bean.svg';
        }
      });
      const copy = document.createElement('div');
      copy.append(textNode('p', product.name, 'mini-name'));
      copy.append(textNode('span', money(product.minimum_price_vnd), 'mini-price'));
      const add = textNode('button', 'Thêm +', 'mini-add');
      add.type = 'button';
      add.setAttribute('aria-label', `Thêm ${product.name} vào giỏ`);
      add.addEventListener('click', () => quickAdd(product, add));
      item.append(thumb, copy, add);
      upsellList.append(item);
    }
    return Promise.resolve();
  }

  // -- Khoi dong -------------------------------------------------------------
  (async () => {
    try {
      await window.CartApi.session();
      cart = await window.CartApi.getCart();
      render();
      renderMiniCart();
      refreshBadge();
      loadLoved().then(() => { render(); renderMiniCart(); });
    } catch (error) {
      content.setAttribute('aria-busy', 'false');
      showMessage(errorMessage(error), 'error');
      content.innerHTML = '<div class="cart-empty"><h2>Chưa tải được giỏ hàng</h2><p>Có trục trặc khi tải giỏ hàng, bạn thử tải lại trang nhé.</p><div class="cart-empty-actions"><a class="button" href="/catalog/">Khám phá cửa hàng</a></div></div>';
    }
  })();
})();
