(() => {
  const API_PREFIX = '/api/v1';
  let csrfToken = '';

  async function request(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' };
    const options = { method, headers, credentials: 'same-origin' };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['X-CSRF-Token'] = csrfToken;
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_PREFIX}${path}`, options);
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(result?.error?.message || 'Không thể hoàn tất yêu cầu.');
      error.code = result?.error?.code || 'NETWORK_ERROR';
      error.status = response.status;
      error.fields = result?.error?.fields || {};
      throw error;
    }
    if (typeof result?.data?.csrf_token === 'string') csrfToken = result.data.csrf_token;
    return result?.data;
  }

  window.AccountApi = Object.freeze({
    session: async () => {
      const result = await request('/session');
      csrfToken = result.csrf_token;
      return result;
    },
    register: payload => request('/auth/register', { method: 'POST', body: payload }),
    login: payload => request('/auth/login', { method: 'POST', body: payload }),
    logout: () => request('/auth/logout', { method: 'POST', body: {} }),
    profile: () => request('/account/me'),
    updateProfile: payload => request('/account/me', { method: 'PATCH', body: payload }),
    changePassword: payload => request('/account/me/password', { method: 'PUT', body: payload }),
  });
})();
