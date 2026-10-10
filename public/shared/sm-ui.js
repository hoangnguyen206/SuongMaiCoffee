/* ==========================================================================
   Suong Mai Coffee Roasters — sm-ui.js (FOUNDATION)
   UI dung chung, KHONG phu thuoc (chay duoc mot minh, ke ca khi CDN chet):
   toast, confirm modal, order badge, order timeline, header behaviors,
   cart badge. Trang admin CHI load file nay (+ site-theme.css).

   Moi copy tieng Viet. Ton trong prefers-reduced-motion qua CSS.
   ========================================================================== */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.SM = window.SM || {};
  const SM = window.SM;

  /* ------------------------------------------------------------------
     0. Tien ich.
  ------------------------------------------------------------------ */
  SM.escapeHtml = function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  };

  function focusFirst(container) {
    try {
      const target = container.querySelector('[data-autofocus]') ||
        container.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (target && typeof target.focus === 'function') target.focus();
    } catch (err) { /* no-op */ }
  }

  // Focus trap don gian cho drawer/modal.
  function trapFocus(container, event) {
    try {
      const items = [...container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (items.length === 0) { event.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    } catch (err) { /* no-op */ }
  }

  /* ------------------------------------------------------------------
     1. Toast — ho tro action (Hoan tac / Xem gio).
     SM.toast(message, { type, title, actionLabel, onAction, duration })
     type: 'info' | 'success' | 'warning' | 'error'
  ------------------------------------------------------------------ */
  const TOAST_ICONS = { info: '✳', success: '✓', warning: '⚠', error: '✕' };

  SM.toast = function toast(message, options = {}) {
    try {
      const type = ['info', 'success', 'warning', 'error'].includes(options.type) ? options.type : 'info';
      let stack = document.querySelector('.sm-toasts');
      if (!stack) {
        stack = document.createElement('div');
        stack.className = 'sm-toasts';
        stack.setAttribute('aria-live', 'polite');
        stack.setAttribute('aria-atomic', 'false');
        document.body.appendChild(stack);
      }
      // Giu toi da 4 toast cung luc.
      while (stack.children.length >= 4 && stack.firstChild) stack.firstChild.remove();

      const el = document.createElement('div');
      el.className = `sm-toast is-${type}`;
      el.setAttribute('role', type === 'error' ? 'alert' : 'status');
      const icon = TOAST_ICONS[type] || TOAST_ICONS.info;
      el.innerHTML =
        `<span class="sm-toast-icon" aria-hidden="true">${icon}</span>` +
        `<div class="sm-toast-body"><p class="sm-toast-message">${SM.escapeHtml(message)}</p></div>` +
        `<button class="sm-toast-close" type="button" aria-label="Đóng thông báo">✕</button>`;
      const body = el.querySelector('.sm-toast-body');

      let dismissed = false;
      const dismiss = () => {
        if (dismissed) return;
        dismissed = true;
        try { el.remove(); } catch (err) { /* no-op */ }
      };
      el.querySelector('.sm-toast-close').addEventListener('click', dismiss);

      if (options.actionLabel && typeof options.onAction === 'function') {
        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'sm-toast-action';
        action.textContent = options.actionLabel;
        action.addEventListener('click', () => {
          try { options.onAction(); } catch (err) { /* no-op */ }
          dismiss();
        });
        body.appendChild(action);
      }

      const duration = Number.isFinite(options.duration) ? options.duration : 4000;
      let timer = null;
      if (duration > 0) {
        timer = window.setTimeout(dismiss, duration);
        // Tam dung auto-dismiss khi hover/focus de kip doc + bam action.
        el.addEventListener('mouseenter', () => window.clearTimeout(timer));
        el.addEventListener('mouseleave', () => { timer = window.setTimeout(dismiss, 2000); });
      }
      stack.appendChild(el);
      return { dismiss, element: el };
    } catch (err) { return null; }
  };

  /* ------------------------------------------------------------------
     2. Confirm modal dung chung.
     SM.confirm({ title, message, confirmLabel, cancelLabel, danger })
     Tra ve Promise<boolean>. Escape / backdrop / Huy => false.
  ------------------------------------------------------------------ */
  SM.confirm = function confirmDialog(options = {}) {
    return new Promise((resolve) => {
      try {
        const title = options.title || 'Xác nhận';
        const message = options.message || 'Bạn có chắc chắn muốn tiếp tục?';
        const confirmLabel = options.confirmLabel || 'Xác nhận';
        const cancelLabel = options.cancelLabel || 'Hủy';
        const danger = options.danger === true;

        const backdrop = document.createElement('div');
        backdrop.className = 'sm-modal-backdrop';
        backdrop.innerHTML =
          `<div class="sm-modal" role="alertdialog" aria-modal="true" aria-labelledby="sm-confirm-title">` +
          `<h2 id="sm-confirm-title">${SM.escapeHtml(title)}</h2>` +
          `<p>${SM.escapeHtml(message)}</p>` +
          `<div class="sm-modal-actions">` +
          `<button class="button button-outline" type="button" data-sm-cancel>${SM.escapeHtml(cancelLabel)}</button>` +
          `<button class="button ${danger ? 'button-danger' : ''}" type="button" data-sm-ok data-autofocus>${SM.escapeHtml(confirmLabel)}</button>` +
          `</div></div>`;
        document.body.appendChild(backdrop);
        document.body.style.overflow = 'hidden';

        let settled = false;
        const done = (value) => {
          if (settled) return;
          settled = true;
          document.removeEventListener('keydown', onKey, true);
          try {
            backdrop.classList.remove('is-open');
            document.body.style.overflow = '';
            window.setTimeout(() => backdrop.remove(), 250);
          } catch (err) { /* no-op */ }
          resolve(value);
        };
        const onKey = (event) => {
          if (event.key === 'Escape') { event.preventDefault(); done(false); }
          else if (event.key === 'Tab') trapFocus(backdrop, event);
        };
        document.addEventListener('keydown', onKey, true);
        backdrop.querySelector('[data-sm-cancel]').addEventListener('click', () => done(false));
        backdrop.querySelector('[data-sm-ok]').addEventListener('click', () => done(true));
        backdrop.addEventListener('mousedown', (event) => { if (event.target === backdrop) done(false); });

        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
          try {
            backdrop.classList.add('is-open');
            focusFirst(backdrop);
          } catch (err) { /* no-op */ }
        }));
      } catch (err) { resolve(false); }
    });
  };

  /* ------------------------------------------------------------------
     3. Order status badge — mapping CHUAN tu enum API.
     File auth/account/admin da chot (doc dung enum DB/API, cam doan ten):
       pending   -> "Cho xac nhan"  (warning)
       confirmed -> "Da xac nhan"   (info)
       roasting  -> "Dang rang"     (clay)
       shipping  -> "Dang giao"     (info)
       completed -> "Da giao"       (success)
       cancelled -> "Da huy"        (gray)
     Luon icon + chu, khong chi mau. Status la thi tra '' (khong render).
  ------------------------------------------------------------------ */
  SM.badgeMap = {
    pending: { label: 'Chờ xác nhận', tone: 'warning', icon: '◷' },
    confirmed: { label: 'Đã xác nhận', tone: 'info', icon: '✓' },
    roasting: { label: 'Đang rang', tone: 'clay', icon: '♨' },
    shipping: { label: 'Đang giao', tone: 'info', icon: '➤' },
    completed: { label: 'Đã giao', tone: 'success', icon: '✔' },
    cancelled: { label: 'Đã hủy', tone: 'gray', icon: '✕' }
  };

  // Tra ve HTML string; status la => '' (caller tu an).
  SM.orderBadgeHTML = function orderBadgeHTML(status) {
    const entry = SM.badgeMap[String(status || '').toLowerCase()];
    if (!entry) return '';
    return `<span class="sm-badge sm-badge-${entry.tone}"><i class="sm-badge-icon" aria-hidden="true">${entry.icon}</i>${SM.escapeHtml(entry.label)}</span>`;
  };

  // Tra ve element; status la => null.
  SM.orderBadge = function orderBadge(status) {
    const html = SM.orderBadgeHTML(status);
    if (!html) return null;
    const wrap = document.createElement('span');
    wrap.innerHTML = html;
    return wrap.firstChild;
  };

  /* ------------------------------------------------------------------
     4. Order timeline dung chung (lookup / account / admin chung 1).
     SM.renderTimeline(container, { status, times, descs })
       status: enum don hang (pending/confirmed/roasting/shipping/
               completed/cancelled)
       times:  { confirmed, roasting, shipping, completed } — timestamp
               hien thi (string tu API hoac format san), thieu thi an.
       descs:  ghi de mo ta tung buoc (VD "Me rang 14/10, 6:00").
     4 buoc: Da xac nhan -> Dang rang & dong goi -> Dang giao -> Da giao.
     - pending: ca 4 buoc o trang thai "toi" (don cho xac nhan).
     - cancelled: cac buoc giu todo + them dong "Don da huy".
  ------------------------------------------------------------------ */
  const TIMELINE_STEPS = [
    { key: 'confirmed', name: 'Đã xác nhận', icon: '✓', desc: 'Sương Mai đã nhận đơn của bạn.' },
    { key: 'roasting', name: 'Đang rang & đóng gói', icon: '♨', desc: 'Mẻ rang mới cho đơn của bạn.' },
    { key: 'shipping', name: 'Đang giao', icon: '➤', desc: 'Đơn đang trên đường tới bạn.' },
    { key: 'completed', name: 'Đã giao', icon: '✔', desc: 'Cảm ơn bạn đã chọn Sương Mai.' }
  ];
  const TIMELINE_ORDER = ['pending', 'confirmed', 'roasting', 'shipping', 'completed'];

  SM.renderTimeline = function renderTimeline(container, options = {}) {
    try {
      const root = typeof container === 'string' ? document.querySelector(container) : container;
      if (!root) return null;
      const status = String(options.status || '').toLowerCase();
      const times = options.times || {};
      const descs = options.descs || {};
      const cancelled = status === 'cancelled';
      const rank = TIMELINE_ORDER.indexOf(status);

      const list = document.createElement('ol');
      list.className = 'sm-timeline';
      list.setAttribute('aria-label', 'Hành trình đơn hàng');

      TIMELINE_STEPS.forEach((step, index) => {
        // rank: pending=0, confirmed=1... Buoc i ung voi rank i+1.
        const stepRank = index + 1;
        let state = 'is-todo';
        if (!cancelled && rank >= 0) {
          if (stepRank < rank) state = 'is-done';
          else if (stepRank === rank) state = 'is-current';
        }
        const li = document.createElement('li');
        li.className = `sm-timeline-step ${state}`;
        if (state === 'is-current') li.setAttribute('aria-current', 'step');
        const desc = descs[step.key] || step.desc;
        const time = times[step.key] ? `<p class="sm-timeline-time">${SM.escapeHtml(times[step.key])}</p>` : '';
        li.innerHTML =
          `<span class="sm-timeline-dot" aria-hidden="true">${state === 'is-done' ? '✓' : step.icon}</span>` +
          `<div><p class="sm-timeline-name">${SM.escapeHtml(step.name)}</p>` +
          `<p class="sm-timeline-desc">${SM.escapeHtml(desc)}</p>${time}</div>`;
        list.appendChild(li);
      });

      root.innerHTML = '';
      if (cancelled) {
        const note = document.createElement('p');
        note.className = 'sm-timeline-cancelled';
        note.innerHTML = `${SM.orderBadgeHTML('cancelled')} <span>Đơn đã hủy. Cần giúp? Liên hệ Sương Mai nhé.</span>`;
        note.style.cssText = 'display:flex;align-items:center;gap:10px;margin:0 0 18px;font-size:.9rem;color:var(--muted);';
        root.appendChild(note);
      }
      root.appendChild(list);
      return list;
    } catch (err) { return null; }
  };

  /* ------------------------------------------------------------------
     5. Drawer dung chung (mini-cart, chi tiet don admin...).
     Markup: <div class="sm-drawer" id="..." role="dialog" aria-modal="true">
     + <div class="sm-drawer-backdrop" data-drawer-backdrop="...">
     SM.openDrawer(id) / SM.closeDrawer(id). Dong: X / backdrop / Escape.
     Nut dong trong drawer: [data-sm-close].
  ------------------------------------------------------------------ */
  let lastDrawerFocus = null;

  SM.openDrawer = function openDrawer(id) {
    try {
      const drawer = document.getElementById(id);
      if (!drawer) return false;
      lastDrawerFocus = document.activeElement;
      const backdrop = document.querySelector(`[data-drawer-backdrop="${id}"]`);
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      if (backdrop) backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      focusFirst(drawer);
      return true;
    } catch (err) { return false; }
  };

  SM.closeDrawer = function closeDrawer(id) {
    try {
      const drawer = typeof id === 'string' ? document.getElementById(id) : id;
      if (!drawer) return false;
      const key = drawer.id || '';
      const backdrop = key ? document.querySelector(`[data-drawer-backdrop="${key}"]`) : null;
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      if (backdrop) backdrop.classList.remove('is-open');
      if (!document.querySelector('.sm-drawer.is-open')) document.body.style.overflow = '';
      if (lastDrawerFocus && typeof lastDrawerFocus.focus === 'function') {
        try { lastDrawerFocus.focus(); } catch (err) { /* no-op */ }
      }
      return true;
    } catch (err) { return false; }
  };

  function initDrawers() {
    try {
      document.querySelectorAll('.sm-drawer').forEach((drawer) => {
        if (!drawer.hasAttribute('aria-hidden') && !drawer.classList.contains('is-open')) {
          drawer.setAttribute('aria-hidden', 'true');
        }
      });
      document.addEventListener('click', (event) => {
        const closer = event.target.closest('[data-sm-close]');
        if (closer) {
          const drawer = closer.closest('.sm-drawer');
          if (drawer && drawer.id) SM.closeDrawer(drawer.id);
          return;
        }
        const backdrop = event.target.closest('[data-drawer-backdrop]');
        if (backdrop) SM.closeDrawer(backdrop.getAttribute('data-drawer-backdrop'));
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          const open = document.querySelector('.sm-drawer.is-open');
          if (open && open.id) SM.closeDrawer(open.id);
        } else if (event.key === 'Tab') {
          const open = document.querySelector('.sm-drawer.is-open');
          if (open) trapFocus(open, event);
        }
      }, true);
    } catch (err) { /* no-op */ }
  }

  /* ------------------------------------------------------------------
     6. Header behaviors: glass khi scroll + mobile overlay menu +
     cart badge. GIU NGUYEN moi data-* hook cho site-account.js.
     Menu: clone nut .menu-toggle de go moi toggle-listener cu cua page JS
     (VD: home.js) roi gan 1 handler chuan duy nhat — tranh double-toggle
     khi page cu va foundation cung ton tai.
  ------------------------------------------------------------------ */
  function initHeader() {
    try {
      const header = document.querySelector('.site-header');
      let menuButton = document.querySelector('.menu-toggle');
      const navigation = document.querySelector('.primary-nav, [data-account-nav]');

      if (header) {
        const onScroll = () => {
          try { header.classList.toggle('is-scrolled', (window.scrollY || 0) > 40); } catch (err) { /* no-op */ }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }

      if (menuButton && navigation) {
        // Strip handler toggle cu cua page JS (VD: home.js) de tranh double-toggle:
        // clone nut se xoa moi listener da gan, roi gan 1 handler chuan duy nhat.
        // (Cac path dong-only cu nhu bam link/Escape/resize van idempotent.)
        try {
          const fresh = menuButton.cloneNode(true);
          menuButton.replaceWith(fresh);
          menuButton = fresh;
        } catch (err) { /* giu nut cu neu clone loi */ }
        const setMenu = (open) => {
          try {
            menuButton.setAttribute('aria-expanded', String(open));
            menuButton.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
            navigation.classList.toggle('is-open', open);
            document.body.classList.toggle('menu-open', open);
            if (open) {
              document.body.style.overflow = 'hidden';
              const first = navigation.querySelector('a');
              if (first && typeof first.focus === 'function') first.focus();
            } else if (!document.querySelector('.sm-drawer.is-open')) {
              document.body.style.overflow = '';
            }
          } catch (err) { /* no-op */ }
        };
        SM.setMenu = setMenu;
        menuButton.addEventListener('click', () => {
          setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
        });
        navigation.addEventListener('click', (event) => {
          if (event.target.closest('a')) setMenu(false);
        });
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
            setMenu(false);
            try { menuButton.focus(); } catch (err) { /* no-op */ }
          }
        });
        window.addEventListener('resize', () => {
          if (window.innerWidth > 700 && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false);
        }, { passive: true });
      }
    } catch (err) { /* no-op */ }
  }

  /* ------------------------------------------------------------------
     7. Cart badge — cap nhat realtime so luong tren pill Gio hang.
     SM.updateCartBadge(count). An badge khi 0.
  ------------------------------------------------------------------ */
  SM.cartCount = 0;

  SM.updateCartBadge = function updateCartBadge(count) {
    try {
      const total = Math.max(0, Math.floor(Number(count) || 0));
      SM.cartCount = total;
      document.querySelectorAll('.nav-cart').forEach((pill) => {
        let badge = pill.querySelector('.nav-cart-count');
        if (!badge && total > 0) {
          badge = document.createElement('span');
          badge.className = 'nav-cart-count';
          badge.setAttribute('aria-hidden', 'true');
          pill.appendChild(badge);
        }
        if (badge) {
          badge.textContent = total > 99 ? '99+' : String(total);
          badge.hidden = total <= 0;
        }
        const base = 'Giỏ hàng';
        pill.setAttribute('aria-label', total > 0 ? `${base}, ${total} sản phẩm` : base);
      });
      return total;
    } catch (err) { return 0; }
  };

  /* ------------------------------------------------------------------
     8. Khoi dong.
  ------------------------------------------------------------------ */
  function boot() {
    initHeader();
    initDrawers();
    SM.updateCartBadge(0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
