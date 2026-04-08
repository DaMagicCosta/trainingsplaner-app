import { state } from './state.js';
import { toast, escapeHtml } from './utils.js';
import { switchTab } from './tabs.js';
import { setRole, switchProfile, toggleRoleDropdown } from './roles.js';
import { startNextEinheit } from "./features/log-session.js";
import { exportProfileJson } from "./pages/info.js";
import { reloadDemoProfile } from "./demo-loader.js";
import { openProfileEditModal } from "./features/profile-edit.js";

// Funktionen aus noch-nicht-extrahierten Modulen (Phase 4+)
// startNextEinheit, exportProfileJson, reloadDemoProfile, openProfileEditModal

/* ═══════════════════════════════════════════════════════
   COMMAND PALETTE
   ═══════════════════════════════════════════════════════ */
const cmdk = document.getElementById('cmdk');
const cmdkInput = document.getElementById('cmdkInput');
const cmdkList = document.getElementById('cmdkList');

const cmdkItems = [
  { group: 'Quick Actions', label: 'Neue Einheit loggen', ico: '+', kbd: ['⌘','N'], action: () => startNextEinheit() },
  { group: 'Quick Actions', label: 'Profil als JSON exportieren', ico: '↗', action: () => exportProfileJson() },
  { group: 'Quick Actions', label: 'Demo-Profil neu laden', ico: '↓', action: () => reloadDemoProfile() },

  { group: 'Navigation', label: 'Zum Cockpit', ico: '◈', kbd: ['G','C'], action: () => switchTab('cockpit') },
  { group: 'Navigation', label: 'Zum Jahresplan', ico: '▤', kbd: ['G','J'], action: () => switchTab('jahresplan') },
  { group: 'Navigation', label: 'Zum Trainingsplan', ico: '◯', kbd: ['G','T'], action: () => switchTab('trainingsplan') },
  { group: 'Navigation', label: 'Zum Fortschritt', ico: '↗', kbd: ['G','F'], action: () => switchTab('fortschritt') },
  { group: 'Navigation', label: 'Zum Lexikon', ico: '⌘', kbd: ['G','L'], action: () => switchTab('lexikon') },

  { group: 'Modus', label: 'Zu Athlet wechseln', ico: '○', action: () => setRole('athlete') },
  { group: 'Modus', label: 'Zu Trainer wechseln', ico: '●', action: () => setRole('trainer') },
  { group: 'Modus', label: 'Zu Alexander wechseln', ico: '◉', visible: () => state.activeProfile !== 'self', action: () => switchProfile('self') },
  { group: 'Modus', label: 'Zu Julia wechseln', ico: '◉', visible: () => state.activeProfile === 'self', action: () => switchProfile('lisa') },
  { group: 'Modus', label: 'Eigenes Profil bearbeiten', ico: '✎', action: () => openProfileEditModal('self') },
  { group: 'Modus', label: 'Athletin Julia bearbeiten', ico: '⚇', action: () => openProfileEditModal('lisa') },
  { group: 'Modus', label: 'Anamnesebogen anzeigen', ico: '⚕', visible: () => state.role !== 'trainer', action: () => { switchTab('info'); setTimeout(() => { document.querySelectorAll('#infoSubnav button').forEach(b => b.classList.toggle('active', b.dataset.section === 'anamnese')); document.querySelectorAll('.info-section').forEach(s => s.classList.toggle('active', s.dataset.section === 'anamnese')); state.infoSection = 'anamnese'; localStorage.setItem('tpv2_info_section', 'anamnese'); }, 50); } },
  { group: 'Modus', label: 'Trainer-Vereinbarung anzeigen', ico: '⚖', visible: () => state.role === 'trainer', action: () => { switchTab('info'); setTimeout(() => { document.querySelectorAll('#infoSubnav button').forEach(b => b.classList.toggle('active', b.dataset.section === 'vereinbarung')); document.querySelectorAll('.info-section').forEach(s => s.classList.toggle('active', s.dataset.section === 'vereinbarung')); state.infoSection = 'vereinbarung'; localStorage.setItem('tpv2_info_section', 'vereinbarung'); }, 50); } },

  { group: 'Tools', label: 'Bug melden', ico: '🐛', action: () => document.getElementById('bugFloaterBtn')?.click() },
  { group: 'Tools', label: 'Quiz starten', ico: '?', action: () => toast('Quiz-Modul in v2 noch nicht portiert') },
  { group: 'Tools', label: 'Sync jetzt', ico: '↺', action: () => toast('Sync im Demo-Modus bewusst deaktiviert') },

  { group: 'Einstellungen', label: 'Theme wechseln', ico: '◐', action: () => toast('Theme-Wechsel unten links im Sidebar-Fuss (3 Teal-Varianten)') },
  { group: 'Einstellungen', label: 'Profil sperren', ico: '🔒', kbd: ['⌘','L'], action: () => toast('PIN-Lock im Demo-Modus bewusst deaktiviert') },
  { group: 'Einstellungen', label: 'Info / Ueber die App', ico: 'ⓘ', action: () => switchTab('info') },
];

