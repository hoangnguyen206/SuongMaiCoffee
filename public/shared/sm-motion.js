/* ==========================================================================
   Suong Mai Coffee Roasters — sm-motion.js (FOUNDATION)
   Motion dung chung: nap CDN pinned (GSAP + ScrollTrigger + Lenis) voi
   guard day du. Thieu CDN / tat JS / reduced-motion => trang van hien thi
   va mua hang day du, chi mat animation muot.

   - Chi mot rAF loop cho progress bar; Lenis noi vao GSAP ticker.
   - prefers-reduced-motion => tat het motion, hien noi dung luon.
   - Expose window.SM helpers: motionReady, motionAllowed, ensureMotion,
     reveal, scrollToTop, updateProgress, lenis/gsap/ScrollTrigger refs.

   Trang admin CHI load sm-ui.js, KHONG load file nay (dashboard can nhe).
   ========================================================================== */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  window.SM = window.SM || {};
  const SM = window.SM;

  /* ------------------------------------------------------------------
     0. Cau hinh CDN pinned (da verify HTTP 200).
     LUU Y: Lenis package "lenis" (KHONG dung @studio-freight cu).
  ------------------------------------------------------------------ */
  const CDN = {
    gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
    scrollTrigger: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
    lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js'
  };

  const reducedQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const isReduced = () => !!(reducedQuery && reducedQuery.matches);

  SM.motionReady = false; // true khi GSAP + ScrollTrigger + Lenis san sang
  SM.motionAllowed = () => !isReduced();
  SM.gsap = null;
  SM.ScrollTrigger = null;
  SM.lenis = null;

  function loadScript(src) {
    return new Promise((resolve) => {
      try {
        // Dung lai neu page da nap san (tranh nap doi).
        const exists = document.querySelector(`script[src="${src}"]`);
        if (exists) {
          if (exists.dataset.smLoaded === '1') { resolve(true); return; }
          exists.addEventListener('load', () => resolve(true), { once: true });
          exists.addEventListener('error', () => resolve(false), { once: true });
          return;
        }
        const tag = document.createElement('script');
        tag.src = src;
        tag.defer = true;
        tag.crossOrigin = 'anonymous';
        tag.addEventListener('load', () => { tag.dataset.smLoaded = '1'; resolve(true); }, { once: true });
        tag.addEventListener('error', () => resolve(false), { once: true }); // silent no-op
        document.head.appendChild(tag);
      } catch (err) { resolve(false); }
    });
  }

  /* ------------------------------------------------------------------
     1. Preloader — an khi window load hoac toi da 2.5s.
  ------------------------------------------------------------------ */
  function initPreloader() {
    try {
      const preloader = document.querySelector('.sm-preloader');
      if (!preloader) return;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        preloader.classList.add('is-done');
        window.setTimeout(() => preloader.remove(), 700);
      };
      if (isReduced()) { finish(); return; }
      if (document.readyState === 'complete') window.setTimeout(finish, 350);
      else window.addEventListener('load', () => window.setTimeout(finish, 350), { once: true });
      window.setTimeout(finish, 2500); // toi da 2.5s
    } catch (err) { /* no-op */ }
  }

  /* ------------------------------------------------------------------
     2. Single rAF loop: scroll progress bar + back-to-top visibility.
  ------------------------------------------------------------------ */
  const toTopThreshold = 600;
  let progressFill = null;
  let toTopButton = null;
  let ticking = false;

  function onScrollFrame() {
    ticking = false;
    try {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const ratio = Math.min(1, Math.max(0, (window.scrollY || 0) / max));
      if (progressFill) progressFill.style.transform = `scaleX(${ratio.toFixed(4)})`;
      if (toTopButton) toTopButton.classList.toggle('is-visible', (window.scrollY || 0) > toTopThreshold);
    } catch (err) { /* no-op */ }
  }

  function requestScrollFrame() {
    if (ticking) return;
    ticking = true;
    if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(onScrollFrame);
    else onScrollFrame();
  }

  function initProgressAndToTop() {
    try {
      // Progress bar 3px mau clay.
      let progress = document.querySelector('.sm-progress');
      if (!progress) {
        progress = document.createElement('div');
        progress.className = 'sm-progress';
        progress.setAttribute('aria-hidden', 'true');
        progress.innerHTML = '<i></i>';
        document.body.prepend(progress);
      }
      progressFill = progress.querySelector('i');

      // Back-to-top pill.
      toTopButton = document.querySelector('.sm-to-top');
      if (!toTopButton) {
        toTopButton = document.createElement('button');
        toTopButton.type = 'button';
        toTopButton.className = 'sm-to-top';
        toTopButton.setAttribute('aria-label', 'Về đầu trang');
        toTopButton.innerHTML = '<span aria-hidden="true">↑</span> Về đầu trang';
        toTopButton.addEventListener('click', () => SM.scrollToTop());
        document.body.appendChild(toTopButton);
      }
      window.addEventListener('scroll', requestScrollFrame, { passive: true });
      window.addEventListener('resize', requestScrollFrame);
      requestScrollFrame();
    } catch (err) { /* no-op */ }
  }

  SM.scrollToTop = function scrollToTop() {
    try {
      if (SM.lenis && typeof SM.lenis.scrollTo === 'function') { SM.lenis.scrollTo(0); return; }
      window.scrollTo({ top: 0, behavior: isReduced() ? 'auto' : 'smooth' });
    } catch (err) {
      try { window.scrollTo(0, 0); } catch (ignored) { /* no-op */ }
    }
  };

  /* ------------------------------------------------------------------
     3. Reveal helper — chi an noi dung khi chac chan animate duoc.
     Them .sm-anim vao <html> roi quan sat .reveal them .is-visible.
  ------------------------------------------------------------------ */
  let revealObserver = null;

  function initReveal() {
    try {
      if (isReduced()) return; // reduced-motion: giu noi dung hien luon
      if (!('IntersectionObserver' in window)) return;
      document.documentElement.classList.add('sm-anim');
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => revealObserver.observe(el));
    } catch (err) {
      try { document.documentElement.classList.remove('sm-anim'); } catch (ignored) { /* no-op */ }
    }
  }

  // Page builders goi SM.reveal(el) cho noi dung render dong (VD: product grid).
  SM.reveal = function revealElement(el) {
    try {
      if (!el) return;
      if (!document.documentElement.classList.contains('sm-anim') || !revealObserver) {
        el.classList.add('is-visible');
        return;
      }
      revealObserver.observe(el);
    } catch (err) {
      try { el.classList.add('is-visible'); } catch (ignored) { /* no-op */ }
    }
  };

  /* ------------------------------------------------------------------
     4. Nap CDN + noi Lenis vao GSAP ticker (mot rAF loop duy nhat).
  ------------------------------------------------------------------ */
  let motionPromise = null;

  SM.ensureMotion = function ensureMotion() {
    if (motionPromise) return motionPromise;
    motionPromise = (async () => {
      try {
        if (isReduced()) return false;
        if (typeof window.gsap === 'undefined') {
          const ok = await loadScript(CDN.gsap);
          if (!ok || typeof window.gsap === 'undefined') return false;
        }
        if (typeof window.ScrollTrigger === 'undefined') {
          const ok = await loadScript(CDN.scrollTrigger);
          if (!ok || typeof window.ScrollTrigger === 'undefined') return false;
        }
        window.gsap.registerPlugin(window.ScrollTrigger);
        SM.gsap = window.gsap;
        SM.ScrollTrigger = window.ScrollTrigger;

        // Lenis la optional: co thi muot hon, khong co van dung GSAP.
        if (typeof window.Lenis === 'undefined') await loadScript(CDN.lenis);
        if (typeof window.Lenis !== 'undefined') {
          const lenis = new window.Lenis({ autoRaf: false, lerp: 0.1 });
          lenis.on('scroll', () => { if (SM.ScrollTrigger) SM.ScrollTrigger.update(); });
          SM.gsap.ticker.add((time) => lenis.raf(time * 1000));
          SM.gsap.ticker.lagSmoothing(0);
          SM.lenis = lenis;
        }
        SM.motionReady = true;
        try { document.dispatchEvent(new CustomEvent('sm:motion-ready', { detail: { lenis: !!SM.lenis } })); } catch (err) { /* no-op */ }
        return true;
      } catch (err) { return false; } // silent no-op
    })();
    return motionPromise;
  };

  // Theo doi reduced-motion doi giua chung: tat Lenis, hien noi dung.
  try {
    if (reducedQuery && typeof reducedQuery.addEventListener === 'function') {
      reducedQuery.addEventListener('change', () => {
        if (isReduced()) {
          try {
            if (SM.lenis && typeof SM.lenis.destroy === 'function') SM.lenis.destroy();
            SM.lenis = null;
            SM.motionReady = false;
            document.documentElement.classList.remove('sm-anim');
            document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
          } catch (err) { /* no-op */ }
        }
      });
    }
  } catch (err) { /* no-op */ }

  /* ------------------------------------------------------------------
     5. Khoi dong (khong doi CDN — UI co ban chay ngay lap tuc).
  ------------------------------------------------------------------ */
  function boot() {
    initPreloader();
    initProgressAndToTop();
    initReveal();
    // Nap CDN sau khi idle de khong chan LCP.
    try {
      if ('requestIdleCallback' in window) window.requestIdleCallback(() => SM.ensureMotion(), { timeout: 2500 });
      else window.setTimeout(() => SM.ensureMotion(), 1200);
    } catch (err) { /* no-op */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
