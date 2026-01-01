import { byId } from './helpers.js';

export function initNav() {
  const buttons = document.querySelectorAll('.navBtn');
  const screens = document.querySelectorAll('.screen');

  function go(name) {
    screens.forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    buttons.forEach(b => b.classList.toggle('active', b.dataset.go === name));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  buttons.forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

  // settings drawer
  const drawer = byId('settingsDrawer');
  const openBtn = byId('btnSettings');
  const closeBtn = byId('closeSettings');

  const open = () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); };
  const close = () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  // close on outside click
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) close();
  });

  // expose
  return { go, openSettings: open, closeSettings: close };
}
