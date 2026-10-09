(() => {
  const header = document.querySelector('#site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#primary-nav');
  const productGrid = document.querySelector('#featured-grid');
  const productStatus = document.querySelector('#featured-status');
  const money = value => { const amount = Number(value); return Number.isSafeInteger(amount) && amount >= 0 ? `${new Intl.NumberFormat('vi-VN').format(amount)}đ` : 'Giá đang cập nhật'; };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

  function renderProducts(products) {
    productGrid.innerHTML = products.map(product => {
      const tags = (product.flavor_tags || []).slice(0, 2).map(tag => `<span class="product-tag">${escapeHtml(tag.name)}</span>`).join('');
      const origin = product.origin?.region || product.origin?.name || 'Đà Lạt';
      const availability = product.available ? '' : '<span class="product-unavailable">Tạm hết hàng</span>';
      const image = product.images?.[0]?.url;
      const assetSlug = String(product.slug || 'product').replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'product';
      const imageMarkup = image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" width="600" height="600">` : `<span class="product-media-mark" aria-hidden="true">SM</span>`;
      return `<article class="product-card reveal is-visible"><a href="/catalog/?product=${encodeURIComponent(product.slug)}" aria-label="Xem ${escapeHtml(product.name)}"><div class="product-media" data-asset-slot="/assets/products/${assetSlug}.webp">${imageMarkup}</div></a><div class="product-card-copy"><p class="product-origin">${escapeHtml(origin)}</p><h3>${escapeHtml(product.name)}</h3><div class="product-meta">${tags || '<span class="product-tag">Cà phê rang xay</span>'}</div><div class="product-bottom"><span class="product-price">Từ ${money(product.minimum_price_vnd)}</span>${availability}<a class="product-link" href="/catalog/?product=${encodeURIComponent(product.slug)}">Xem chi tiết <span aria-hidden="true">↗</span></a></div></div></article>`;
    }).join('');
  }
  async function loadFeatured() {
    try {
      const result = await window.CatalogApi.products({ page: '1', per_page: '4', sort: 'newest' });
      const products = Array.isArray(result) ? result : result.data;
      if (!Array.isArray(products) || products.length === 0) { productStatus.textContent = 'Hiện chưa có sản phẩm để giới thiệu. Hãy ghé lại sau.'; return; }
      renderProducts(products); productStatus.textContent = '';
    } catch (error) { productStatus.textContent = error.message || 'Không thể tải sản phẩm lúc này. Bạn vẫn có thể mở toàn bộ cửa hàng.'; productStatus.classList.add('is-error'); }
  }
  function setMenu(open) { menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu'); navigation.classList.toggle('is-open', open); document.body.classList.toggle('menu-open', open); }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); } });
  window.addEventListener('resize', () => { if (window.innerWidth > 700) setMenu(false); }, { passive: true });
  window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 12), { passive: true });

  const revealItems = document.querySelectorAll('.reveal:not(.product-card)');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else revealItems.forEach(item => item.classList.add('is-visible'));

  const processSteps = { origin: { count: 'CHẶNG 01', name: 'Vùng trồng', description: 'Khí hậu cao nguyên và nhịp mùa tạo nên nét riêng cho mỗi vùng cà phê.', glyph: '⌁', asset: '/assets/story/process-origin.webp' }, select: { count: 'CHẶNG 02', name: 'Chọn hạt', description: 'Chọn lọc những hạt phù hợp với hương vị mà chúng tôi muốn giữ lại trong tách.', glyph: '✳', asset: '/assets/story/process-select.webp' }, roast: { count: 'CHẶNG 03', name: 'Rang', description: 'Điều chỉnh từng mẻ rang để làm nổi bật đặc tính tự nhiên của hạt.', glyph: '◌', asset: '/assets/story/process-roast.webp' }, brew: { count: 'CHẶNG 04', name: 'Pha thưởng thức', description: 'Pha theo cách bạn yêu thích và dành một phút thật chậm để cảm nhận.', glyph: '♨', asset: '/assets/story/process-brew.webp' } };
  const processTabs = [...document.querySelectorAll('.process-tab')];
  const processPanel = document.querySelector('#process-panel');
  function activateProcessTab(tab, focus = false) {
    const content = processSteps[tab.dataset.step];
    processTabs.forEach(item => { const selected = item === tab; item.classList.toggle('is-active', selected); item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1; });
    processPanel.setAttribute('aria-labelledby', tab.id); document.querySelector('#process-count').textContent = content.count; document.querySelector('#process-name').textContent = content.name; document.querySelector('#process-description').textContent = content.description; document.querySelector('.process-glyph').textContent = content.glyph; document.querySelector('.process-panel-art').setAttribute('data-asset-slot', content.asset); if (focus) tab.focus();
  }
  processTabs.forEach((tab, index) => { tab.addEventListener('click', () => activateProcessTab(tab)); tab.addEventListener('keydown', event => { const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0; if (!direction) return; event.preventDefault(); activateProcessTab(processTabs[(index + direction + processTabs.length) % processTabs.length], true); }); });
  loadFeatured();
})();
