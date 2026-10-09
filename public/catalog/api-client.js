(() => {
  const API_PREFIX = '/api/v1';

  async function request(path, options = {}) {
    const response = await fetch(`${API_PREFIX}${path}`, {
      headers: { Accept: 'application/json' },
      ...options,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(body?.error?.message || 'Không thể tải dữ liệu catalog.');
      error.code = body?.error?.code || 'NETWORK_ERROR';
      throw error;
    }
    return body?.data ?? [];
  }

  window.CatalogApi = Object.freeze({
    categories: () => request('/categories'),
    origins: () => request('/origins'),
    flavors: () => request('/flavors'),
    products: params => {
      const query = new URLSearchParams(params);
      return request(`/products?${query.toString()}`);
    },
    product: (slug, params = {}) => {
      const query = new URLSearchParams(params);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return request(`/products/${encodeURIComponent(slug)}${suffix}`);
    },
    suggestions: query => request(`/search/suggestions?q=${encodeURIComponent(query)}`),
  });
})();
