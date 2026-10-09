(() => {
  const nav = document.querySelector('[data-account-nav]');
  if (!nav) return;

  const accountLink = nav.querySelector('[data-account-link]');
  const adminLink = nav.querySelector('[data-admin-link]');
  const logoutButton = nav.querySelector('[data-logout]');
  let csrfToken = '';

  async function request(path, options = {}) {
    const headers = { Accept: 'application/json' };
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['X-CSRF-Token'] = csrfToken;
    }
    const response = await fetch(`/api/v1${path}`, { ...options, headers, credentials: 'same-origin' });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error?.message || 'Không thể hoàn tất yêu cầu.');
    return payload?.data;
  }

  request('/session').then(session => {
    csrfToken = session.csrf_token || '';
    if (session.authenticated && session.user) {
      accountLink.textContent = `Xin chào, ${session.user.full_name}`;
      accountLink.href = '/account/';
      accountLink.setAttribute('aria-label', 'Mở tài khoản của bạn');
      if (session.user.role === 'admin' && adminLink) adminLink.hidden = false;
      if (logoutButton) logoutButton.hidden = false;
    }
  }).catch(() => {});

  logoutButton?.addEventListener('click', async () => {
    logoutButton.disabled = true;
    try {
      await request('/auth/logout', { method: 'POST', body: '{}' });
      window.location.assign('/');
    } catch {
      logoutButton.disabled = false;
    }
  });
})();