function renderCmdkList(filter = '') {
  const q = filter.trim().toLowerCase();
  const isMobile = window.innerWidth <= 860;
  const visible = cmdkItems.filter(i => {
    if (i.visible && !i.visible()) return false;
    // Mobile: Navigation-Gruppe ausblenden (Bottom-Nav existiert bereits)
    if (isMobile && !q && i.group === 'Navigation') return false;
    return true;
  });
  const filtered = q
    ? visible.filter(i => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q))
    : visible;

  if (filtered.length === 0) {
    cmdkList.innerHTML = '<div class="cmdk-empty">Nichts gefunden für "' + escapeHtml(filter) + '"</div>';
    state.cmdkSelected = 0;
    return;
  }

  // Lookup: filtered position → Original-cmdkItems-Index
  const origIndices = filtered.map(i => cmdkItems.indexOf(i));

  let html = '';
  let currentGroup = '';
  let pos = 0; // Position in filtered-Array (für Keyboard-Selection)

  // Mobile ohne Filter: Quick Actions als Hero-Tiles rendern
  if (isMobile && !q) {
    const heroes = [];
    const rest = [];
    filtered.forEach((item, i) => {
      (item.group === 'Quick Actions' ? heroes : rest).push({ item, origIdx: origIndices[i], pos: i });
    });

    if (heroes.length) {
      html += '<div class="cmdk-hero-grid">';
      heroes.forEach((h, i) => {
        const cls = i === 0 ? 'cmdk-hero--primary' : 'cmdk-hero--secondary';
        html += '<button class="cmdk-hero ' + cls + '" data-orig="' + h.origIdx + '" data-pos="' + h.pos + '">'
              + '<span class="cmdk-hero-ico">' + h.item.ico + '</span>'
              + '<span>' + h.item.label + '</span>'
              + '</button>';
      });
      html += '</div>';
    }

    rest.forEach(r => {
      if (r.item.group !== currentGroup) {
        html += '<div class="cmdk-group-label">' + r.item.group + '</div>';
        currentGroup = r.item.group;
      }
      html += '<button class="cmdk-item" data-orig="' + r.origIdx + '" data-pos="' + r.pos + '">'
            + '<span class="cmdk-item-ico">' + r.item.ico + '</span>'
            + '<span class="cmdk-item-label">' + r.item.label + '</span>'
            + '</button>';
    });
  } else {
    // Desktop-Layout (unverändert) + Mobile mit Suchfilter
    filtered.forEach((item, i) => {
      if (item.group !== currentGroup) {
        html += '<div class="cmdk-group-label">' + item.group + '</div>';
        currentGroup = item.group;
      }
      const selected = i === state.cmdkSelected ? 'selected' : '';
      const kbdHtml = item.kbd
        ? '<div class="cmdk-item-kbd">' + item.kbd.map(k => '<span class="kbd">' + k + '</span>').join('') + '</div>'
        : '';
      html += '<button class="cmdk-item ' + selected + '" data-orig="' + origIndices[i] + '" data-pos="' + i + '">'
            + '<span class="cmdk-item-ico">' + item.ico + '</span>'
            + '<span class="cmdk-item-label">' + item.label + '</span>'
            + kbdHtml + '</button>';
    });
  }

  cmdkList.innerHTML = html;

  // Event-Handler: data-orig = direkter cmdkItems-Index → kein Mapping nötig
  cmdkList.querySelectorAll('.cmdk-item, .cmdk-hero').forEach(el => {
    el.addEventListener('click', () => {
      const origIdx = parseInt(el.dataset.orig);
      const item = cmdkItems[origIdx];
      closeCmdk();
      if (item && item.action) item.action();
    });
    el.addEventListener('mousemove', () => {
      state.cmdkSelected = parseInt(el.dataset.pos);
      updateCmdkSelection();
    });
  });
}

function updateCmdkSelection() {
  cmdkList.querySelectorAll('.cmdk-item, .cmdk-hero').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.pos) === state.cmdkSelected);
  });
  const selected = cmdkList.querySelector('.selected');
  if (selected) selected.scrollIntoView({ block: 'nearest' });
}

function runCmdkSelectedItem() {
  const el = cmdkList.querySelector('[data-pos="' + state.cmdkSelected + '"]');
  if (!el) return;
  const origIdx = parseInt(el.dataset.orig);
  const item = cmdkItems[origIdx];
  closeCmdk();
  if (item && item.action) item.action();
}

export function openCmdk() {
  state.cmdkOpen = true;
  state.cmdkSelected = 0;
  cmdk.classList.add('open');
  cmdkInput.value = '';
  renderCmdkList('');
  // Am Desktop Suchfeld fokussieren. Am Handy NICHT — sonst poppt die Tastatur
  // auf und verdeckt die Liste, obwohl der Nutzer meist nur tippen statt suchen will.
  if (window.innerWidth > 720) {
    setTimeout(() => cmdkInput.focus(), 50);
  }
}

export function closeCmdk() {
  state.cmdkOpen = false;
  cmdk.classList.remove('open');
}

cmdkInput.addEventListener('input', (e) => {
  state.cmdkSelected = 0;
  renderCmdkList(e.target.value);
});

cmdkInput.addEventListener('keydown', (e) => {
  const allItems = cmdkList.querySelectorAll('.cmdk-item, .cmdk-hero');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    state.cmdkSelected = Math.min(state.cmdkSelected + 1, allItems.length - 1);
    updateCmdkSelection();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    state.cmdkSelected = Math.max(state.cmdkSelected - 1, 0);
    updateCmdkSelection();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    runCmdkSelectedItem();
  }
});

cmdk.addEventListener('click', (e) => {
  if (e.target === cmdk) closeCmdk();
});

// Log-Button: Tap = Einheit starten, Long-Press = Command Palette
const _logBtn = document.getElementById('logBtn');
if (_logBtn) {
  let _logTimer = null;
  _logBtn.addEventListener('pointerdown', () => {
    _logTimer = setTimeout(() => { _logTimer = null; openCmdk(); }, 500);
  });
  _logBtn.addEventListener('pointerup', () => {
    if (_logTimer) { clearTimeout(_logTimer); _logTimer = null; startNextEinheit(); }
  });
  _logBtn.addEventListener('pointerleave', () => {
    if (_logTimer) { clearTimeout(_logTimer); _logTimer = null; }
  });
}

