(() => {
  const prefix = '/api/v1/admin';
  let csrf = '';
  async function request(path, { method = 'GET', body } = {}) {
    if (body !== undefined && !csrf) await window.AccountApi.session();
    if (!csrf) csrf = (await window.AccountApi.session()).csrf_token;
    const headers = { Accept: 'application/json', 'X-CSRF-Token': csrf };
    const options = { method, headers, credentials: 'same-origin' };
    if (body !== undefined) { headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(body); }
    const response = await fetch(`${prefix}${path}`, options);
    const payload = await response.json().catch(() => null);
    if (typeof payload?.data?.csrf_token === 'string') csrf = payload.data.csrf_token;
    if (!response.ok) {
      const error = new Error(payload?.error?.message || 'Không thể hoàn tất thao tác.');
      error.status = response.status;
      error.fields = payload?.error?.fields || {};
      throw error;
    }
    return payload?.data;
  }
  window.AdminApi = Object.freeze({
    dashboard: () => request('/dashboard'), products: q => request(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    productOptions: () => request('/product-options'), saveProduct: (data, id) => request(`/products${id || ''}`, { method: id ? 'PATCH' : 'POST', body: data }),
    productActive: (id, active) => request(`/products/${id}/active`, { method: 'POST', body: { is_active: active } }),
    coupons: () => request('/coupons'), saveCoupon: (data, id) => request(`/coupons${id || ''}`, { method: id ? 'PATCH' : 'POST', body: data }),
    couponActive: (id, active) => request(`/coupons/${id}/active`, { method: 'POST', body: { is_active: active } }),
    content: () => request('/content'), saveContent: data => request('/content', { method: 'PUT', body: data }),
  });
})();
