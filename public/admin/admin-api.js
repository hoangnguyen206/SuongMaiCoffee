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
    dashboard: () => request('/dashboard'),
    products: q => request(`/products${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    productOptions: () => request('/product-options'),
    // FIX: URL update thiếu dấu "/" ("/products5" -> "/products/5").
    saveProduct: (data, id) => request(id ? `/products/${id}` : '/products', { method: id ? 'PATCH' : 'POST', body: data }),
    productActive: (id, active) => request(`/products/${id}/active`, { method: 'POST', body: { is_active: active } }),
    coupons: () => request('/coupons'),
    // FIX: URL update thiếu dấu "/" ("/coupons3" -> "/coupons/3").
    saveCoupon: (data, id) => request(id ? `/coupons/${id}` : '/coupons', { method: id ? 'PATCH' : 'POST', body: data }),
    couponActive: (id, active) => request(`/coupons/${id}/active`, { method: 'POST', body: { is_active: active } }),
    content: () => request('/content'),
    saveContent: data => request('/content', { method: 'PUT', body: data }),
  });
  // TODO(backend): tab Khách hàng cần API GET /api/v1/admin/users (listing + filter) — chưa build.
  // TODO(backend): bulk cập nhật đơn / Export CSV / tạo đơn tay — API chỉ hỗ trợ từng đơn, chưa build.
  // TODO(backend): nhập kho hàng loạt / paste Excel — API adjust chỉ nhận từng lô, chưa build.
  // TODO(backend): search toàn cục ⌘K + chuông báo + phím tắt — chưa có API, chưa build.
})();
