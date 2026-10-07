(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#primary-navigation');
  const stateButtons = [...document.querySelectorAll('.state-option')];
  const content = document.querySelector('#preview-content');
  const title = document.querySelector('#state-title');
  const description = document.querySelector('#state-description');
  const caption = document.querySelector('#state-caption');
  const icon = document.querySelector('.state-icon span');
  const placeholder = document.querySelector('#state-placeholder');

  if (!window.LocalPreviewAdapter) return;

  function setMenuOpen(isOpen) {
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.querySelector('.menu-toggle-label').textContent = isOpen ? 'Đóng menu' : 'Mở menu';
    navigation.classList.toggle('is-open', isOpen);
  }

  menuButton.addEventListener('click', () => {
    setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      menuButton.focus();
    }
  });

  stateButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const stateName = button.dataset.state;
      const state = window.LocalPreviewAdapter.getState(stateName);
      stateButtons.forEach(candidate => candidate.setAttribute('aria-pressed', String(candidate === button)));
      content.dataset.state = stateName;
      title.textContent = state.title;
      description.textContent = state.description;
      caption.textContent = state.caption;
      icon.textContent = state.icon;
      placeholder.textContent = window.LocalPreviewAdapter.getPlaceholderLabel();
      placeholder.hidden = !state.placeholder;
    });

    button.addEventListener('keydown', event => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      stateButtons[(index + direction + stateButtons.length) % stateButtons.length].focus();
    });
  });
})();
