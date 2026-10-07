(() => {
  const placeholderLabel = 'PLACEHOLDER — CHƯA PHẢI ASSET CHÍNH THỨC.';

  const previewStates = Object.freeze({
    loading: {
      title: 'Đang chuẩn bị nội dung',
      description: 'Đây là trạng thái minh họa cho lúc giao diện chờ dữ liệu. Adapter chỉ đọc dữ liệu cục bộ.',
      caption: 'Trạng thái: Đang tải',
      icon: '…',
      placeholder: false
    },
    success: {
      title: 'Sẵn sàng khám phá',
      description: 'Nội dung mẫu đã được hiển thị. Kết nối dữ liệu thật sẽ được bổ sung sau khi contract liên quan được duyệt.',
      caption: 'Trạng thái: Thành công',
      icon: '✓',
      placeholder: false
    },
    empty: {
      title: 'Chưa có nội dung',
      description: 'Khi nguồn dữ liệu không có mục phù hợp, giao diện có thể hiển thị lời nhắn rõ ràng thay vì để trống.',
      caption: 'Trạng thái: Trống',
      icon: '–',
      placeholder: false
    },
    error: {
      title: 'Chưa thể hiển thị',
      description: 'Trạng thái lỗi mẫu cho prototype. Đây không đại diện cho mã lỗi hoặc hành vi retry của API.',
      caption: 'Trạng thái: Lỗi',
      icon: '!',
      placeholder: false
    },
    placeholder: {
      title: 'Nội dung đang chờ duyệt',
      description: 'Vùng minh họa đang dùng nội dung tạm thời; chưa có asset hay nội dung thương hiệu chính thức.',
      caption: 'Trạng thái: Placeholder',
      icon: '…',
      placeholder: true
    }
  });

  window.LocalPreviewAdapter = Object.freeze({
    getState(name) {
      return previewStates[name] || previewStates.success;
    },
    getPlaceholderLabel() {
      return placeholderLabel;
    }
  });
})();
