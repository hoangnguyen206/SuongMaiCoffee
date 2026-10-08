(() => {
  const mock = window.CheckoutMock;
  const form = document.querySelector('#checkout-form');
  const panels = [...document.querySelectorAll('[data-step-panel]')];
  const indicators = [...document.querySelectorAll('[data-step-indicator]')];
  const nextButton = document.querySelector('#next-button');
  const backButton = document.querySelector('#back-button');
  const title = document.querySelector('#step-title');
  const kicker = document.querySelector('#step-kicker');
  const feedback = document.querySelector('#form-feedback');
  const mockFields = [...document.querySelectorAll('[data-mock-field]')];
  let currentStep = 1;

  if (!mock || !form) return;

  function showStep(step, moveFocus = true) {
    currentStep = step;
    panels.forEach(panel => {
      const active = Number(panel.dataset.stepPanel) === step;
      panel.classList.toggle('is-active', active);
      panel.disabled = !active;
    });
    indicators.forEach(indicator => {
      const number = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle('is-current', number === step);
      indicator.classList.toggle('is-complete', number < step);
      if (number === step) indicator.setAttribute('aria-current', 'step');
      else indicator.removeAttribute('aria-current');
    });
    const stepContent = mock.getStep(step);
    title.textContent = stepContent.title;
    kicker.textContent = stepContent.kicker;
    backButton.hidden = step === 1;
    nextButton.textContent = step === 3 ? 'Hoàn tất xem thử' : 'Tiếp tục';
    nextButton.dataset.final = String(step === 3);
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = step === 3 ? ' ✓' : ' →';
    nextButton.append(arrow);
    feedback.textContent = '';
    if (moveFocus) title.focus({ preventScroll: true });
  }

  function validateDelivery() {
    const required = [
      ['recipient-name', 'Vui lòng nhập tên mẫu để xem bước tiếp theo.'],
      ['recipient-phone', 'Vui lòng nhập số điện thoại giả lập.'],
      ['address-line', 'Vui lòng nhập địa chỉ giả lập.'],
      ['province', 'Vui lòng chọn tỉnh / thành phố mẫu.'],
      ['district', 'Vui lòng chọn quận / huyện mẫu.']
    ];
    let firstInvalid = null;
    required.forEach(([id, message]) => {
      const field = document.getElementById(id);
      const error = document.querySelector(`[data-error-for="${id}"]`);
      const invalid = !field.value.trim();
      field.setAttribute('aria-invalid', String(invalid));
      error.textContent = invalid ? message : '';
      if (invalid && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      feedback.textContent = 'Hoàn thành các trường bắt buộc bằng dữ liệu giả lập để tiếp tục.';
      return false;
    }
    return true;
  }

  function updateReview() {
    const value = id => document.getElementById(id).value.trim();
    const selectLabel = id => {
      const option = document.getElementById(id).selectedOptions[0];
      return option && option.value ? option.textContent.replace(/^\[MOCK\]\s*/, '') : '';
    };
    document.getElementById('review-recipient').textContent = value('recipient-name') || 'Chưa nhập dữ liệu mock';
    document.getElementById('review-address').textContent = [value('address-line'), selectLabel('district'), selectLabel('province')].filter(Boolean).join(', ') || 'Chưa nhập dữ liệu mock';
    const shipping = form.querySelector('[name="shipping_method"]:checked')?.value;
    const payment = form.querySelector('[name="payment_method"]:checked')?.value;
    document.getElementById('review-shipping').textContent = shipping === 'pickup' ? 'Nhận tại điểm mẫu · MOCK' : 'Giao hàng tiêu chuẩn · MOCK';
    document.getElementById('review-payment').textContent = payment === 'bank' ? 'Chuyển khoản · MOCK' : 'Thanh toán khi nhận hàng · MOCK';
  }

  form.addEventListener('input', event => {
    if (event.target.matches('[aria-invalid="true"]')) event.target.setAttribute('aria-invalid', 'false');
    const error = document.querySelector(`[data-error-for="${event.target.id}"]`);
    if (error) error.textContent = '';
  });

  form.addEventListener('change', event => {
    if (event.target.matches('input[type="radio"]')) {
      form.querySelectorAll(`input[name="${event.target.name}"]`).forEach(input => input.closest('.choice-card').classList.toggle('is-selected', input.checked));
    }
  });

  backButton.addEventListener('click', () => {
    if (currentStep > 1) showStep(currentStep - 1);
  });

  nextButton.addEventListener('click', () => {
    if (currentStep === 1 && !validateDelivery()) return;
    if (currentStep === 2) updateReview();
    if (currentStep < 3) {
      showStep(currentStep + 1);
      return;
    }
    feedback.textContent = 'Đã hoàn tất xem thử. Không có đơn hàng nào được tạo.';
    feedback.scrollIntoView({ block: 'nearest' });
  });

  mockFields.forEach(field => {
    field.addEventListener('change', () => {
      if (field.hasAttribute('aria-invalid') && field.value.trim()) field.setAttribute('aria-invalid', 'false');
    });
  });

  showStep(1, false);
  panels.forEach(panel => { panel.disabled = Number(panel.dataset.stepPanel) !== 1; });
  form.dataset.mode = mock.isMock() ? 'mock' : 'unavailable';
  document.querySelector('.mock-banner p').setAttribute('aria-label', mock.getNotice());
})();
