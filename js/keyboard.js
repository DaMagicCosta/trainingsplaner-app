import { state } from './state.js';
import { toast } from './utils.js';
import { switchTab } from './tabs.js';
import { toggleRoleDropdown } from './roles.js';
import { openCmdk, closeCmdk } from './command-palette.js';
const roleDropdown = document.getElementById('roleDropdown');
import { startNextEinheit } from './features/log-session.js';

/* ═══════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ═══════════════════════════════════════════════════════ */
const gMap = {
  'c': 'cockpit',
  'j': 'jahresplan',
  't': 'trainingsplan',
  'f': 'fortschritt',
  'l': 'lexikon'
};

document.addEventListener('keydown', (e) => {
  const mod = e.metaKey || e.ctrlKey;
  const target = e.target;
  const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

  // ESC: close dropdowns & cmdk
  if (e.key === 'Escape') {
    if (state.cmdkOpen) { closeCmdk(); return; }
    if (roleDropdown.classList.contains('open')) { toggleRoleDropdown(false); return; }
  }

  // ⌘K / Ctrl+K: open command palette
  if (mod && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (state.cmdkOpen) closeCmdk(); else openCmdk();
    return;
  }

  // ⌘N / Ctrl+N: neue Einheit
  if (mod && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    startNextEinheit();
    return;
  }

  // ⌘L / Ctrl+L: sperren — im Demo-Modus bewusst deaktiviert
  if (mod && e.key.toLowerCase() === 'l') {
    e.preventDefault();
    toast('PIN-Lock im Demo-Modus bewusst deaktiviert');
    return;
  }

  // Wenn in einem Input, keine G-Sequenzen
  if (inInput) return;

  // G-Sequenz-Navigation
  if (state.gSequence) {
    const target = gMap[e.key.toLowerCase()];
    if (target) {
      e.preventDefault();
      // Planungs-Tab ist Trainer-only — Athlet darf nicht via G-P dorthin
      switchTab(target);
    }
    clearTimeout(state.gTimeout);
    state.gSequence = false;
    return;
  }

  if (e.key.toLowerCase() === 'g' && !mod) {
    state.gSequence = true;
    state.gTimeout = setTimeout(() => { state.gSequence = false; }, 1500);
    return;
  }
});

