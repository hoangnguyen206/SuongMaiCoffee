/* ==========================================================================
   Suong Mai Coffee Roasters — home.js (LANDING)
   Giu nguyen: route/href, CatalogApi payload, ARIA tablist + ArrowLeft/Right,
   session flow (site-account.js so huu), responsive 1050/700/390,
   prefers-reduced-motion. Trang dung day du khi CDN bi chan.
   Motion nang cao chi chay qua SM.ensureMotion() (GSAP/ScrollTrigger/Lenis).
   ========================================================================== */
(() => {
  'use strict';
  const SM = window.SM || {};
  const esc = (SM.escapeHtml || ((v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))));

  const reducedQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const isReduced = () => !!(reducedQuery && reducedQuery.matches);
  const reveal = (el) => { if (SM.reveal) SM.reveal(el); else el.classList.add('is-visible'); };
  const money = (value) => {
    const amount = Number(value);
    return Number.isSafeInteger(amount) && amount >= 0
      ? `${new Intl.NumberFormat('vi-VN').format(amount)}đ`
      : 'Giá đang cập nhật';
  };
  const slugify = (value) => String(value || 'product')
    .replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'product';

  // Slug co bien the -alt.webp trong manifest -> hover crossfade; thieu thi scale.
  // TODO(asset): bo sung <slug>-alt.webp cho kiambu-caramel-demo, guji-jasmine-demo,
  // sidamo-citrus-demo, cau-dat-filter-demo, cau-dat-natural-demo, cau-dat-washed-demo,
  // dak-lak-dam-demo, son-la-dark-demo, son-la-hoa-qua-demo, son-la-honey-demo.
  const ALT_SLUGS = new Set([
    'kirinyaga-berry-demo', 'yirgacheffe-floral-demo', 'nyeri-berry-demo',
    'cau-dat-espresso-demo', 'cau-dat-honey-demo',
    'dak-lak-blend-demo', 'dak-lak-phin-demo', 'ca-phe-demo-01',
  ]);

  /* ---------------------------------------------------------------- 1. Hero */
  function initHero() {
    const title = document.querySelector('.hero-title');
    if (title && !isReduced()) {
      const show = () => title.classList.add('is-inview');
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { show(); io.disconnect(); } });
        }, { threshold: 0.3 });
        io.observe(title);
      } else show();
    } else if (title) title.classList.add('is-inview');

    // Video hero: chi load khi file that ton tai (HEAD check), mobile + save-data
    // thi dung poster. Khong bao gio hien icon video vo.
    const media = document.querySelector('[data-hero-media]');
    const video = document.querySelector('[data-hero-video]');
    if (!media || !video) return;
    const conn = navigator.connection || {};
    if (conn.saveData || isReduced()) return;
    const probe = window.innerWidth < 700
      ? '/assets/hero/hero-dalat-mobile.mp4'
      : '/assets/hero/hero-dalat.mp4';
    fetch(probe, { method: 'HEAD' }).then((res) => {
      if (!res.ok) return;
      media.classList.add('has-video');
      video.preload = 'auto';
      const play = video.play && video.play();
      if (play && play.catch) play.catch(() => media.classList.remove('has-video'));
    }).catch(() => {});
  }

  /* ------------------------------------------------------- 2. Featured grid */
  const productGrid = document.querySelector('#featured-grid');
  const productStatus = document.querySelector('#featured-status');

  function setFeaturedState(message, kind) {
    if (!productStatus) return;
    productStatus.textContent = message;
    productStatus.classList.toggle('is-error', kind === 'error');
    productStatus.classList.toggle('is-empty', kind === 'empty');
    productStatus.hidden = !message;
  }

  function renderSkeletons() {
    if (!productGrid) return;
    productGrid.innerHTML = Array.from({ length: 4 }, () => (
      '<article class="product-card" aria-hidden="true"><div class="product-media sm-skeleton"></div>' +
      '<div class="product-card-copy"><p class="sm-skeleton sm-skeleton-line" style="width:40%">&nbsp;</p>' +
      '<p class="sm-skeleton sm-skeleton-line" style="width:85%">&nbsp;</p>' +
      '<p class="sm-skeleton sm-skeleton-line" style="width:55%">&nbsp;</p></div></article>'
    )).join('');
  }

  function productImagePair(product, slug) {
    // Uu tien .webp theo manifest; bo qua stub .svg legacy trung ten.
    const apiUrl = product.images && product.images[0] && product.images[0].url;
    const main = `/assets/products/${encodeURIComponent(slug)}.webp`;
    if (apiUrl && !/\.svg(\?|$)/i.test(String(apiUrl))) return { main: String(apiUrl), alt: '' };
    return { main, alt: ALT_SLUGS.has(slug) ? `/assets/products/${encodeURIComponent(slug)}-alt.webp` : '' };
  }

  function renderProducts(products) {
    productGrid.innerHTML = products.map((product) => {
      const slug = slugify(product.slug);
      const url = `/catalog/?product=${encodeURIComponent(product.slug)}`;
      const tags = (product.flavor_tags || []).slice(0, 2)
        .map((tag) => `<span class="product-tag">${esc(tag.name)}</span>`).join('');
      const origin = (product.origin && (product.origin.region || product.origin.name)) || 'Đà Lạt';
      const availability = product.available ? '' : '<span class="product-unavailable">Tạm hết hàng</span>';
      const pair = productImagePair(product, slug);
      const altImg = pair.alt
        ? `<img class="img-alt" src="${esc(pair.alt)}" alt="" loading="lazy" width="600" height="750" aria-hidden="true" tabindex="-1">`
        : '';
      // Badge "Moi rang": sort:newest da sap moi nhat truoc -> card dau tien.
      const fresh = products[0] === product ? '<span class="product-fresh">Mới rang</span>' : '';
      return `<article class="product-card reveal"><a class="product-media" href="${esc(url)}" aria-label="Xem ${esc(product.name)}" tabindex="-1">` +
        `${fresh}<span class="fallback-mark" aria-hidden="true">SM</span>` +
        `<img src="${esc(pair.main)}" alt="${esc(product.name)}" loading="lazy" width="600" height="750" data-product-image>${altImg}</a>` +
        `<div class="product-card-copy"><p class="product-origin">${esc(origin)}</p><h3>${esc(product.name)}</h3>` +
        `<div class="product-meta">${tags || '<span class="product-tag">Cà phê rang xay</span>'}</div>` +
        `<div class="product-bottom"><span class="product-price">Từ ${esc(money(product.minimum_price_vnd))}</span>${availability}` +
        `<a class="product-link" href="${esc(url)}">Xem chi tiết <span aria-hidden="true">↗</span></a></div></div></article>`;
    }).join('');
    productGrid.querySelectorAll('[data-product-image]').forEach((image) => {
      image.addEventListener('error', () => image.remove(), { once: true });
    });
    productGrid.querySelectorAll('.img-alt').forEach((image) => {
      image.addEventListener('error', () => image.remove(), { once: true });
    });
    productGrid.querySelectorAll('.reveal').forEach(reveal);
    injectProductJsonLd(products);
  }

  // JSON-LD Product tu field API that (name/slug). Khong gia/rating tinh.
  function injectProductJsonLd(products) {
    try {
      document.querySelector('#featured-jsonld')?.remove();
      const data = {
        '@context': 'https://schema.org',
        '@graph': products.slice(0, 4).map((p) => ({
          '@type': 'Product',
          name: String(p.name || ''),
          url: `/catalog/?product=${encodeURIComponent(p.slug)}`,
          image: `/assets/products/${encodeURIComponent(slugify(p.slug))}.webp`,
          brand: { '@type': 'Brand', name: 'Sương Mai Coffee Roasters' },
        })),
      };
      const tag = document.createElement('script');
      tag.type = 'application/ld+json';
      tag.id = 'featured-jsonld';
      tag.textContent = JSON.stringify(data);
      document.head.appendChild(tag);
    } catch (err) { /* no-op */ }
  }

  async function loadFeatured() {
    if (!productGrid || !window.CatalogApi) {
      setFeaturedState('Cà phê đang nghỉ một nhịp. Bạn vẫn có thể ghé cửa hàng để xem lựa chọn hiện có.', 'error');
      return;
    }
    renderSkeletons();
    setFeaturedState('Đang tải cà phê nổi bật…');
    try {
      const result = await window.CatalogApi.products({ page: '1', per_page: '4', sort: 'newest' });
      const products = Array.isArray(result) ? result : result.data;
      if (!Array.isArray(products) || products.length === 0) {
        productGrid.innerHTML = '';
        setFeaturedState('Những mẻ rang mới đang được chuẩn bị. Hãy ghé cửa hàng để xem lựa chọn hiện có.', 'empty');
        return;
      }
      renderProducts(products);
      setFeaturedState('');
    } catch (error) {
      productGrid.innerHTML = '';
      setFeaturedState(error.message || 'Cà phê đang nghỉ một nhịp. Bạn vẫn có thể ghé cửa hàng để xem lựa chọn hiện có.', 'error');
    }
  }

  /* ------------------------------------------------- 3. Tabs (story + brew) */
  function wireTabs(tabs, panel, onActivate) {
    const list = [...tabs];
    if (!list.length || !panel) return { activate: () => {}, list: [] };
    function activate(tab, focus) {
      list.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', tab.id);
      onActivate(tab);
      if (focus) tab.focus();
    }
    list.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab, false));
      tab.addEventListener('keydown', (event) => {
        const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        activate(list[(index + direction + list.length) % list.length], true);
      });
    });
    return { activate, list };
  }

  const PROCESS_STEPS = {
    origin: { count: 'Chặng 01', name: 'Vùng trồng', description: 'Khí hậu cao nguyên và nhịp mùa tạo nên nét riêng cho mỗi vùng cà phê.', asset: '/assets/story/process-farm.webp' },
    select: { count: 'Chặng 02', name: 'Chọn hạt', description: 'Chọn lọc những hạt phù hợp với hương vị mà chúng tôi muốn giữ lại trong tách.', asset: '/assets/story/process-select.webp' },
    roast: { count: 'Chặng 03', name: 'Rang', description: 'Điều chỉnh từng mẻ rang để làm nổi bật đặc tính tự nhiên của hạt.', asset: '/assets/story/process-roast.webp' },
    brew: { count: 'Chặng 04', name: 'Pha thưởng thức', description: 'Pha theo cách bạn yêu thích và dành một phút thật chậm để cảm nhận.', asset: '/assets/story/process-brew.webp' },
  };

  let processApi = null;
  function initProcessTabs() {
    const tabs = document.querySelectorAll('.process-tab');
    const panel = document.querySelector('#process-panel');
    const progress = document.querySelector('[data-process-progress]');
    const stepImages = [...document.querySelectorAll('[data-step-image]')];
    stepImages.forEach((img) => img.addEventListener('error', () => img.remove(), { once: true }));
    processApi = wireTabs(tabs, panel, (tab) => {
      const content = PROCESS_STEPS[tab.dataset.step];
      if (!content) return;
      document.querySelector('#process-count').textContent = content.count;
      document.querySelector('#process-name').textContent = content.name;
      document.querySelector('#process-description').textContent = content.description;
      panel.querySelector('.process-panel-art').setAttribute('data-asset-slot', content.asset);
      stepImages.forEach((img) => { img.hidden = img.getAttribute('data-step-image') !== tab.dataset.step; });
      if (progress && processApi) {
        const index = processApi.list.indexOf(tab);
        progress.style.width = `${100 / processApi.list.length}%`;
        progress.style.transform = `translateX(${index * 100}%)`;
      }
    });
  }

  const BREW_STEPS = {
    phin: { kicker: 'Chậm và đậm', name: 'Phin Việt Nam', description: 'Một nhịp nhỏ, tròn vị và thân thuộc — hợp cho buổi sáng cần thêm vài phút thong thả.', ratio: '1 : 10', temp: '92°C', time: '5–7 phút', asset: '/assets/brew/phin.webp' },
    pourover: { kicker: 'Trong và sáng', name: 'Pour over', description: 'Dòng nước chậm làm rõ hương hoa, trái cây và những lớp vị tinh tế của hạt.', ratio: '1 : 15', temp: '90°C', time: '3–4 phút', asset: '/assets/brew/pour-over.webp' },
    french: { kicker: 'Êm và đầy', name: 'French press', description: 'Ngâm đủ lâu để tách cà phê có thân vị tròn, ấm và dễ chia sẻ cùng nhau.', ratio: '1 : 12', temp: '94°C', time: '4 phút', asset: '/assets/brew/french-press.webp' },
  };

  function initBrewTabs() {
    const tabs = document.querySelectorAll('.brew-card');
    const panel = document.querySelector('#brew-panel');
    const vessel = panel ? panel.querySelector('[data-brew-image]') : null;
    if (vessel) vessel.addEventListener('error', () => vessel.remove(), { once: true });
    wireTabs(tabs, panel, (tab) => {
      const content = BREW_STEPS[tab.dataset.brew];
      if (!content) return;
      document.querySelector('#brew-kicker').textContent = content.kicker;
      document.querySelector('#brew-name').textContent = content.name;
      document.querySelector('#brew-description').textContent = content.description;
      document.querySelector('#brew-ratio').textContent = content.ratio;
      document.querySelector('#brew-temp').textContent = content.temp;
      document.querySelector('#brew-time').textContent = content.time;
      // Giu brew context sang catalog (?brew= duoc catalog.js map client-side).
      const cta = panel.querySelector('[data-brew-cta]');
      if (cta) cta.setAttribute('href', `/catalog/?brew=${encodeURIComponent(tab.dataset.brew)}`);
      if (vessel && vessel.isConnected) {
        vessel.src = content.asset;
      } else if (panel) {
        const fresh = document.createElement('img');
        fresh.src = content.asset;
        fresh.alt = '';
        fresh.width = 800; fresh.height = 600;
        fresh.loading = 'lazy';
        fresh.setAttribute('data-brew-image', '');
        fresh.addEventListener('error', () => fresh.remove(), { once: true });
        panel.querySelector('.brew-vessel').prepend(fresh);
      }
    });
  }

  /* ------------------------------------------------- 4. Freshness timeline */
  const FRESH_TIPS = {
    day0: { name: 'Vừa rang xong.', text: 'Hạt cần nghỉ để thoát CO₂ — nên chờ vài ngày trước khi pha.' },
    day7: { name: 'Đang ở độ thơm nhất.', text: 'Hương tròn đầy — lúc hợp nhất cho pour over buổi sáng.' },
    day14: { name: 'Vẫn rất ngon.', text: 'Vị êm và cân bằng — hợp với phin hoặc french press mỗi ngày.' },
    day30: { name: 'Qua mốc thưởng thức ngon nhất.', text: 'Vẫn pha được tách ấm lòng, nhưng hương đã dịu đi nhiều.' },
  };
  function initFreshness() {
    const dots = [...document.querySelectorAll('.fresh-dot')];
    if (!dots.length) return;
    dots.forEach((dot) => dot.addEventListener('click', () => {
      dots.forEach((d) => {
        const active = d === dot;
        d.classList.toggle('is-active', active);
        d.setAttribute('aria-pressed', String(active));
      });
      const tip = FRESH_TIPS[dot.dataset.fresh];
      if (!tip) return;
      document.querySelector('#freshness-tip-name').textContent = tip.name;
      document.querySelector('#freshness-tip-text').textContent = tip.text;
    }));
  }

  /* ------------------------------------------------- 5. Newsletter (UI-only) */
  function initNewsletter() {
    const form = document.querySelector('#newsletter-form');
    if (!form) return;
    const input = form.querySelector('#newsletter-email');
    const error = document.querySelector('#newsletter-error');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = String(input.value || '').trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      if (!valid) {
        error.textContent = 'Bạn nhập lại email giúp Sương Mai nhé.';
        error.hidden = false;
        input.focus();
        return;
      }
      error.hidden = true;
      form.reset();
      if (SM.toast) SM.toast('Cảm ơn bạn! Hẹn gặp ở mẻ rang mới.', { type: 'success' });
    });
  }

  /* -------------------------------------- 6. Motion nang cao (CDN-guarded) */
  function initWordReveal() {
    document.querySelectorAll('[data-word-reveal]').forEach((el) => {
      if (el.dataset.wordsDone) return;
      el.dataset.wordsDone = '1';
      const words = el.textContent.trim().split(/\s+/);
      el.setAttribute('aria-label', words.join(' '));
      el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${esc(w)}</span>`).join(' ');
    });
  }

  async function initMotion() {
    if (isReduced() || !SM.ensureMotion) return;
    const ok = await SM.ensureMotion().catch(() => false);
    if (!ok || !SM.gsap || !SM.ScrollTrigger) return;
    // Chi tach tu SAU KHI GSAP xac nhan: tranh kẹt opacity .15 khi CDN bi chan.
    initWordReveal();
    document.documentElement.classList.add('sm-gsap');
    const { gsap, ScrollTrigger } = SM;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    // Hero parallax: poster/video phong to + overlay dam dan, copy fade out.
    const heroMedia = document.querySelector('[data-hero-media]');
    const heroCopy = document.querySelector('.hero-copy');
    if (heroMedia) {
      gsap.to(heroMedia.querySelector('.hero-poster, .hero-video') || heroMedia, {
        scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    }
    if (heroCopy) {
      gsap.to(heroCopy, {
        yPercent: -15, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true },
      });
    }

    // Word reveal scrub cho H2 featured + attention.
    document.querySelectorAll('[data-word-reveal]').forEach((el) => {
      const words = el.querySelectorAll('.w');
      if (!words.length) return;
      gsap.to(words, {
        opacity: 1, stagger: 0.08, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 35%', scrub: true },
      });
    });

    // Featured: pin-ngang desktop (>=1050px), mobile giu grid doc.
    mm.add('(min-width: 1050px)', () => {
      const grid = document.querySelector('#featured-grid');
      const section = document.querySelector('.featured');
      if (!grid || !section) return;
      const cards = grid.querySelectorAll('.product-card');
      if (!cards.length) return;
      gsap.set(grid, { display: 'flex', width: 'max-content' });
      gsap.set(cards, { width: '34vw', maxWidth: '460px', flexShrink: 0 });
      const scroll = () => grid.scrollWidth - window.innerWidth + 48;
      gsap.to(grid, {
        x: () => -scroll(), ease: 'none',
        scrollTrigger: {
          trigger: '#featured-pin', start: 'top 12%', end: () => `+=${Math.max(400, scroll())}`,
          pin: true, scrub: 1, invalidateOnRefresh: true,
        },
      });
    });

    // Story: desktop doi chang theo scroll (doi ca aria-selected), mobile la tabs.
    mm.add('(min-width: 1050px)', () => {
      const stages = document.querySelector('[data-process-stages]');
      if (!stages || !processApi) return;
      const steps = processApi.list;
      const triggers = steps.map((tab, i) => ScrollTrigger.create({
        trigger: '#process', start: () => `top+=${i * 260} center`, end: () => `top+=${(i + 1) * 260} center`,
        onToggle: (self) => { if (self.isActive) processApi.activate(tab, false); },
      }));
      return () => triggers.forEach((t) => t.kill());
    });

    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }

  /* ---------------------------------------------------------------- Boot */
  initHero();
  initProcessTabs();
  initBrewTabs();
  initFreshness();
  initNewsletter();
  loadFeatured().then(() => { initMotion(); });
})();
