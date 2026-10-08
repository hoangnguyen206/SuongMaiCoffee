(() => {
  const MOCK_NOTICE = 'MOCK UI · Không gọi API, không lưu hoặc log PII.';
  const mockCheckout = Object.freeze({
    steps: Object.freeze([
      Object.freeze({ id: 1, kicker: 'BƯỚC 1 / 3', title: 'Thông tin giao hàng' }),
      Object.freeze({ id: 2, kicker: 'BƯỚC 2 / 3', title: 'Vận chuyển & thanh toán' }),
      Object.freeze({ id: 3, kicker: 'BƯỚC CUỐI / MOCK', title: 'Xác nhận' })
    ]),
    fixtureCart: Object.freeze([
      Object.freeze({ name: 'Hạt cà phê mẫu', detail: '250g · Nguyên hạt · x1' }),
      Object.freeze({ name: 'Phin lọc mẫu', detail: 'Phiên bản demo · x1' })
    ]),
    notice: MOCK_NOTICE
  });

  window.CheckoutMock = Object.freeze({
    getStep(step) {
      return mockCheckout.steps.find(item => item.id === step) || mockCheckout.steps[0];
    },
    getNotice() {
      return mockCheckout.notice;
    },
    isMock() {
      return true;
    }
  });
})();
