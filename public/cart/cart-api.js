(() => {
  const API_PREFIX = '/api/v1';
  let csrfToken = '';

  async function request(path, { method = 'GET', body, headers = {} } = {}) {
    const requestHeaders = { Accept: 'application/json', ...headers };
    const options = { method, headers: requestHeaders, credentials: 'same-origin' };
    if (body !== undefined) {
      if (!csrfToken) await ensureSession();
      requestHeaders['Content-Type'] = 'application/json';
      requestHeaders['X-CSRF-Token'] = csrfToken;
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_PREFIX}${path}`, options);
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(result?.error?.message || 'Không thể hoàn tất yêu cầu.');
      error.code = result?.error?.code || 'NETWORK_ERROR';
      error.status = response.status;
      error.fields = result?.error?.fields || {};
      error.details = result?.error?.details || {};
      throw error;
    }
    if (typeof result?.data?.csrf_token === 'string') csrfToken = result.data.csrf_token;
    return result?.data;
  }

  async function ensureSession() {
    const session = await request('/session');
    csrfToken = session.csrf_token || '';
    return session;
  }

  window.CartApi = Object.freeze({
    session: ensureSession,
    getCart: () => request('/cart'),
    grindOptions: () => request('/grind-options'),
    addLine: payload => request('/cart/items', { method: 'POST', body: payload }),
    updateLine: (lineId, quantity) => request(`/cart/items/${encodeURIComponent(lineId)}`, { method: 'PATCH', body: { quantity: Number(quantity) } }),
    removeLine: lineId => request(`/cart/items/${encodeURIComponent(lineId)}`, { method: 'DELETE', body: {} }),
    applyCoupon: code => request('/cart/coupon', { method: 'POST', body: { code } }),
    clearCoupon: () => request('/cart/coupon', { method: 'DELETE', body: {} }),
    merge: () => request('/cart/merge', { method: 'POST', body: {} }),
    checkout: (payload, idempotencyKey) => request('/checkout/orders', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: payload }),
    lookupOrder: payload => request('/orders/lookup', { method: 'POST', body: payload }),
    accountOrders: () => request('/account/orders'),
    accountOrder: code => request(`/account/orders/${encodeURIComponent(code)}`),
    adminOrders: status => request(`/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    adminOrder: code => request(`/admin/orders/${encodeURIComponent(code)}`),
    adminUpdateStatus: (code, payload) => request(`/admin/orders/${encodeURIComponent(code)}`, { method: 'PATCH', body: payload }),
    adminInventory: () => request('/admin/inventory'),
    adminAdjustInventory: payload => request('/admin/inventory/adjust', { method: 'POST', body: payload }),
  });
})();
