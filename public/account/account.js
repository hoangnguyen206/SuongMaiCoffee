(() => {
  'use strict';

  const QUOTES = [
    'Chậm một nhịp. Thưởng thức trọn hương.',
    'Rang mỗi ngày tại Đà Lạt.',
    'Từ vườn đến tách.',
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const authShell = $('#auth-shell');
  const accountShell = $('#account-shell');
  const status = $('#account-status');
  const shellStatus = $('#shell-status');
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  const profileForm = $('#profile-form');
  const passwordForm = $('#password-form');
  const viewLogin = $('#view-login');
  const viewRegister = $('#view-register');
  const viewSuccess = $('#view-success');
  const passwordInputs = [$('#register-password'), $('#password-new')].filter(Boolean);

  const helpers = () => window.SmReorder || {};
  const esc = value => (helpers().escapeHtml || (input => String(input ?? '')))(value);
  const money = value => (helpers().money || (input => `${Number(input) || 0}đ`))(value);
  const fmtDate = value => (helpers().fmtDate || (() => ''))(value);
  const shortCode = value => (helpers().shortCode || (input => String(input || '')))(value);
  const firstName = value => (helpers().firstName || (() => 'bạn'))(value);
  const badge = value => (helpers().badge || (() => ''))(value);

  function toast(message, options) {
    if (window.SM && typeof window.SM.toast === 'function') window.SM.toast(message, options);
  }

  /* ---------- Status banner ---------- */
  function showMessage(node, message, kind = '') {
    if (!node) return;
    node.textContent = message || '';
    node.className = `status${kind ? ` ${kind}` : ''}`;
    node.hidden = !message;
  }

  /* ---------- Field errors ---------- */
  function setFieldError(form, name, message) {
    const wrap = form.querySelector(`.field[data-field="${name}"]`);
    if (!wrap) return false;
    wrap.classList.toggle('is-invalid', Boolean(message));
    const slot = wrap.querySelector('[data-error-text]');
    if (slot) slot.textContent = message || '';
    const input = wrap.querySelector('input, select, textarea');
    if (input && message) input.setAttribute('aria-invalid', 'true');
    else if (input) input.removeAttribute('aria-invalid');
    return true;
  }

  function clearErrors(form) {
    $$('.field[data-field]', form).forEach(wrap => {
      wrap.classList.remove('is-invalid');
      const slot = wrap.querySelector('[data-error-text]');
      if (slot) slot.textContent = '';
      const input = wrap.querySelector('input, select, textarea');
      if (input) input.removeAttribute('aria-invalid');
    });
  }

  function applyServerErrors(form, error, bannerNode) {
    clearErrors(form);
    const fields = (error && error.fields) || {};
    const messages = [];
    Object.entries(fields).forEach(([name, values]) => {
      const list = Array.isArray(values) ? values : [values];
      setFieldError(form, name, list.filter(Boolean).join(' '));
      list.forEach(text => { if (text) messages.push(text); });
    });
    showMessage(bannerNode, messages.length ? messages.join(' ') : (error && error.message) || 'Không thể hoàn tất yêu cầu.', 'error');
  }

  /* ---------- Loading buttons ---------- */
  function setLoading(form, loading, label) {
    const button = form.querySelector('[data-submit]');
    if (!button) return;
    if (loading) {
      if (!button.dataset.label) button.dataset.label = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="spinner" aria-hidden="true"></span> Đang xử lý…';
    } else {
      button.disabled = form === registerForm && !$('#register-terms')?.checked ? true : false;
      if (button.dataset.label) button.innerHTML = button.dataset.label;
      else if (label) button.textContent = label;
    }
  }

  /* ---------- Client validation (hiển thị sớm, không thay backend) ---------- */
  const emailOk = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
  const phoneOk = value => /^0[35789][0-9]{8}$/.test(String(value || '').replace(/[\s.()-]+/g, ''));
  const passwordChecks = value => {
    const text = String(value || '');
    return { length: text.length >= 8, letter: /\p{L}/u.test(text), digit: /\p{N}/u.test(text) };
  };

  function updateChecklist(input) {
    const wrap = input.closest('.field');
    if (!wrap) return;
    const checks = passwordChecks(input.value);
    Object.entries(checks).forEach(([key, pass]) => {
      const row = wrap.querySelector(`[data-check="${key}"]`);
      if (!row) return;
      row.classList.toggle('is-pass', pass);
      const dot = row.querySelector('[aria-hidden="true"]');
      if (dot) dot.textContent = pass ? '●' : '○';
    });
    const bar = wrap.querySelector('.strength');
    if (bar) {
      const score = Object.values(checks).filter(Boolean).length;
      if (!input.value) bar.removeAttribute('data-score');
      else bar.dataset.score = String(Math.min(4, Math.max(1, score)));
    }
  }

  function validateLoginField(input) {
    const name = input.name;
    const value = input.value.trim();
    if (name === 'email') return value && !emailOk(value) ? 'Email chưa đúng định dạng.' : '';
    if (name === 'password') {
      const checks = passwordChecks(input.value);
      return input.value && (!checks.length || !checks.letter || !checks.digit) ? 'Mật khẩu tối thiểu 8 ký tự, gồm chữ và số.' : '';
    }
    return '';
  }

  function validateRegisterField(input) {
    const base = validateLoginField(input);
    if (base || input.name === 'email' || input.name === 'password') return base;
    if (input.name === 'full_name') {
      const value = input.value.trim();
      return value && value.length > 120 ? 'Họ tên quá dài (tối đa 120 ký tự).' : '';
    }
    if (input.name === 'phone') {
      const value = input.value.replace(/[\s.()-]+/g, '');
      return value && !phoneOk(value) ? 'Nhập số điện thoại Việt Nam gồm 10 chữ số, ví dụ 0901234567.' : '';
    }
    return '';
  }

  function bindRealtime(form, validator) {
    form.addEventListener('blur', event => {
      const input = event.target.closest('input');
      if (!input || !form.contains(input) || input.type === 'checkbox') return;
      setFieldError(form, input.name, validator(input));
    }, true);
    form.addEventListener('input', event => {
      const input = event.target.closest('input');
      if (!input || !form.contains(input)) return;
      if (input.type === 'password' && (input.id === 'register-password' || input.id === 'password-new')) updateChecklist(input);
      const wrap = input.closest('.field');
      if (wrap && wrap.classList.contains('is-invalid')) setFieldError(form, input.name, validator(input));
      if (input.name === 'confirm_password') {
        const fresh = $('#password-new')?.value || '';
        setFieldError(form, 'confirm_password', input.value && input.value !== fresh ? 'Mật khẩu nhập lại chưa khớp.' : '');
      }
    });
  }

  // Auto-format SĐT VN: 0xxx xxx xxx.
  function bindPhoneFormat(input) {
    if (!input) return;
    input.addEventListener('input', () => {
      const digits = input.value.replace(/\D+/g, '').slice(0, 10);
      input.value = digits.replace(/^(\d{0,4})(\d{0,3})(\d{0,3}).*$/, (match, a, b, c) => [a, b, c].filter(Boolean).join(' '));
    });
  }

  /* ---------- Password toggles ---------- */
  $$('[data-password-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;
      const showing = input.type === 'password';
      input.type = showing ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(showing));
      button.setAttribute('aria-label', showing ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      input.focus();
    });
  });

  /* ---------- Terms gate ---------- */
  const termsCheckbox = $('#register-terms');
  if (termsCheckbox) {
    termsCheckbox.addEventListener('change', () => {
      const submit = registerForm.querySelector('[data-submit]');
      if (submit) submit.disabled = !termsCheckbox.checked;
    });
  }

  /* ---------- Modals (forgot + terms) ---------- */
  let modalReturnFocus = null;
  function openModal(id) {
    const backdrop = document.getElementById(id);
    if (!backdrop) return;
    modalReturnFocus = document.activeElement;
    backdrop.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('is-open')));
    document.body.style.overflow = 'hidden';
    const focusable = backdrop.querySelector('button, [href]');
    if (focusable) focusable.focus();
  }
  function closeModal(backdrop) {
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(() => { backdrop.hidden = true; }, 200);
    if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') modalReturnFocus.focus();
  }
  $$('.sm-modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('mousedown', event => { if (event.target === backdrop) closeModal(backdrop); });
    backdrop.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeModal(backdrop);
      if (event.key === 'Tab') {
        const items = $$('button, [href]', backdrop).filter(el => !el.disabled);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    $$('[data-modal-close]', backdrop).forEach(button => button.addEventListener('click', () => closeModal(backdrop)));
  });
  $('#forgot-link')?.addEventListener('click', () => openModal('forgot-modal'));
  $$('[data-terms-open]').forEach(button => button.addEventListener('click', () => openModal('terms-modal')));

  /* ---------- Auth views ---------- */
  function setMode(mode) {
    const registering = mode === 'register';
    viewLogin.hidden = registering;
    viewRegister.hidden = !registering;
    viewSuccess.hidden = true;
    showMessage(status, '');
    const focusTarget = registering ? $('#register-name') : $('#login-email');
    if (focusTarget) window.setTimeout(() => focusTarget.focus(), 60);
    try {
      const url = new URL(window.location.href);
      if (registering) url.searchParams.set('mode', 'register');
      else url.searchParams.delete('mode');
      window.history.replaceState({}, '', url);
    } catch { /* no-op */ }
  }

  function showSuccess(user, mergeNote) {
    viewLogin.hidden = true;
    viewRegister.hidden = true;
    viewSuccess.hidden = false;
    $('#success-name').textContent = firstName(user && user.full_name);
    const note = $('#success-merge-note');
    if (note) {
      note.hidden = !mergeNote;
      note.textContent = mergeNote || '';
    }
    $('#success-open-account')?.focus();
  }

  $('#show-login')?.addEventListener('click', () => setMode('login'));
  $('#show-register')?.addEventListener('click', () => setMode('register'));
  $('#success-open-account')?.addEventListener('click', async () => {
    try {
      const state = await window.AccountApi.session();
      if (state.authenticated) setAuthenticated(state.user);
    } catch { /* no-op */ }
  });

  /* ---------- Quote rotator ---------- */
  const quoteText = $('#auth-quote-text');
  const quoteDots = $$('.auth-quote-dots [data-quote]');
  const quoteSlides = $$('.auth-slide');
  let quoteIndex = 0;
  let quoteTimer = 0;
  function showQuote(index) {
    quoteIndex = (index + QUOTES.length) % QUOTES.length;
    quoteDots.forEach((dot, position) => {
      const active = position === quoteIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', String(active));
    });
    quoteSlides.forEach((slide, position) => slide.classList.toggle('is-active', position === quoteIndex));
    if (quoteText) {
      quoteText.classList.add('is-fading');
      window.setTimeout(() => {
        quoteText.textContent = QUOTES[quoteIndex];
        quoteText.classList.remove('is-fading');
      }, 180);
    }
  }
  function startQuotes() {
    if (quoteTimer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    quoteTimer = window.setInterval(() => showQuote(quoteIndex + 1), 5000);
  }
  quoteDots.forEach(dot => dot.addEventListener('click', () => {
    window.clearInterval(quoteTimer);
    quoteTimer = 0;
    showQuote(Number(dot.dataset.quote) || 0);
    startQuotes();
  }));

  /* ---------- Auth submit ---------- */
  function formValues(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function mergeFailureMessage(error) {
    const conflicts = (error && error.details && error.details.conflicts) || [];
    if (error && error.code === 'CART_MERGE_CONFLICT' && conflicts.length) {
      const limits = conflicts.map(conflict => conflict.max_acceptable_quantity).join(', ');
      return `Đăng nhập thành công. Một số sản phẩm cần điều chỉnh trước khi gộp; số lượng tối đa hiện có: ${limits}.`;
    }
    return 'Đăng nhập thành công nhưng chưa thể gộp giỏ hàng tạm thời.';
  }

  async function mergeGuestCart() {
    try {
      await window.AccountApi.mergeCart();
      return '';
    } catch (error) {
      return mergeFailureMessage(error);
    }
  }

  async function handleAuth(form, operation, { genericError }) {
    clearErrors(form);
    setLoading(form, true);
    showMessage(status, 'Đang xử lý…');
    try {
      const data = await operation();
      setLoading(form, false);
      return data;
    } catch (error) {
      setLoading(form, false);
      if (error && (error.status === 401 || error.status === 403)) {
        showMessage(status, genericError || (error.message || 'Không thể đăng nhập lúc này.'), 'error');
      } else if (error && error.status === 429) {
        showMessage(status, (error.message || 'Bạn thử quá nhiều lần.') + ' Thử lại sau 1 phút nhé.', 'error');
      } else if (error && error.status >= 500) {
        showMessage(status, 'Máy chủ đang bận. Vui lòng thử lại sau.', 'error');
      } else {
        applyServerErrors(form, error, status);
      }
      status.focus();
      return null;
    }
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    let firstInvalid = null;
    $$('input', loginForm).forEach(input => {
      const message = validateLoginField(input);
      setFieldError(loginForm, input.name, message);
      if (message && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }
    const data = await handleAuth(loginForm, () => window.AccountApi.login(formValues(loginForm)), {
      genericError: 'Sai email hoặc mật khẩu. Thử lại nhé.',
    });
    if (data && data.user) {
      loginForm.reset();
      const notice = await mergeGuestCart();
      // Redirect ?next= an toàn: chỉ path nội bộ (bắt đầu / nhưng không //).
      let next = '';
      try {
        const raw = new URLSearchParams(window.location.search).get('next') || '';
        if (/^\/(?!\/)/.test(raw) && !raw.includes('\\')) next = raw;
      } catch { /* no-op */ }
      if (next) {
        if (notice) sessionStorage.setItem('accountNotice', notice);
        window.location.assign(next);
        return;
      }
      setAuthenticated(data.user);
      showMessage(shellStatus, 'Đăng nhập thành công. Chào mừng bạn trở lại!', 'success');
      if (notice) toast(notice, { type: 'warning' });
    }
  });

  registerForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (termsCheckbox && !termsCheckbox.checked) { termsCheckbox.focus(); return; }
    let firstInvalid = null;
    $$('input', registerForm).forEach(input => {
      if (input.type === 'checkbox') return;
      const message = validateRegisterField(input);
      setFieldError(registerForm, input.name, message);
      if (message && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }
    const payload = formValues(registerForm);
    payload.phone = String(payload.phone || '').replace(/[\s.()-]+/g, '');
    const data = await handleAuth(registerForm, () => window.AccountApi.register(payload), {});
    if (data && data.user) {
      registerForm.reset();
      passwordInputs.forEach(updateChecklist);
      if (termsCheckbox) {
        termsCheckbox.checked = false;
        registerForm.querySelector('[data-submit]').disabled = true;
      }
      const notice = await mergeGuestCart();
      if (notice) sessionStorage.setItem('accountNotice', notice);
      showSuccess(data.user, notice);
    }
  });

  /* ---------- Account shell ---------- */
  let currentUser = null;
  let overviewLoaded = false;
  let favoriteProduct = null;

  function greetingForHour() {
    const hour = new Date().getHours();
    if (hour < 11) return 'Chào buổi sáng';
    if (hour < 14) return 'Chào buổi trưa';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  function setAuthenticated(user) {
    currentUser = user || null;
    const loggedIn = Boolean(user);
    authShell.hidden = loggedIn;
    accountShell.hidden = !loggedIn;
    window.clearInterval(quoteTimer);
    quoteTimer = 0;
    if (!loggedIn) {
      overviewLoaded = false;
      startQuotes();
      return;
    }
    profileForm.elements.namedItem('full_name').value = user.full_name || '';
    profileForm.elements.namedItem('email').value = user.email || '';
    profileForm.elements.namedItem('phone').value = user.phone || '';
    $('#acct-greeting').textContent = `${greetingForHour()}, ${firstName(user.full_name)} ☕`;
    showMessage(shellStatus, '');
    if (!overviewLoaded) loadOverview();
    updateProfileBanner();
  }

  function switchTab(name) {
    $$('[data-acct-tab]').forEach(control => {
      const active = control.dataset.acctTab === name;
      control.classList.toggle('is-active', active);
      if (control.tagName === 'BUTTON' && control.classList.contains('acct-side-item')) {
        if (active) control.setAttribute('aria-current', 'page');
        else control.removeAttribute('aria-current');
      }
    });
    $$('[data-acct-panel]').forEach(panel => { panel.hidden = panel.dataset.acctPanel !== name; });
    if (name === 'overview' && !overviewLoaded) loadOverview();
    try {
      const url = new URL(window.location.href);
      if (name && name !== 'overview') url.searchParams.set('tab', name);
      else url.searchParams.delete('tab');
      window.history.replaceState({}, '', url);
    } catch { /* no-op */ }
  }

  $$('[data-acct-tab]').forEach(control => control.addEventListener('click', () => switchTab(control.dataset.acctTab)));

  function updateProfileBanner() {
    const banner = $('#profile-complete-banner');
    if (!banner || !currentUser) return;
    const hasPhone = Boolean(String(currentUser.phone || '').trim());
    const percent = hasPhone ? 100 : 67;
    $('#complete-percent').textContent = `${percent}%`;
    banner.hidden = hasPhone;
  }

  /* ---------- Overview ---------- */
  function orderCard(order) {
    const card = document.createElement('article');
    card.className = 'card card-hover order-card';
    const thumbs = document.createElement('div');
    thumbs.className = 'order-thumbs';
    thumbs.setAttribute('aria-hidden', 'true');
    card.append(thumbs);
    // TODO(backend): API /account/orders chỉ trả tổng tiền + trạng thái, chưa có
    // món trong đơn — thumbnail chi tiết từng đơn cần API mở rộng.
    const info = document.createElement('div');
    info.className = 'order-info';
    const codeHtml = `<a href="/account/order/?code=${encodeURIComponent(order.order_code || '')}">${esc(shortCode(order.order_code))}</a>`;
    info.innerHTML = `<h3 class="order-code">${codeHtml}</h3><p class="order-meta">${esc(fmtDate(order.created_at))}</p>`;
    const badgeHtml = badge(order.status);
    if (badgeHtml) info.insertAdjacentHTML('beforeend', badgeHtml);
    card.append(info);
    const side = document.createElement('div');
    side.className = 'order-side';
    side.innerHTML = `<span class="order-total">${esc(money(order.grand_total_vnd))}</span>`;
    const actions = document.createElement('div');
    actions.className = 'order-actions';
    const track = document.createElement('a');
    track.className = 'button button-sm button-outline';
    track.href = `/account/order/?code=${encodeURIComponent(order.order_code || '')}`;
    track.textContent = 'Theo dõi';
    const buyback = document.createElement('button');
    buyback.className = 'button button-sm';
    buyback.type = 'button';
    buyback.textContent = 'Mua lại';
    buyback.addEventListener('click', () => reorderOrder(order.order_code, buyback));
    actions.append(track, buyback);
    side.append(actions);
    card.append(side);
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

  async function loadOverview() {
    overviewLoaded = true;
    const recentStatus = $('#recent-status');
    const recentList = $('#recent-list');
    const suggestStatus = $('#suggest-status');
    const suggestList = $('#suggest-list');
    recentList.replaceChildren();
    suggestList.replaceChildren();

    // Đơn gần đây + stats.
    try {
      await window.CartApi.session();
      const orders = await window.CartApi.accountOrders();
      const list = Array.isArray(orders) ? orders : [];
      $('#stat-orders').textContent = String(list.length);
      const spent = list.filter(order => order.status !== 'cancelled')
        .reduce((sum, order) => sum + (Number(order.grand_total_vnd) || 0), 0);
      $('#stat-spent').textContent = money(spent);
      const shipping = list.find(order => order.status === 'shipping');
      const roasting = list.find(order => order.status === 'roasting');
      const pending = list.find(order => order.status === 'pending' || order.status === 'confirmed');
      $('#acct-context').textContent = shipping
        ? `Đơn ${shortCode(shipping.order_code)} đang trên đường tới bạn.`
        : roasting ? `Xưởng rang đang rang đơn ${shortCode(roasting.order_code)} cho bạn.`
          : pending ? `Đơn ${shortCode(pending.order_code)} đang chờ xưởng xác nhận.`
            : list.length ? 'Cảm ơn bạn đã đồng hành cùng Sương Mai.'
              : 'Sương sớm đang chờ bạn khám phá.';
      if (!list.length) {
        recentStatus.textContent = '';
        const empty = document.createElement('div');
        empty.className = 'card empty-state';
        empty.innerHTML = '<img src="/assets/ui/icon-bean.svg" alt="" width="72" height="72" loading="lazy">' +
          '<h3>Bạn chưa có đơn nào.</h3><p>Bắt đầu với một mẻ rang mới từ Đà Lạt nhé.</p>' +
          '<p><a class="button" href="/catalog/">Khám phá cửa hàng</a></p>';
        empty.querySelector('img').addEventListener('error', event => event.target.remove(), { once: true });
        recentList.append(empty);
      } else {
        recentStatus.textContent = `Hiển thị ${Math.min(3, list.length)} đơn mới nhất.`;
        list.slice(0, 3).forEach(order => recentList.append(orderCard(order)));
      }
      // Hạt yêu thích = món xuất hiện nhiều nhất ở đơn gần nhất có items.
      await loadFavorite(list);
    } catch (error) {
      recentStatus.textContent = (error && error.message) || 'Không tải được đơn hàng.';
    }

    // Gợi ý: món mới nhất còn hàng (3 món).
    try {
      const params = new URLSearchParams({ sort: 'newest', per_page: '12', in_stock: 'true' });
      const products = await window.CatalogApi.products(Object.fromEntries(params));
      const items = (Array.isArray(products) ? products : products.items || []).slice(0, 3);
      if (!items.length) {
        suggestStatus.textContent = 'Cửa hàng đang cập nhật món mới.';
      } else {
        suggestStatus.textContent = '';
        items.forEach((product, index) => suggestList.append(suggestCard(product, index === 0)));
      }
    } catch {
      suggestStatus.textContent = 'Chưa tải được gợi ý lúc này.';
    }
  }

  async function loadFavorite(orders) {
    const label = $('#stat-favorite');
    const button = $('#favorite-reorder');
    label.textContent = '—';
    button.hidden = true;
    favoriteProduct = null;
    for (const order of orders.slice(0, 5)) {
      try {
        const detail = await window.CartApi.accountOrder(order.order_code);
        const items = Array.isArray(detail.items) ? detail.items : [];
        if (!items.length) continue;
        const counts = new Map();
        items.forEach(item => {
          const key = String(item.product_name || '');
          if (key) counts.set(key, (counts.get(key) || 0) + (Number(item.quantity) || 1));
        });
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        if (!top) continue;
        const winner = items.find(item => String(item.product_name) === top[0]);
        favoriteProduct = winner;
        label.textContent = String(winner.product_name);
        button.hidden = false;
        button.onclick = () => helpers().reorderItems([{
          product_name: winner.product_name,
          variant_label: winner.variant_label,
          grind_label: winner.grind_label,
          quantity: 1,
        }]);
        return;
      } catch { /* thử đơn khác */ }
    }
    label.textContent = orders.length ? 'Chưa xác định' : '—';
  }

  function suggestCard(product, eager) {
    const card = document.createElement('article');
    card.className = 'card card-hover suggest-card';
    const media = document.createElement('div');
    media.className = 'suggest-media';
    const mainSrc = helpers().productImage ? helpers().productImage(product.slug, 'main') : null;
    const altSrc = helpers().productImage ? helpers().productImage(product.slug, 'alt') : null;
    if (mainSrc) {
      const main = document.createElement('img');
      main.src = mainSrc;
      main.alt = `Túi cà phê ${product.name || 'Sương Mai'}`;
      main.width = 600;
      main.height = 450;
      main.loading = eager ? 'eager' : 'lazy';
      if (eager) main.setAttribute('fetchpriority', 'high');
      main.className = 'card-img-main';
      main.addEventListener('error', () => main.remove(), { once: true });
      media.append(main);
    }
    if (altSrc) {
      const alt = document.createElement('img');
      alt.src = altSrc;
      alt.alt = '';
      alt.setAttribute('aria-hidden', 'true');
      alt.width = 600;
      alt.height = 450;
      alt.loading = 'lazy';
      alt.className = 'card-img-alt';
      alt.addEventListener('error', () => alt.remove(), { once: true });
      media.append(alt);
    }
    const available = product.available !== false;
    media.insertAdjacentHTML('beforeend', `<span class="suggest-avail${available ? '' : ' is-off'}">${available ? 'Còn hàng' : 'Tạm hết hàng'}</span>`);
    card.append(media);
    const body = document.createElement('div');
    body.className = 'suggest-body';
    const origin = product.origin && product.origin.name ? ` · ${esc(product.origin.name)}` : '';
    body.innerHTML = `<h3><a href="/catalog/?product=${encodeURIComponent(product.slug || '')}">${esc(product.name || 'Cà phê Sương Mai')}</a></h3>` +
      `<p class="suggest-origin">Từ ${esc(money(product.minimum_price_vnd))}${origin}</p>`;
    const foot = document.createElement('div');
    foot.className = 'suggest-foot';
    const price = document.createElement('span');
    price.className = 'suggest-price';
    price.textContent = money(product.minimum_price_vnd);
    const view = document.createElement('a');
    view.className = 'button button-sm button-outline';
    view.href = `/catalog/?product=${encodeURIComponent(product.slug || '')}`;
    view.textContent = 'Xem món';
    foot.append(price, view);
    body.append(foot);
    card.append(body);
    return card;
  }

  /* ---------- Profile + password ---------- */
  bindRealtime(profileForm, input => {
    if (input.name === 'full_name') return input.value.trim() ? '' : 'Nhập họ và tên.';
    if (input.name === 'phone') return input.value.trim() && !phoneOk(input.value) ? 'Nhập số điện thoại Việt Nam gồm 10 chữ số, ví dụ 0901234567.' : '';
    return '';
  });
  bindRealtime(passwordForm, input => {
    if (input.name === 'new_password') {
      const checks = passwordChecks(input.value);
      return input.value && (!checks.length || !checks.letter || !checks.digit) ? 'Mật khẩu cần tối thiểu 8 ký tự và có cả chữ lẫn số.' : '';
    }
    if (input.name === 'confirm_password') {
      return input.value && input.value !== ($('#password-new')?.value || '') ? 'Mật khẩu nhập lại chưa khớp.' : '';
    }
    return '';
  });
  bindPhoneFormat($('#register-phone'));
  bindPhoneFormat($('#profile-phone'));
  passwordInputs.forEach(updateChecklist);

  profileForm.addEventListener('submit', async event => {
    event.preventDefault();
    const nameInput = profileForm.elements.namedItem('full_name');
    const phoneInput = profileForm.elements.namedItem('phone');
    let invalid = false;
    if (!nameInput.value.trim()) { setFieldError(profileForm, 'full_name', 'Nhập họ và tên.'); invalid = true; }
    if (phoneInput.value.trim() && !phoneOk(phoneInput.value)) {
      setFieldError(profileForm, 'phone', 'Nhập số điện thoại Việt Nam gồm 10 chữ số, ví dụ 0901234567.');
      invalid = true;
    }
    if (invalid) return;
    clearErrors(profileForm);
    setLoading(profileForm, true);
    showMessage(shellStatus, 'Đang lưu…');
    try {
      const data = await window.AccountApi.updateProfile({
        full_name: nameInput.value.trim(),
        phone: String(phoneInput.value).replace(/[\s.()-]+/g, ''),
      });
      setLoading(profileForm, false);
      if (data) {
        currentUser = data;
        updateProfileBanner();
        $('#acct-greeting').textContent = `${greetingForHour()}, ${firstName(data.full_name)} ☕`;
      }
      showMessage(shellStatus, 'Thông tin đã được cập nhật.', 'success');
      toast('Đã lưu hồ sơ.', { type: 'success' });
    } catch (error) {
      setLoading(profileForm, false);
      if (error && error.status >= 500) showMessage(shellStatus, 'Máy chủ đang bận. Vui lòng thử lại sau.', 'error');
      else applyServerErrors(profileForm, error, shellStatus);
    }
  });

  passwordForm.addEventListener('submit', async event => {
    event.preventDefault();
    const fresh = $('#password-new')?.value || '';
    const confirm = $('#password-confirm')?.value || '';
    const checks = passwordChecks(fresh);
    let invalid = false;
    if (!fresh || !checks.length || !checks.letter || !checks.digit) {
      setFieldError(passwordForm, 'new_password', 'Mật khẩu cần tối thiểu 8 ký tự và có cả chữ lẫn số.');
      invalid = true;
    }
    if (confirm !== fresh) {
      setFieldError(passwordForm, 'confirm_password', 'Mật khẩu nhập lại chưa khớp.');
      invalid = true;
    }
    if (invalid) return;
    clearErrors(passwordForm);
    setLoading(passwordForm, true);
    showMessage(shellStatus, 'Đang cập nhật…');
    try {
      // API chỉ nhận { current_password, new_password } — confirm chỉ kiểm tra ở UI.
      await window.AccountApi.changePassword({
        current_password: passwordForm.elements.namedItem('current_password').value,
        new_password: fresh,
      });
      setLoading(passwordForm, false);
      passwordForm.reset();
      passwordInputs.forEach(updateChecklist);
      showMessage(shellStatus, 'Mật khẩu đã được cập nhật.', 'success');
      toast('Đã đổi mật khẩu.', { type: 'success' });
    } catch (error) {
      setLoading(passwordForm, false);
      if (error && error.status >= 500) showMessage(shellStatus, 'Máy chủ đang bận. Vui lòng thử lại sau.', 'error');
      else applyServerErrors(passwordForm, error, shellStatus);
    }
  });

  /* ---------- Logout ---------- */
  async function logout(button) {
    const name = currentUser ? firstName(currentUser.full_name) : 'bạn';
    let confirmed = true;
    if (window.SM && typeof window.SM.confirm === 'function') {
      confirmed = await window.SM.confirm({
        title: `Đăng xuất nhé, ${name}?`,
        message: 'Bạn sẽ cần đăng nhập lại để xem đơn hàng và hồ sơ.',
        confirmLabel: 'Đăng xuất',
        cancelLabel: 'Ở lại',
        danger: true,
      });
    }
    if (!confirmed) return;
    const original = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = 'Đang đăng xuất…';
    }
    try {
      await window.AccountApi.logout();
      try { await window.CartApi.session(); } catch { /* no-op */ }
      setAuthenticated(null);
      setMode('login');
      showMessage(status, 'Bạn đã đăng xuất.', 'success');
    } catch (error) {
      showMessage(shellStatus, (error && error.message) || 'Không thể đăng xuất lúc này.', 'error');
      toast('Không thể đăng xuất lúc này.', { type: 'error' });
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
    }
  }
  $('#logout-button')?.addEventListener('click', event => logout(event.currentTarget));

  /* ---------- Boot ---------- */
  bindRealtime(loginForm, validateLoginField);
  bindRealtime(registerForm, validateRegisterField);

  (async () => {
    const params = new URLSearchParams(window.location.search);
    try {
      const state = await window.AccountApi.session();
      setAuthenticated(state.authenticated ? state.user : null);
      if (!state.authenticated) {
        setMode(params.get('mode') === 'register' ? 'register' : 'login');
      } else {
        const tab = params.get('tab');
        if (tab === 'profile' || tab === 'password') switchTab(tab);
      }
    } catch (error) {
      authShell.hidden = false;
      setMode(params.get('mode') === 'register' ? 'register' : 'login');
      if (error && error.status >= 500) showMessage(status, 'Không thể kết nối máy chủ. Vui lòng thử lại sau.', 'error');
      else if (error && error.message) showMessage(status, error.message, 'error');
    } finally {
      startQuotes();
      if (document.activeElement === document.body && !accountShell.hidden) {
        const focusTarget = viewRegister.hidden ? $('#login-email') : $('#register-name');
        if (focusTarget) window.setTimeout(() => focusTarget.focus(), 120);
      }
    }
  })();
})();
