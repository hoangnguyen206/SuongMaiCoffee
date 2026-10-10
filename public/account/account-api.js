(() => {
  const API_PREFIX = '/api/v1';
  let csrfToken = '';

  async function request(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' };
    const options = { method, headers, credentials: 'same-origin' };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['X-CSRF-Token'] = csrfToken;
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_PREFIX}${path}`, options);
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(result?.error?.message || 'Không thể hoàn tất yêu cầu.');
      error.code = result?.error?.code || 'NETWORK_ERROR';
      error.status = response.status;
      error.fields = result?.error?.fields || {};
      throw error;
    }
    if (typeof result?.data?.csrf_token === 'string') csrfToken = result.data.csrf_token;
    return result?.data;
  }

  window.AccountApi = Object.freeze({
    session: async () => {
      const result = await request('/session');
      csrfToken = result.csrf_token;
      return result;
    },
    register: payload => request('/auth/register', { method: 'POST', body: payload }),
    login: payload => request('/auth/login', { method: 'POST', body: payload }),
    mergeCart: () => request('/cart/merge', { method: 'POST', body: {} }),
    logout: () => request('/auth/logout', { method: 'POST', body: {} }),
    profile: () => request('/account/me'),
    updateProfile: payload => request('/account/me', { method: 'PATCH', body: payload }),
    changePassword: payload => request('/account/me/password', { method: 'PUT', body: payload }),
  });
})();

// -- ADDITIVE module: SmReorder + SmFormat (dùng chung account/orders/order-detail). --
// Không sửa code AccountApi ở trên. Chỉ dùng API thật đã có:
// CatalogApi.suggestions/product (tìm slug + variant), CartApi.grindOptions/addLine/getCart.
(() => {
  'use strict';
  if (window.SmReorder) return;

  // Slug -> file anh that trong /assets/products/ (giong catalog.js).
  // Slug khong co trong map -> gradient + monogram SM (CSS), khong render img gay.
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

  const slugCache = new Map(); // product_name (lowercase) -> slug | null
  const productCache = new Map(); // slug -> product detail
  let grindCache = null;

  function escapeHtml(value) {
    if (window.SM && typeof window.SM.escapeHtml === 'function') return window.SM.escapeHtml(value);
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function toast(message, options) {
    if (window.SM && typeof window.SM.toast === 'function') window.SM.toast(message, options);
  }

  function money(value) {
    const amount = Number(value);
    if (!Number.isSafeInteger(amount) || amount < 0) return 'Giá đang cập nhật';
    return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
  }

  function fmtDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function fmtDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function shortCode(code) {
    const value = String(code || '');
    return value.length > 14 ? `${value.slice(0, 10)}…${value.slice(-4)}` : value;
  }

  function firstName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : 'bạn';
  }

  function badge(status) {
    if (window.SM && typeof window.SM.orderBadgeHTML === 'function') return window.SM.orderBadgeHTML(status);
    return '';
  }

  function productImage(slug, kind) {
    const entry = PRODUCT_IMAGES[String(slug || '')];
    if (!entry) return null;
    const file = kind === 'alt' ? entry.alt : entry.main;
    return file ? `/assets/products/${file}` : null;
  }

  // Tao <img> thumbnail; tra null neu slug khong co anh that (CSS hien gradient + SM).
  function thumbImg(slug, name, width, height) {
    const src = productImage(slug, 'main');
    if (!src) return null;
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Túi cà phê ${name || 'Sương Mai'}`;
    img.width = width || 200;
    img.height = height || 160;
    img.loading = 'lazy';
    img.addEventListener('error', () => img.remove(), { once: true });
    return img;
  }

  // Map ten san pham trong order snapshot -> slug qua API suggestions (khop chinh xac ten).
  async function resolveSlug(productName) {
    const key = String(productName || '').trim().toLowerCase();
    if (!key || !window.CatalogApi) return null;
    if (slugCache.has(key)) return slugCache.get(key);
    try {
      const list = await window.CatalogApi.suggestions(productName);
      const hit = (list || []).find(item => String(item.name || '').trim().toLowerCase() === key) || null;
      const slug = hit ? hit.slug : null;
      slugCache.set(key, slug);
      return slug;
    } catch {
      slugCache.set(key, null);
      return null;
    }
  }

  async function productDetail(slug) {
    if (!slug || !window.CatalogApi) return null;
    if (productCache.has(slug)) return productCache.get(slug);
    try {
      const product = await window.CatalogApi.product(slug);
      productCache.set(slug, product);
      return product;
    } catch {
      productCache.set(slug, null);
      return null;
    }
  }

  async function grindOptions() {
    if (grindCache) return grindCache;
    if (!window.CartApi) return [];
    try {
      grindCache = await window.CartApi.grindOptions();
      return grindCache;
    } catch {
      return [];
    }
  }

  function refreshCartBadge(cart) {
    try {
      const lines = cart && Array.isArray(cart.lines) ? cart.lines : null;
      if (lines && window.SM && typeof window.SM.updateCartBadge === 'function') {
        window.SM.updateCartBadge(lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0));
      }
    } catch { /* no-op */ }
  }

  // Mua lai tung mon dung API them gio hien co (POST /cart/items).
  // Moi item can: { product_name, variant_label, grind_label, quantity }.
  // Khop variant theo label + kieu xay theo ten that tu API; mon nao khong khop
  // hoac het hang thi bo qua va bao ro trong toast (khong doan id).
  async function reorderItems(items, options = {}) {
    const list = Array.isArray(items) ? items.filter(item => item && item.product_name) : [];
    if (!list.length) {
      toast('Không có món nào để mua lại.', { type: 'warning' });
      return { added: [], skipped: [] };
    }
    if (!window.CartApi || !window.CatalogApi) {
      toast('Chưa tải được cửa hàng. Thử tải lại trang nhé.', { type: 'error' });
      return { added: [], skipped: list.map(item => ({ item, reason: 'offline' })) };
    }
    const added = [];
    const skipped = [];
    const onItem = typeof options.onItem === 'function' ? options.onItem : null;
    const grinds = await grindOptions();
    for (const item of list) {
      const label = `${item.product_name} · ${item.variant_label || ''}`.trim();
      try {
        const slug = await resolveSlug(item.product_name);
        const product = slug ? await productDetail(slug) : null;
        const variant = (product && Array.isArray(product.variants))
          ? product.variants.find(entry => String(entry.label) === String(item.variant_label))
          : null;
        if (!variant) { skipped.push({ item, reason: `“${item.product_name}” (${item.variant_label || '?'}) hiện không còn bán.` }); if (onItem) onItem(item, false); continue; }
        if (!variant.available || Number(variant.stock_quantity) <= 0) { skipped.push({ item, reason: `“${item.product_name} ${item.variant_label}” tạm hết hàng.` }); if (onItem) onItem(item, false); continue; }
        const wanted = Math.max(1, Math.min(20, Number(item.quantity) || 1));
        const grind = grinds.find(entry => String(entry.name) === String(item.grind_label))
          || grinds.find(entry => String(entry.slug) === String(item.grind_label).toLowerCase().replace(/\s+/g, '-'));
        if (!grind) { skipped.push({ item, reason: `Kiểu xay “${item.grind_label || '?'}” hiện không có.` }); if (onItem) onItem(item, false); continue; }
        const cart = await window.CartApi.addLine({
          variant_id: Number(variant.id),
          grind_option_id: Number(grind.id),
          quantity: Math.min(wanted, Math.min(20, Number(variant.stock_quantity))),
        });
        refreshCartBadge(cart);
        added.push({ item, label });
        if (onItem) onItem(item, true);
      } catch (error) {
        const max = error && error.details && Number.isSafeInteger(Number(error.details.max_acceptable_quantity))
          ? Number(error.details.max_acceptable_quantity)
          : null;
        skipped.push({ item, reason: max !== null && max > 0 ? `“${label}” chỉ còn mua được ${max} gói.` : (error && error.message) || `Không thêm được “${label}”.` });
        if (onItem) onItem(item, false);
      }
    }
    if (added.length && !skipped.length) {
      toast(`Đã thêm ${added.length} món vào giỏ.`, { type: 'success', actionLabel: 'Xem giỏ', onAction: () => { window.location.assign('/cart/'); } });
    } else if (added.length && skipped.length) {
      toast(`Đã thêm ${added.length} món. ${skipped[0].reason}`, { type: 'warning', actionLabel: 'Xem giỏ', onAction: () => { window.location.assign('/cart/'); } });
    } else if (skipped.length) {
      toast(skipped[0].reason, { type: 'warning' });
    }
    return { added, skipped };
  }

  window.SmReorder = Object.freeze({
    money, fmtDate, fmtDateTime, shortCode, firstName, escapeHtml, badge,
    productImage, thumbImg, resolveSlug, productDetail, reorderItems, refreshCartBadge,
  });
})();
