(() => {
  'use strict';

  const grid = document.querySelector('#product-grid');
  const status = document.querySelector('#catalog-status');
  const sortSelect = document.querySelector('#sort-filter');
  const presets = [...document.querySelectorAll('[data-preset]')];
  const searchInput = document.querySelector('#search-input');
  const suggestionsList = document.querySelector('#suggestions');
  const detailPanel = document.querySelector('#product-detail');
  const detailContent = document.querySelector('#detail-content');
  const detailClose = document.querySelector('#detail-close');
  const filterToggle = document.querySelector('#filter-toggle');
  const filterPanel = document.querySelector('#filter-panel');
  const filterCount = document.querySelector('#filter-count');
  const filterApply = document.querySelector('#filter-apply');
  const filterClear = document.querySelector('#filter-clear');
  const activeFilters = document.querySelector('#active-filters');
  const resultCount = document.querySelector('#result-count');
  const clearFiltersButton = document.querySelector('#clear-filters');
  const shopCount = document.querySelector('#shop-count');
  const pagination = document.querySelector('#pagination');
  const jsonld = document.querySelector('#catalog-itemlist-jsonld');
  const PER_PAGE = 20;
  const LOW_STOCK = 10;

  const filters = { category_slug: '', origin_slug: '', flavor_tag_slug: '', in_stock: '' };
  const filterOptions = { category: [], origin: [], flavor: [] };
  let searchTimer = 0;
  let activeRequest = 0;
  let currentPage = 1;
  let currentProducts = [];
  let totalPages = 1;
  let grindCache = null;
  let cartCache = null;

  // Slug -> file anh that trong /assets/products/ (chi dung file co trong manifest).
  // Slug khong co trong map -> gradient kem + monogram SM chim (CSS .card-media::before).
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

  function text(tagName, value, className) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    node.textContent = value == null ? '' : String(value);
    return node;
  }

  function setStatus(message, kind = '') {
    status.textContent = message;
    status.className = `status ${kind}`.trim();
    status.hidden = !message;
  }

  function money(value) {
    const amount = Number(value);
    if (!Number.isSafeInteger(amount) || amount < 0) return 'Giá đang cập nhật';
    return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
  }

  // Loc tien to ky thuat trong du lieu seed demo (VD mo ta bat dau bang cum tu
  // danh dau noi bo + "CHINH THUC."), chi giu phan mo ta that cho UI.
  // Database nam ngoai ownership frontend nen xu ly tai cho render.
  function cleanApiText(value, fallback = '') {
    const raw = value == null ? '' : String(value);
    const marker = 'CHÍNH THỨC.';
    const index = raw.indexOf(marker);
    const cleaned = (index >= 0 ? raw.slice(index + marker.length) : raw).trim();
    return cleaned || fallback;
  }

  function toast(message, options) {
    if (window.SM && typeof window.SM.toast === 'function') window.SM.toast(message, options);
    else window.alert(message);
  }

  function productImage(slug, kind) {
    const entry = PRODUCT_IMAGES[String(slug || '')];
    if (!entry) return null;
    const file = kind === 'alt' ? entry.alt : entry.main;
    return file ? `/assets/products/${file}` : null;
  }

  function cardImage(slug, name, kind, eager) {
    const src = productImage(slug, kind);
    if (!src) return null;
    const image = document.createElement('img');
    image.src = src;
    image.alt = kind === 'alt' ? '' : `Túi cà phê ${name || 'Sương Mai'}`;
    if (kind === 'alt') image.setAttribute('aria-hidden', 'true');
    image.width = 600;
    image.height = 750;
    image.loading = eager ? 'eager' : 'lazy';
    if (eager) image.setAttribute('fetchpriority', 'high');
    image.className = kind === 'alt' ? 'card-img-alt' : 'card-img-main';
    image.addEventListener('error', () => image.remove(), { once: true });
    return image;
  }

  // -- Skeleton ------------------------------------------------------------
  function renderSkeletons() {
    grid.replaceChildren();
    for (let index = 0; index < 6; index++) {
      const card = document.createElement('div');
      card.className = 'skeleton-card';
      card.setAttribute('aria-hidden', 'true');
      card.innerHTML = '<div class="sm-skeleton sm-skeleton-media"></div>' +
        '<div class="sm-skeleton sm-skeleton-block" style="width:40%"></div>' +
        '<div class="sm-skeleton sm-skeleton-block" style="width:80%"></div>' +
        '<div class="sm-skeleton sm-skeleton-block" style="width:55%"></div>';
      grid.append(card);
    }
  }

  // -- Filter panel (checkbox/radio) ---------------------------------------
  function renderFilterOptions() {
    const groups = [
      ['category', 'category-option', 'category_slug'],
      ['origin', 'origin-option', 'origin_slug'],
      ['flavor', 'flavor-option', 'flavor_tag_slug'],
    ];
    for (const [group, inputName, filterKey] of groups) {
      const box = document.querySelector(`[data-filter-options="${group}"]`);
      if (!box) continue;
      box.replaceChildren();
      const all = document.createElement('label');
      all.className = 'filter-option';
      const allInput = document.createElement('input');
      allInput.type = 'radio';
      allInput.name = inputName;
      allInput.value = '';
      allInput.checked = !filters[filterKey];
      const allText = document.createElement('span');
      allText.textContent = group === 'category' ? 'Tất cả danh mục' : group === 'origin' ? 'Tất cả vùng' : 'Tất cả hương vị';
      all.append(allInput, allText);
      box.append(all);
      for (const item of filterOptions[group]) {
        const label = document.createElement('label');
        label.className = 'filter-option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = inputName;
        input.value = item.slug;
        input.checked = filters[filterKey] === item.slug;
        const name = document.createElement('span');
        name.textContent = item.name;
        label.append(input, name);
        box.append(label);
      }
    }
    const stockInputs = [...document.querySelectorAll('input[name="stock-option"]')];
    for (const input of stockInputs) input.checked = input.value === filters.in_stock;
  }

  function activeFilterCount() {
    return ['category_slug', 'origin_slug', 'flavor_tag_slug', 'in_stock']
      .filter(key => filters[key] !== '').length;
  }

  function filterLabel(key, value) {
    if (key === 'in_stock') return value === 'true' ? 'Còn hàng' : 'Tạm hết hàng';
    const group = key === 'category_slug' ? 'category' : key === 'origin_slug' ? 'origin' : 'flavor';
    return filterOptions[group].find(item => item.slug === value)?.name || value;
  }

  function renderActiveTags() {
    activeFilters.replaceChildren();
    const count = activeFilterCount();
    filterCount.hidden = count === 0;
    filterCount.textContent = String(count);
    for (const key of ['category_slug', 'origin_slug', 'flavor_tag_slug', 'in_stock']) {
      if (filters[key] === '') continue;
      const tag = document.createElement('span');
      tag.className = 'filter-tag';
      tag.append(document.createTextNode(filterLabel(key, filters[key])));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '✕';
      remove.setAttribute('aria-label', `Xóa bộ lọc ${filterLabel(key, filters[key])}`);
      remove.addEventListener('click', () => {
        filters[key] = '';
        currentPage = 1;
        renderFilterOptions();
        loadProducts();
      });
      tag.append(remove);
      activeFilters.append(tag);
    }
  }

  // -- Product card --------------------------------------------------------
  // TODO(backend): API chưa có field rating/số lượt đánh giá và roast-level nên card
  // ẩn cả hai dòng; khi API có thì render rating "★ 4.9 (128)" và thang 5 chấm hạt.
  function renderCard(product, index, isNew) {
    const article = document.createElement('article');
    article.className = 'product-card reveal';
    const available = Boolean(product.available);
    const stock = Number(product.stock_quantity);
    const lowStock = available && Number.isSafeInteger(stock) && stock > 0 && stock < LOW_STOCK;

    const media = document.createElement('div');
    media.className = `card-media${available ? '' : ' is-unavailable'}`;
    const main = cardImage(product.slug, product.name, 'main', index < 3);
    if (main) media.append(main);
    const hover = cardImage(product.slug, product.name, 'alt', false);
    if (hover) media.append(hover);

    const badges = document.createElement('div');
    badges.className = 'card-badges';
    if (isNew) badges.append(text('span', 'Mới rang', 'card-badge is-new'));
    if (lowStock) badges.append(text('span', 'Sắp hết', 'card-badge is-low'));
    if (badges.childNodes.length > 0) media.append(badges);
    if (!available) media.append(text('p', 'Tạm hết hàng', 'card-soldout'));

    const quickAdd = document.createElement('button');
    quickAdd.type = 'button';
    quickAdd.className = 'quick-add';
    quickAdd.textContent = '+';
    quickAdd.setAttribute('aria-label', `Thêm nhanh ${product.name || 'sản phẩm'} vào giỏ`);
    quickAdd.disabled = !available;
    if (available) quickAdd.addEventListener('click', () => quickAddToCart(product, quickAdd));
    media.append(quickAdd);
    article.append(media);

    const body = document.createElement('div');
    body.className = 'card-body';
    body.append(text('p', cleanApiText(product.origin?.region || product.origin?.name, 'Nguồn gốc đang được bổ sung'), 'card-origin'));
    body.append(text('h2', product.name || 'Sản phẩm', 'card-name'));
    const typeLine = (product.categories || []).map(item => item.name).join(' · ');
    if (typeLine) body.append(text('p', typeLine, 'card-type'));
    const tags = document.createElement('div');
    tags.className = 'card-tags';
    for (const tag of (product.flavor_tags || []).slice(0, 2)) tags.append(text('span', tag.name, 'taste-pill'));
    body.append(tags);

    const foot = document.createElement('div');
    foot.className = 'card-foot';
    const price = document.createElement('span');
    price.className = 'card-price';
    price.textContent = money(product.minimum_price_vnd);
    // TODO(backend): API list chưa trả weight_g của variant rẻ nhất nên chưa ghi "/ 250g";
    // khi API có thì thêm caption khối lượng vào .card-price.
    foot.append(price);
    const detailLink = document.createElement('a');
    detailLink.className = 'card-detail-link';
    detailLink.href = `?product=${encodeURIComponent(product.slug || '')}`;
    detailLink.textContent = 'Chi tiết →';
    detailLink.addEventListener('click', event => {
      event.preventDefault();
      loadDetail(product.slug);
    });
    foot.append(detailLink);
    body.append(foot);

    if (available) {
      const stockLine = Number.isSafeInteger(stock)
        ? (lowStock ? `Sắp hết · còn ${stock} gói` : `Còn hàng · ${stock} gói`)
        : 'Còn hàng';
      body.append(text('p', stockLine, `card-stock${lowStock ? ' is-low' : ''}`));
    } else {
      body.append(text('p', 'Hết hàng — để lại email, Sương Mai báo khi có.', 'card-stock is-out'));
      const notify = document.createElement('form');
      notify.className = 'notify-row';
      const email = document.createElement('input');
      email.type = 'email';
      email.required = true;
      email.placeholder = 'Email của bạn';
      email.setAttribute('aria-label', `Email nhận tin khi ${product.name || 'sản phẩm'} có hàng`);
      const send = document.createElement('button');
      send.type = 'submit';
      send.className = 'button';
      send.textContent = 'Báo khi có hàng';
      notify.append(email, send);
      notify.addEventListener('submit', event => {
        event.preventDefault();
        // TODO(backend): chưa có API đăng ký nhận tin hết hàng; hiện chỉ validate +
        // toast tại chỗ. Khi có endpoint thì POST email + product slug tại đây.
        const value = email.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          toast('Email chưa đúng, bạn kiểm tra lại nhé.', { type: 'error' });
          email.focus();
          return;
        }
        toast('Sương Mai sẽ báo khi có hàng mới.', { type: 'success' });
        email.value = '';
      });
      body.append(notify);
    }
    article.append(body);
    return article;
  }

  function renderFiller() {
    const link = document.createElement('a');
    link.className = 'quiz-filler reveal';
    link.href = '/#brew';
    link.innerHTML = '<span class="quiz-icon" aria-hidden="true">☕</span>';
    link.append(text('h2', 'Chưa biết chọn hạt nào?'));
    link.append(text('p', 'Kể cho Sương Mai nghe buổi sáng của bạn, gợi ý gu pha phù hợp.'));
    const cta = text('span', 'Tìm gu của bạn →', 'text-link');
    link.append(cta);
    return link;
  }

  // -- Product list ----------------------------------------------------------
  function syncUrl(params) {
    const url = new URL(window.location.href);
    for (const key of ['category_slug', 'origin_slug', 'flavor_tag_slug', 'in_stock', 'sort', 'page', 'product']) {
      if (params[key]) url.searchParams.set(key, params[key]);
      else url.searchParams.delete(key);
    }
    window.history.replaceState({}, '', url);
  }

  function updateJsonld(products) {
    if (!jsonld) return;
    try {
      jsonld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: products.slice(0, PER_PAGE).map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: product.name,
          url: `/catalog/?product=${encodeURIComponent(product.slug || '')}`,
        })),
      });
    } catch { /* no-op */ }
  }

  function renderPagination() {
    pagination.replaceChildren();
    pagination.hidden = totalPages <= 1;
    if (totalPages <= 1) return;
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = '← Trước';
    previous.disabled = currentPage <= 1;
    previous.addEventListener('click', () => {
      currentPage = Math.max(1, currentPage - 1);
      loadProducts();
    });
    pagination.append(previous);
    const windowPages = [];
    for (let page = Math.max(1, currentPage - 2); page <= Math.min(totalPages, currentPage + 2); page++) {
      windowPages.push(page);
    }
    for (const page of windowPages) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(page);
      if (page === currentPage) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => {
        currentPage = page;
        loadProducts();
      });
      pagination.append(button);
    }
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = 'Sau →';
    next.disabled = currentPage >= totalPages;
    next.addEventListener('click', () => {
      currentPage = Math.min(totalPages, currentPage + 1);
      loadProducts();
    });
    pagination.append(next);
  }

  async function loadProducts() {
    const requestId = ++activeRequest;
    setStatus('');
    renderSkeletons();
    detailPanel.hidden = true;
    renderActiveTags();
    const params = { sort: sortSelect.value, page: String(currentPage), per_page: String(PER_PAGE) };
    if (filters.category_slug) params.category_slug = filters.category_slug;
    if (filters.origin_slug) params.origin_slug = filters.origin_slug;
    if (filters.flavor_tag_slug) params.flavor_tag_slug = filters.flavor_tag_slug;
    if (filters.in_stock) params.in_stock = filters.in_stock;
    syncUrl({ ...params, page: currentPage > 1 ? String(currentPage) : '' });

    try {
      const fetchProducts = window.CatalogApi.productsWithMeta
        ? window.CatalogApi.productsWithMeta(params)
        : window.CatalogApi.products(params).then(data => ({ data, meta: {} }));
      const result = await fetchProducts;
      if (requestId !== activeRequest) return;
      const products = Array.isArray(result) ? result : result.data;
      const meta = Array.isArray(result) ? {} : result.meta || {};
      currentProducts = Array.isArray(products) ? products : [];
      const totalItems = Number(meta.total_items);
      totalPages = Math.max(1, Number(meta.total_pages) || 1);
      const shown = currentProducts.length;
      resultCount.textContent = Number.isSafeInteger(totalItems)
        ? `Tìm thấy ${totalItems} sản phẩm`
        : `Tìm thấy ${shown} sản phẩm`;
      shopCount.textContent = Number.isSafeInteger(totalItems)
        ? `${totalItems} loại hạt · rang mỗi ngày tại Đà Lạt`
        : `${shown} loại hạt · rang mỗi ngày tại Đà Lạt`;
      renderPagination();
      updateJsonld(currentProducts);

      if (currentProducts.length === 0) {
        grid.replaceChildren();
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = '<span class="empty-icon" aria-hidden="true"><svg viewBox="0 0 120 120" width="96" height="96"><circle cx="52" cy="52" r="30" fill="none" stroke="currentColor" stroke-width="3"/><path d="M74 74l22 22" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><ellipse cx="52" cy="52" rx="10" ry="14" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M52 38c-3 5-3 23 0 28" fill="none" stroke="currentColor" stroke-width="2.5"/></svg></span>';
        empty.append(text('h2', 'Chưa tìm thấy hạt nào hợp gu.'));
        empty.append(text('p', 'Thử nới lỏng bộ lọc một chút, Sương Mai còn nhiều hạt ngon đang chờ.'));
        const reset = text('button', 'Xóa bộ lọc', 'button');
        reset.type = 'button';
        reset.addEventListener('click', resetFilters);
        empty.append(reset);
        grid.append(empty);
        return;
      }

      grid.classList.remove('is-switching');
      grid.replaceChildren();
      const markNew = sortSelect.value === 'newest';
      currentProducts.forEach((product, index) => {
        grid.append(renderCard(product, index, markNew && index < 3));
      });
      if (currentProducts.length % 3 === 2) grid.append(renderFiller());
      // FLIP nhe: fade/scale stagger .25s.
      requestAnimationFrame(() => grid.classList.add('is-switching'));
      if (window.SM && typeof window.SM.reveal === 'function') {
        grid.querySelectorAll('.reveal').forEach(el => window.SM.reveal(el));
      }
    } catch (error) {
      if (requestId !== activeRequest) return;
      grid.replaceChildren();
      setStatus(error.message || 'Không thể tải catalog. Vui lòng thử lại.', 'error');
    }
  }

  async function getGrindOptions() {
    if (grindCache) return grindCache;
    grindCache = await window.CartApi.grindOptions();
    return grindCache;
  }

  async function refreshCartBadge() {
    try {
      cartCache = await window.CartApi.getCart();
      const count = (cartCache.lines || []).reduce((sum, line) => sum + Number(line.quantity || 0), 0);
      if (window.SM && typeof window.SM.updateCartBadge === 'function') window.SM.updateCartBadge(count);
    } catch { /* no-op: badge giữ nguyên khi API lỗi */ }
  }

  // -- Quick add -------------------------------------------------------------
  async function quickAddToCart(product, button) {
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
      await window.CartApi.addLine({
        variant_id: Number(variant.id),
        grind_option_id: Number(grinds[0].id),
        quantity: 1,
      });
      cartCache = null;
      await refreshCartBadge();
      await renderMiniCart();
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

  // -- Mini cart drawer --------------------------------------------------------
  function cartProductSlug(line) {
    // Cart API không trả product slug nên suy ảnh từ tên dòng đã có trong catalog
    // đã tải; không đoán slug mới.
    const match = currentProducts.find(product => product.name === line.product_name);
    if (match) return match.slug;
    return null;
  }

  async function renderMiniCart() {
    const linesBox = document.querySelector('#mini-cart-lines');
    const subtotalEl = document.querySelector('#mini-subtotal');
    const titleEl = document.querySelector('#mini-cart-title');
    const upsellBox = document.querySelector('#mini-upsell');
    const upsellList = document.querySelector('#mini-upsell-list');
    if (!linesBox) return;
    linesBox.replaceChildren(text('p', 'Đang tải giỏ hàng…', 'mini-empty'));
    try {
      const cart = cartCache || await window.CartApi.getCart();
      cartCache = cart;
      const lines = Array.isArray(cart.lines) ? cart.lines : [];
      const count = lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
      titleEl.textContent = count > 0 ? `Giỏ hàng (${count})` : 'Giỏ hàng';
      subtotalEl.textContent = money(cart.pricing?.subtotal_vnd);
      linesBox.replaceChildren();
      if (lines.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'mini-empty';
        empty.innerHTML = '<strong>Giỏ hàng đang trống</strong> Ghé cửa hàng chọn vài hạt ngon nhé.';
        linesBox.append(empty);
      }
      for (const line of lines) {
        const row = document.createElement('div');
        row.className = 'mini-line';
        const thumb = document.createElement('img');
        thumb.className = 'mini-thumb';
        thumb.width = 72;
        thumb.height = 88;
        thumb.loading = 'lazy';
        const slug = cartProductSlug(line);
        thumb.src = productImage(slug, 'main') || '/assets/ui/icon-bean.svg';
        thumb.alt = '';
        thumb.addEventListener('error', () => {
          if (thumb.dataset.fallback === '1') thumb.style.visibility = 'hidden';
          else {
            thumb.dataset.fallback = '1';
            thumb.src = '/assets/ui/icon-bean.svg';
          }
        });
        const info = document.createElement('div');
        info.className = 'mini-info';
        info.append(text('p', line.product_name || 'Sản phẩm', 'mini-name'));
        info.append(text('p', `${line.variant_label || ''} · ${line.grind_label || ''}`, 'mini-variant'));
        const stepper = document.createElement('div');
        stepper.className = 'mini-stepper';
        const minus = text('button', '−', '');
        minus.type = 'button';
        minus.setAttribute('aria-label', `Giảm số lượng ${line.product_name || ''}`);
        minus.disabled = Number(line.quantity) <= 1;
        const qty = text('span', String(line.quantity));
        const plus = text('button', '+', '');
        plus.type = 'button';
        plus.setAttribute('aria-label', `Tăng số lượng ${line.product_name || ''}`);
        plus.disabled = Number(line.quantity) >= 20;
        minus.addEventListener('click', () => changeLineQuantity(line, Number(line.quantity) - 1));
        plus.addEventListener('click', () => changeLineQuantity(line, Number(line.quantity) + 1));
        stepper.append(minus, qty, plus);
        info.append(stepper);
        const right = document.createElement('div');
        right.className = 'mini-right';
        right.append(text('span', money(line.line_total_vnd), 'mini-price'));
        const remove = text('button', 'Xóa', 'mini-remove');
        remove.type = 'button';
        remove.addEventListener('click', () => removeLine(line));
        right.append(remove);
        row.append(thumb, info, right);
        linesBox.append(row);
      }
      // Upsell: 2 món rẻ nhất còn hàng, chưa có trong giỏ. Không đoán ngưỡng ship.
      upsellList.replaceChildren();
      const inCart = new Set(lines.map(line => line.product_name));
      const candidates = currentProducts
        .filter(product => product.available && !inCart.has(product.name))
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
        copy.append(text('p', product.name, 'mini-name'));
        copy.append(text('span', money(product.minimum_price_vnd), 'mini-price'));
        const add = text('button', 'Thêm +', 'mini-add');
        add.type = 'button';
        add.setAttribute('aria-label', `Thêm ${product.name} vào giỏ`);
        add.addEventListener('click', () => quickAddToCart(product, add));
        item.append(thumb, copy, add);
        upsellList.append(item);
      }
    } catch {
      linesBox.replaceChildren(text('p', 'Không tải được giỏ hàng, bạn thử lại nhé.', 'mini-empty'));
    }
  }

  async function changeLineQuantity(line, quantity) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return;
    try {
      cartCache = await window.CartApi.updateLine(line.id, quantity);
      await refreshCartBadge();
      await renderMiniCart();
    } catch (error) {
      toast(error.message || 'Không thể cập nhật số lượng.', { type: 'error' });
    }
  }

  async function removeLine(line) {
    const previousQuantity = Number(line.quantity) || 1;
    try {
      cartCache = await window.CartApi.removeLine(line.id);
      await refreshCartBadge();
      await renderMiniCart();
      toast('Đã xóa khỏi giỏ.', {
        type: 'info',
        actionLabel: 'Hoàn tác',
        duration: 5000,
        onAction: async () => {
          try {
            await window.CartApi.session();
            cartCache = await window.CartApi.addLine({
              variant_id: Number(line.variant_id),
              grind_option_id: Number(line.grind_option_id),
              quantity: Math.min(20, Math.max(1, previousQuantity)),
            });
            await refreshCartBadge();
            await renderMiniCart();
          } catch (error) {
            toast(error.message || 'Không thể hoàn tác.', { type: 'error' });
          }
        },
      });
    } catch (error) {
      toast(error.message || 'Không thể xóa khỏi giỏ.', { type: 'error' });
    }
  }

  // -- Detail panel (giữ nguyên logic chọn variant/grind/số lượng) -------------
  function addMeta(parent, label, value) {
    const item = document.createElement('div');
    item.className = 'meta-item';
    item.append(text('strong', label), text('span', value || 'Chưa có thông tin'));
    parent.append(item);
  }

  async function loadDetail(slug) {
    const requestId = ++activeRequest;
    setStatus('');
    detailPanel.hidden = false;
    detailContent.replaceChildren(text('p', 'Đang tải chi tiết…'));
    detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      const detailUrl = new URL(window.location.href);
      detailUrl.searchParams.set('product', slug);
      window.history.replaceState({}, '', detailUrl);
    } catch { /* no-op */ }

    try {
      const product = await window.CatalogApi.product(slug);
      if (requestId !== activeRequest) return;
      const layout = document.createElement('div');
      layout.className = 'detail-layout';
      const media = document.createElement('div');
      media.className = 'detail-media';
      media.setAttribute('role', 'img');
      media.setAttribute('aria-label', `Hình ảnh sản phẩm: ${product.name || 'Sản phẩm'}`);
      const image = cardImage(product.slug, product.name, 'main', true);
      if (image) {
        image.className = '';
        image.width = 800;
        image.height = 1000;
        media.append(image);
      }
      layout.append(media);

      const copy = document.createElement('div');
      copy.className = 'detail-copy';
      copy.append(text('p', cleanApiText(product.origin?.region || product.origin?.name, 'Nguồn gốc đang được bổ sung'), 'eyebrow'));
      const title = text('h2', product.name || 'Sản phẩm');
      title.className = 'detail-product-title';
      title.tabIndex = -1;
      copy.append(title);
      copy.append(text('p', cleanApiText(product.description, 'Chưa có mô tả.')));
      const categoryNames = product.categories?.map(item => item.name).join(' · ');
      const tagNames = product.flavor_tags?.map(item => item.name).join(' · ');
      const meta = document.createElement('div');
      meta.className = 'meta-list';
      addMeta(meta, 'Danh mục', categoryNames);
      addMeta(meta, 'Hương vị', tagNames);
      addMeta(meta, 'Vùng trồng', cleanApiText(product.origin?.region, ''));
      copy.append(meta);

      const profile = product.flavor_profile;
      if (profile) {
        const profileLabels = { acidity: 'Độ chua', body: 'Độ đậm', sweetness: 'Độ ngọt', bitterness: 'Độ đắng', aroma: 'Hương thơm' };
        const profileText = ['acidity', 'body', 'sweetness', 'bitterness', 'aroma']
          .map(key => `${profileLabels[key]}: ${Number(profile[key])}/5`).join(' · ');
        copy.append(text('p', `Gợi ý hương vị — ${profileText}`));
      }

      copy.append(text('h3', 'Chọn sản phẩm'));
      const variantControls = document.createElement('div');
      variantControls.className = 'variant-controls';
      const variantLabel = text('label', 'Quy cách');
      const variantSelect = document.createElement('select');
      variantSelect.setAttribute('aria-label', 'Chọn quy cách');
      variantLabel.append(variantSelect);
      const availableVariants = (product.variants || []).filter(variant => variant.available);
      for (const variant of product.variants || []) {
        const option = new Option(`${variant.label} · ${money(variant.price_vnd)}${variant.available ? ` · Còn ${variant.stock_quantity}` : ' · Tạm hết hàng'}`, variant.id);
        option.disabled = !variant.available;
        variantSelect.add(option);
      }
      if (availableVariants.length > 0) variantSelect.value = availableVariants[0].id;
      if (availableVariants.length === 0) variantSelect.disabled = true;

      const grindLabel = text('label', 'Kiểu xay');
      const grindSelect = document.createElement('select');
      grindSelect.setAttribute('aria-label', 'Chọn kiểu xay');
      grindLabel.append(grindSelect);
      const grindOptions = await getGrindOptions();
      await window.CartApi.session();
      for (const grind of grindOptions) grindSelect.add(new Option(grind.name, grind.id));
      if (!grindOptions.length) grindSelect.disabled = true;

      const quantityLabel = text('label', 'Số lượng');
      const quantity = document.createElement('input');
      quantity.type = 'number';
      quantity.min = '1';
      quantity.max = '20';
      quantity.step = '1';
      quantity.value = '1';
      quantity.inputMode = 'numeric';
      quantity.setAttribute('aria-label', 'Số lượng');
      quantityLabel.append(quantity);

      const addButton = text('button', 'Thêm vào giỏ', 'button');
      addButton.type = 'button';
      addButton.disabled = availableVariants.length === 0 || !grindOptions.length;
      const addStatus = text('p', '', 'detail-add-status');
      addStatus.setAttribute('role', 'status');
      addStatus.setAttribute('aria-live', 'polite');
      addButton.addEventListener('click', async () => {
        const requestedQuantity = Number(quantity.value);
        if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 20) {
          addStatus.textContent = 'Số lượng phải là số nguyên từ 1 đến 20.';
          addStatus.className = 'detail-add-status error';
          quantity.focus();
          return;
        }
        addButton.disabled = true;
        addStatus.textContent = 'Đang thêm vào giỏ…';
        addStatus.className = 'detail-add-status';
        try {
          await window.CartApi.session();
          await window.CartApi.addLine({
            variant_id: Number(variantSelect.value),
            grind_option_id: Number(grindSelect.value),
            quantity: requestedQuantity,
          });
          addStatus.textContent = 'Đã thêm vào giỏ.';
          addStatus.className = 'detail-add-status success';
          cartCache = null;
          await refreshCartBadge();
          await renderMiniCart();
          if (window.SM && typeof window.SM.openDrawer === 'function') window.SM.openDrawer('mini-cart');
        } catch (error) {
          const fields = Object.values(error.fields || {}).flat();
          addStatus.textContent = fields.length ? fields.join(' ') : (error.message || 'Không thể thêm vào giỏ.');
          addStatus.className = 'detail-add-status error';
        } finally {
          addButton.disabled = false;
        }
      });
      const cartLink = document.createElement('a');
      cartLink.className = 'button button-outline';
      cartLink.href = '/cart/';
      cartLink.textContent = 'Xem giỏ hàng';
      variantControls.append(variantLabel, grindLabel, quantityLabel, addButton, cartLink, addStatus);
      copy.append(variantControls);

      const variants = document.createElement('ul');
      variants.className = 'variant-list';
      for (const variant of product.variants || []) {
        const row = document.createElement('li');
        row.append(text('span', `${variant.label} · ${variant.available ? `Còn ${variant.stock_quantity} sản phẩm` : 'Tạm hết hàng'}`));
        row.append(text('strong', money(variant.price_vnd)));
        variants.append(row);
      }
      copy.append(variants);

      if (product.freshness) {
        const freshness = document.createElement('div');
        freshness.className = 'freshness';
        freshness.append(text('strong', product.freshness.label || 'Thông tin lô rang'));
        freshness.append(text('p', `Ngày rang: ${product.freshness.roast_date} · Thưởng thức ngon nhất đến ${product.freshness.best_enjoyed_until}.`));
        if (product.freshness.message) freshness.append(text('p', product.freshness.message));
        freshness.append(text('small', 'Mốc thưởng thức ngon nhất không phải hạn an toàn.'));
        copy.append(freshness);
      }

      layout.append(copy);
      detailContent.replaceChildren(layout);
      detailContent.querySelector('.detail-product-title')?.focus();
    } catch (error) {
      if (requestId !== activeRequest) return;
      detailContent.replaceChildren(text('p', error.message || 'Không thể tải chi tiết sản phẩm.', 'status error'));
    }
  }

  // -- Filters data + query ------------------------------------------------
  async function loadFilters() {
    try {
      const [categories, origins, flavors] = await Promise.all([
        window.CatalogApi.categories(),
        window.CatalogApi.origins(),
        window.CatalogApi.flavors(),
      ]);
      filterOptions.category = Array.isArray(categories) ? categories : [];
      filterOptions.origin = Array.isArray(origins) ? origins : [];
      filterOptions.flavor = Array.isArray(flavors) ? flavors : [];
      renderFilterOptions();
    } catch (error) {
      setStatus(error.message || 'Không thể tải bộ lọc.', 'error');
    }
  }

  function applyQueryFilters() {
    const query = new URLSearchParams(window.location.search);
    for (const key of ['category_slug', 'origin_slug', 'flavor_tag_slug', 'in_stock', 'sort']) {
      if (!query.has(key)) continue;
      if (key === 'sort') sortSelect.value = query.get(key);
      else filters[key] = query.get(key) || '';
    }
    const page = Number(query.get('page'));
    if (Number.isInteger(page) && page > 1) currentPage = page;
    // ?brew= : map client-side sang category hien co, khong doi API.
    const brew = (query.get('brew') || '').toLowerCase();
    if (brew && !filters.category_slug) {
      const slugs = filterOptions.category.map(item => item.slug);
      if (brew === 'espresso' && slugs.includes('espresso')) filters.category_slug = 'espresso';
      else if (brew === 'pourover' && slugs.includes('pour-over')) filters.category_slug = 'pour-over';
      else if (brew === 'phin' && slugs.includes('ca-phe-bot-demo')) filters.category_slug = 'ca-phe-bot-demo';
      else if (brew === 'french' && slugs.includes('ca-phe-bot-demo')) filters.category_slug = 'ca-phe-bot-demo';
    }
  }

  function resetFilters() {
    searchInput.value = '';
    filters.category_slug = '';
    filters.origin_slug = '';
    filters.flavor_tag_slug = '';
    filters.in_stock = '';
    sortSelect.value = 'newest';
    currentPage = 1;
    presets.forEach(item => {
      const active = item.dataset.preset === 'all';
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    });
    renderFilterOptions();
    loadProducts();
  }

  function renderSuggestions(items) {
    suggestionsList.replaceChildren();
    for (const item of items) {
      const li = document.createElement('li');
      const button = text('button', item.name || 'Sản phẩm');
      button.type = 'button';
      button.addEventListener('click', () => {
        suggestionsList.hidden = true;
        searchInput.value = item.name || '';
        loadDetail(item.slug);
      });
      li.append(button);
      suggestionsList.append(li);
    }
    suggestionsList.hidden = items.length === 0;
  }

  // -- Events ---------------------------------------------------------------
  sortSelect.addEventListener('change', () => {
    currentPage = 1;
    loadProducts();
  });
  clearFiltersButton?.addEventListener('click', resetFilters);
  filterClear?.addEventListener('click', resetFilters);

  filterToggle?.addEventListener('click', () => {
    const open = filterPanel.hidden;
    filterPanel.hidden = !open;
    filterToggle.setAttribute('aria-expanded', String(open));
  });

  filterApply?.addEventListener('click', () => {
    const pick = name => {
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.value : '';
    };
    filters.category_slug = pick('category-option');
    filters.origin_slug = pick('origin-option');
    filters.flavor_tag_slug = pick('flavor-option');
    filters.in_stock = pick('stock-option');
    currentPage = 1;
    filterPanel.hidden = true;
    filterToggle.setAttribute('aria-expanded', 'false');
    presets.forEach(item => {
      item.classList.remove('is-active');
      item.setAttribute('aria-selected', 'false');
    });
    loadProducts();
  });

  presets.forEach(preset => preset.addEventListener('click', () => {
    presets.forEach(item => {
      const active = item === preset;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    });
    const key = preset.dataset.preset;
    const findSlug = (group, pattern) =>
      filterOptions[group].find(item => pattern.test(item.name || ''))?.slug || '';
    if (key === 'all') {
      filters.category_slug = '';
      filters.origin_slug = '';
      filters.flavor_tag_slug = '';
    } else if (key === 'coffee') {
      filters.category_slug = findSlug('category', /pour over/i);
    } else if (key === 'origin') {
      filters.origin_slug = findSlug('origin', /cầu đất/i);
    } else if (key === 'nutty') {
      filters.flavor_tag_slug = findSlug('flavor', /hạt phỉ|caramel/i);
    } else if (key === 'floral') {
      filters.flavor_tag_slug = findSlug('flavor', /hoa nhài|trà đen/i);
    }
    currentPage = 1;
    renderFilterOptions();
    loadProducts();
  }));

  document.querySelectorAll('.grid-toggle button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.grid-toggle button').forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      grid.dataset.cols = button.dataset.cols || '3';
    });
  });

  detailClose.addEventListener('click', () => {
    activeRequest++;
    detailPanel.hidden = true;
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    window.history.replaceState({}, '', url);
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  searchInput.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    const query = searchInput.value.trim();
    if ([...query].length < 2) {
      suggestionsList.hidden = true;
      return;
    }
    searchTimer = window.setTimeout(async () => {
      try {
        renderSuggestions(await window.CatalogApi.suggestions(query));
      } catch {
        suggestionsList.hidden = true;
      }
    }, 300);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.search-field')) suggestionsList.hidden = true;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      suggestionsList.hidden = true;
      if (filterPanel && !filterPanel.hidden) {
        filterPanel.hidden = true;
        filterToggle.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // -- Boot ------------------------------------------------------------------
  loadFilters().then(() => {
    applyQueryFilters();
    renderFilterOptions();
    loadProducts();
    refreshCartBadge();
    const featuredSlug = new URLSearchParams(window.location.search).get('product');
    if (featuredSlug) loadDetail(featuredSlug);
  });
})();