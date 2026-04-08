import { state, STORAGE_KEYS } from './state.js';

/* ═══════════════════════════════════════════════════════
   TAB SWITCHING
   ═══════════════════════════════════════════════════════ */
export function switchTab(tabName) {
  if (!tabName) return;
  state.activeTab = tabName;
  localStorage.setItem(STORAGE_KEYS.tab, tabName);

  // Main pages — Animation nur bei echtem Tab-Wechsel (Samsung Internet
  // retriggert CSS-Animationen bei DOM-Änderungen innerhalb der Seite)
  document.querySelectorAll('.page').forEach(p => {
    const isTarget = p.dataset.page === tabName;
    p.classList.toggle('active', isTarget);
    p.classList.remove('page-enter');
    if (isTarget) {
      void p.offsetHeight;
      p.classList.add('page-enter');
      p.addEventListener('animationend', () => p.classList.remove('page-enter'), { once: true });
    }
  });
  // Sidebar nav
  document.querySelectorAll('.nav-item[data-tab], .info-btn[data-tab]').forEach(n => {
    n.classList.toggle('active', n.dataset.tab === tabName);
  });
  // Bottom nav
  document.querySelectorAll('.bnav-item[data-tab]').forEach(n => {
    n.classList.toggle('active', n.dataset.tab === tabName);
  });

  // Scroll to top on tab change
  document.getElementById('mainArea').scrollTop = 0;
}

document.querySelectorAll('[data-tab]').forEach(el => {
  el.addEventListener('click', () => switchTab(el.dataset.tab));
});

// ── Swipe-Navigation (Mobile) ──
(function initSwipeNav() {
  const TAB_ORDER = ['cockpit', 'jahresplan', 'trainingsplan', 'fortschritt', 'lexikon', 'info'];
  const main = document.getElementById('mainArea');
  if (!main) return;

  let startX = 0, startY = 0, tracking = false;

  main.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 860) return;
    if (state.cmdkOpen) return;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    tracking = true;
  }, { passive: true });

  main.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;

    const idx = TAB_ORDER.indexOf(state.activeTab);
    if (idx === -1) return;

    if (dx > 0 && idx > 0) {
      switchTab(TAB_ORDER[idx - 1]);
    } else if (dx < 0 && idx < TAB_ORDER.length - 1) {
      switchTab(TAB_ORDER[idx + 1]);
    }
  }, { passive: true });
})();

