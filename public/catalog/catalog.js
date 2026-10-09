(() => {
  const placeholderLabel = 'Hình ảnh sản phẩm cà phê';
  const grid = document.querySelector('#product-grid');
  const status = document.querySelector('#catalog-status');
  const categorySelect = document.querySelector('#category-filter');
  const originSelect = document.querySelector('#origin-filter');
  const sortSelect = document.querySelector('#sort-filter');
  const searchInput = document.querySelector('#search-input');
  const suggestionsList = document.querySelector('#suggestions');
  const detailPanel = document.querySelector('#product-detail');
  const detailContent = document.querySelector('#detail-content');
  const detailClose = document.querySelector('#detail-close');
  let searchTimer = 0;
  let activeRequest = 0;

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

  function appendOptions(select, items, emptyLabel) {
    const current = select.value;
    select.replaceChildren(new Option(emptyLabel, ''));
    for (const item of items) {
      select.add(new Option(item.name, item.slug));
    }
    if (items.some(item => item.slug === current)) select.value = current;
  }

  function renderCard(product) {
    const article = document.createElement('article');
    article.className = 'product-card';
    const art = text('div', '', 'product-placeholder');
    art.setAttribute('role', 'img');
    art.setAttribute('aria-label', placeholderLabel);
    article.append(art);

    const content = document.createElement('div');
    content.className = 'product-card-content';
    content.append(text('p', product.origin?.region || 'Nguồn gốc đang được bổ sung', 'eyebrow'));
    content.append(text('h2', product.name || 'Sản phẩm'));
    content.append(text('p', product.categories?.map(item => item.name).join(' · ') || ''));

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    footer.append(text('span', money(product.minimum_price_vnd), 'price'));
    const available = Boolean(product.available);
    footer.append(text('span', available ? 'Còn hàng' : 'Tạm hết hàng', `availability${available ? '' : ' unavailable'}`));
    content.append(footer);

    const detailButton = text('button', 'Xem chi tiết', 'button');
    detailButton.type = 'button';
    detailButton.addEventListener('click', () => loadDetail(product.slug));
    content.append(detailButton);
    article.append(content);
    return article;
  }

  async function loadProducts() {
    const requestId = ++activeRequest;
    setStatus('Đang tải sản phẩm…');
    grid.replaceChildren();
    detailPanel.hidden = true;
    const params = { sort: sortSelect.value, page: '1', per_page: '20' };
    if (categorySelect.value) params.category_slug = categorySelect.value;
    if (originSelect.value) params.origin_slug = originSelect.value;

    try {
      const result = await window.CatalogApi.products(params);
      if (requestId !== activeRequest) return;
      const products = Array.isArray(result) ? result : result.data;
      if (!Array.isArray(products) || products.length === 0) {
        setStatus('Chưa có sản phẩm phù hợp với lựa chọn này.', 'empty');
        return;
      }
      setStatus('');
      grid.replaceChildren(...products.map(renderCard));
    } catch (error) {
      if (requestId !== activeRequest) return;
      setStatus(error.message || 'Không thể tải catalog. Vui lòng thử lại.', 'error');
    }
  }

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
      const product = await window.CatalogApi.product(slug);
      if (requestId !== activeRequest) return;
      const layout = document.createElement('div');
      layout.className = 'detail-layout';
      const art = text('div', '', 'product-placeholder');
      art.setAttribute('role', 'img');
      art.setAttribute('aria-label', placeholderLabel);
      layout.append(art);

      const copy = document.createElement('div');
      copy.className = 'detail-copy';
      copy.append(text('p', product.origin?.region || 'Nguồn gốc đang được bổ sung', 'eyebrow'));
      const title = text('h2', product.name || 'Sản phẩm');
      title.className = 'detail-product-title';
      title.tabIndex = -1;
      copy.append(title);
      copy.append(text('p', product.description || 'Chưa có mô tả.'));
      const categoryNames = product.categories?.map(item => item.name).join(' · ');
      const tagNames = product.flavor_tags?.map(item => item.name).join(' · ');
      const meta = document.createElement('div');
      meta.className = 'meta-list';
      addMeta(meta, 'Danh mục', categoryNames);
      addMeta(meta, 'Hương vị', tagNames);
      addMeta(meta, 'Vùng trồng', product.origin?.region);
      addMeta(meta, 'Hình ảnh', product.images?.length ? 'Có sẵn' : 'Đang hoàn thiện');
      copy.append(meta);

      const profile = product.flavor_profile;
      if (profile) {
        const profileLabels = { acidity: 'Độ chua', body: 'Độ đậm', sweetness: 'Độ ngọt', bitterness: 'Độ đắng', aroma: 'Hương thơm' };
        const profileText = ['acidity', 'body', 'sweetness', 'bitterness', 'aroma']
          .map(key => `${profileLabels[key]}: ${Number(profile[key])}/5`).join(' · ');
        copy.append(text('p', `Gợi ý hương vị — ${profileText}`));
      }

      const variantsHeading = text('h3', 'Chọn sản phẩm');
      copy.append(variantsHeading);
      const variantControls = document.createElement('div');
      variantControls.className = 'variant-controls';
      const variantLabel = text('label', 'Quy cách');
      const variantSelect = document.createElement('select');
      variantSelect.setAttribute('aria-label', 'Chọn quy cách');
      variantLabel.append(variantSelect);
      const availableVariants = (product.variants || []).filter(variant => variant.available);
      for (const variant of product.variants || []) {
        const option = new Option(`${variant.label} · ${money(variant.price_vnd)}${variant.available ? '' : ' · Tạm hết hàng'}`, variant.id);
        option.disabled = !variant.available;
        variantSelect.add(option);
      }
      if (availableVariants.length > 0) variantSelect.value = availableVariants[0].id;
      if (availableVariants.length === 0) variantSelect.disabled = true;

      const grindLabel = text('label', 'Kiểu xay');
      const grindSelect = document.createElement('select');
      grindSelect.setAttribute('aria-label', 'Chọn kiểu xay');
      grindLabel.append(grindSelect);
      const grindOptions = await window.CartApi.grindOptions();
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
        } catch (error) {
          const fields = Object.values(error.fields || {}).flat();
          addStatus.textContent = fields.length ? fields.join(' ') : (error.message || 'Không thể thêm vào giỏ.');
          addStatus.className = 'detail-add-status error';
        } finally {
          addButton.disabled = false;
        }
      });
      const cartLink = document.createElement('a');
      cartLink.className = 'button button-quiet';
      cartLink.href = '/cart/';
      cartLink.textContent = 'Xem giỏ hàng';
      variantControls.append(variantLabel, grindLabel, quantityLabel, addButton, cartLink, addStatus);
      copy.append(variantControls);

      const variants = document.createElement('ul');
      variants.className = 'variant-list';
      for (const variant of product.variants || []) {
        const row = document.createElement('li');
        row.append(text('span', `${variant.label} · ${variant.available ? 'Còn hàng' : 'Tạm hết hàng'}`));
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
      detailPanel.querySelector('.detail-product-title')?.focus();
    } catch (error) {
      if (requestId !== activeRequest) return;
      detailContent.replaceChildren(text('p', error.message || 'Không thể tải chi tiết sản phẩm.', 'status error'));
    }
  }

  async function loadFilters() {
    try {
      const [categories, origins] = await Promise.all([
        window.CatalogApi.categories(),
        window.CatalogApi.origins(),
      ]);
      appendOptions(categorySelect, categories, 'Tất cả danh mục');
      appendOptions(originSelect, origins, 'Tất cả vùng');
    } catch (error) {
      setStatus(error.message || 'Không thể tải bộ lọc.', 'error');
    }
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

  categorySelect.addEventListener('change', loadProducts);
  originSelect.addEventListener('change', loadProducts);
  sortSelect.addEventListener('change', loadProducts);
  detailClose.addEventListener('click', () => {
    activeRequest++;
    detailPanel.hidden = true;
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
    }, 250);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.search-field')) suggestionsList.hidden = true;
  });

  Promise.all([loadFilters(), loadProducts()]).then(() => {
    const featuredSlug = new URLSearchParams(window.location.search).get('product');
    if (featuredSlug) loadDetail(featuredSlug);
  });
})();
