(() => {
  const status = document.querySelector('#account-status');
  const authPanel = document.querySelector('#auth-panel');
  const profilePanel = document.querySelector('#profile-panel');
  const loginForm = document.querySelector('#login-form');
  const registerForm = document.querySelector('#register-form');
  const profileForm = document.querySelector('#profile-form');
  const passwordForm = document.querySelector('#password-form');
  const submitButtons = [...document.querySelectorAll('form button[type="submit"]')];

  function showMessage(message, kind = '') {
    status.textContent = message;
    status.className = `status${kind ? ` ${kind}` : ''}`;
    status.hidden = !message;
  }

  function clearErrors(form) {
    form.querySelectorAll('[aria-invalid="true"]').forEach(field => field.removeAttribute('aria-invalid'));
  }

  function showError(error, form) {
    clearErrors(form);
    const messages = Object.entries(error.fields || {}).flatMap(([name, values]) => {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLElement) field.setAttribute('aria-invalid', 'true');
      return values;
    });
    showMessage(messages.length ? messages.join(' ') : error.message, 'error');
  }

  async function withLoading(form, operation, successMessage) {
    clearErrors(form);
    submitButtons.forEach(button => { button.disabled = true; });
    showMessage('Đang xử lý…');
    try {
      const result = await operation();
      if (successMessage) {
        showMessage(successMessage, 'success');
        status.focus();
      }

      return result;
    } catch (error) {
      if (error.status === 401) showMessage(error.message, 'error');
      else if (error.status === 403) showMessage(error.message || 'Bạn không có quyền thực hiện thao tác này.', 'error');
      else if (error.status >= 500) showMessage('Máy chủ đang bận. Vui lòng thử lại sau.', 'error');
      else showError(error, form);
      return null;
    } finally {
      submitButtons.forEach(button => { button.disabled = false; });
    }
  }

  function values(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function mergeFailureMessage(error) {
    const conflicts = error.details?.conflicts || [];
    if (error.code === 'CART_MERGE_CONFLICT' && conflicts.length) {
      const limits = conflicts.map(conflict => conflict.max_acceptable_quantity).join(', ');
      return `Đăng nhập thành công. Một số sản phẩm cần điều chỉnh trước khi gộp; số lượng tối đa hiện có: ${limits}.`;
    }
    return 'Đăng nhập thành công nhưng chưa thể gộp giỏ hàng tạm thời.';
  }

  function setAuthenticated(user) {
    authPanel.hidden = Boolean(user);
    profilePanel.hidden = !user;
    if (!user) return;
    profileForm.elements.namedItem('full_name').value = user.full_name;
    profileForm.elements.namedItem('email').value = user.email;
    profileForm.elements.namedItem('phone').value = user.phone;
    document.querySelector('#profile-role').textContent = `Vai trò: ${user.role}`;
  }

  function setMode(mode) {
    const registering = mode === 'register';
    loginForm.hidden = registering;
    registerForm.hidden = !registering;
    document.querySelector('#show-login').classList.toggle('is-active', !registering);
    document.querySelector('#show-register').classList.toggle('is-active', registering);
    document.querySelector('#show-login').setAttribute('aria-pressed', String(!registering));
    document.querySelector('#show-register').setAttribute('aria-pressed', String(registering));
    document.querySelector('#account-title').textContent = registering ? 'Tạo tài khoản Sương Mai' : 'Chào mừng bạn trở lại';
    showMessage('');
  }

  document.querySelector('#show-login').addEventListener('click', () => setMode('login'));
  document.querySelector('#show-register').addEventListener('click', () => setMode('register'));

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const data = await withLoading(loginForm, () => window.AccountApi.login(values(loginForm)));
    if (data?.user) {
      setAuthenticated(data.user);
      loginForm.reset();
      try {
        await window.AccountApi.mergeCart();
      } catch (mergeError) {
        sessionStorage.setItem('accountNotice', mergeFailureMessage(mergeError));
      }
      window.location.assign('/catalog/');
    }
  });

  registerForm.addEventListener('submit', async event => {
    event.preventDefault();
    const data = await withLoading(registerForm, () => window.AccountApi.register(values(registerForm)));
    if (data?.user) {
      setAuthenticated(data.user);
      registerForm.reset();
      try {
        await window.AccountApi.mergeCart();
      } catch (mergeError) {
        sessionStorage.setItem('accountNotice', mergeError.code === 'CART_MERGE_CONFLICT' ? 'Tài khoản đã được tạo. Một số sản phẩm trong giỏ hàng khách cần được điều chỉnh trước khi gộp.' : 'Tài khoản đã được tạo nhưng chưa thể gộp giỏ hàng tạm thời.');
      }
      window.location.assign('/catalog/');
    }
  });

  profileForm.addEventListener('submit', async event => {
    event.preventDefault();
    const data = await withLoading(profileForm, () => window.AccountApi.updateProfile({
      full_name: profileForm.elements.namedItem('full_name').value,
      phone: profileForm.elements.namedItem('phone').value,
    }), 'Thông tin đã được cập nhật.');
    if (data) setAuthenticated(data);
  });

  passwordForm.addEventListener('submit', async event => {
    event.preventDefault();
    const data = await withLoading(passwordForm, () => window.AccountApi.changePassword(values(passwordForm)), 'Mật khẩu đã được cập nhật.');
    if (data) passwordForm.reset();
  });

  document.querySelector('#logout-button').addEventListener('click', async () => {
    try {
      await window.AccountApi.logout();
      setAuthenticated(null);
      showMessage('Bạn đã đăng xuất.', 'success');
    } catch (error) {
      showMessage(error.message || 'Không thể đăng xuất lúc này.', 'error');
    }
  });

  (async () => {
    try {
      const state = await window.AccountApi.session();
      setAuthenticated(state.authenticated ? state.user : null);
    } catch (error) {
      showMessage(error.status >= 500 ? 'Không thể kết nối máy chủ. Vui lòng thử lại sau.' : error.message, 'error');
    }
    const mode = new URLSearchParams(window.location.search).get('mode');
    if (mode === 'register') setMode('register');
  })();
})();
