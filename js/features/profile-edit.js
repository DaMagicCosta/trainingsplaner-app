import { state, _saveProfile } from '../state.js';
import { toast, escapeHtml, _fmtKg } from '../utils.js';
import { switchTab } from '../tabs.js';
import { renderInfo } from '../pages/info.js';

export { openProfileEditModal, saveProfileEdit, renderAthleteRow, openModal, closeModal,
         _resolveProfile, _formatLocations, _formatEquipment, _parseLocationString, _pickerAvailableEq };

/* ═══════════════════════════════════════════════════════
   MODAL-SYSTEM + PROFIL-EDIT (v2.8)
   ═══════════════════════════════════════════════════════ */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('open');
  // Nur Scroll freigeben, wenn kein anderes Modal mehr offen ist
  const anyOpen = document.querySelector('.tp-modal.open');
  if (!anyOpen) document.body.style.overflow = '';
}

// Globale Click-/Key-Handler für Modals (Backdrop, Close-Button, Escape)
document.addEventListener('click', (e) => {
  const closeTarget = e.target.closest('[data-modal-close]');
  if (closeTarget) {
    closeModal(closeTarget.dataset.modalClose);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const open = document.querySelector('.tp-modal.open');
    if (open) closeModal(open.id);
  }
});

// ─── Profil-Edit-Modal: Formular befüllen und speichern ───
// target: 'self' (Max, state.profile) oder Key aus state.demoAthletes ('lisa')
function _resolveProfile(key) {
  // 'self' = aktives Profil (wer gerade geladen ist)
  if (key === 'self') return state.profile;
  // 'lisa' = immer Julia (echtes JSON, nicht Mock)
  return state._juliaProfile || state.demoAthletes[key];
}

function openProfileEditModal(target) {
  target = target || 'self';
  const p = _resolveProfile(target);
  if (!p) { toast('Kein Profil geladen'); return; }

  state._editTarget = target;

  // Titel + Label an Target anpassen
  const labelEl = document.getElementById('profileEditLabel');
  const titleEl = document.getElementById('profileEditTitle');
  if (target === 'self') {
    if (labelEl) labelEl.innerHTML = '◉ &nbsp;Profil bearbeiten';
    if (titleEl) titleEl.textContent = 'Stammdaten & Trainingsvorlieben';
  } else {
    const fullName = ((p.name || '') + ' ' + (p.nachname || '')).trim();
    if (labelEl) labelEl.innerHTML = '⚇ &nbsp;Athlet bearbeiten';
    if (titleEl) titleEl.textContent = fullName;
  }

  document.getElementById('pemName').value             = p.name || '';
  document.getElementById('pemNachname').value         = p.nachname || '';
  document.getElementById('pemAlter').value            = p.alter || '';
  document.getElementById('pemGroesse').value          = p.groesse || '';
  document.getElementById('pemGewicht').value          = p.gewicht || '';
  const hfmaxInput = document.getElementById('pemHfmax');
  const hfmaxHint = document.getElementById('pemHfmaxHint');
  const alterInput = document.getElementById('pemAlter');
  const calcHfmax = () => {
    const alter = parseInt(alterInput.value, 10);
    if (alter > 0) {
      const berechnet = 220 - alter;
      if (hfmaxHint) hfmaxHint.textContent = `(berechnet: ${berechnet})`;
      if (!hfmaxInput.value || hfmaxInput.dataset.autoFilled === '1') {
        hfmaxInput.value = berechnet;
        hfmaxInput.dataset.autoFilled = '1';
      }
    }
  };
  alterInput.addEventListener('input', calcHfmax);
  hfmaxInput.addEventListener('input', () => { hfmaxInput.dataset.autoFilled = '0'; });
  hfmaxInput.value = p.hfmax || '';
  if (p.hfmax) hfmaxInput.dataset.autoFilled = '0';
  calcHfmax();
  document.getElementById('pemGoal').value             = p.goal || 'hypertrophie';
  // Tage-Chips: aktive markieren
  const activeTage = new Set(p.tage || []);
  document.querySelectorAll('#pemTageChips .tp-chip').forEach(chip => {
    chip.classList.toggle('active', activeTage.has(chip.dataset.day));
  });

  // Trainingsort-Chips: aktive markieren (Rückwärtskompatibel mit String)
  const rawLoc = p.trainingLocation || [];
  const activeLocs = new Set(Array.isArray(rawLoc) ? rawLoc : _parseLocationString(rawLoc));
  document.querySelectorAll('#pemLocationChips .tp-chip').forEach(chip => {
    chip.classList.toggle('active', activeLocs.has(chip.dataset.loc));
  });

  // Equipment pro Ort laden + Gruppen-Sichtbarkeit setzen
  const eq = p.equipment || {};
  const isOldFormat = Array.isArray(eq); // Rückwärtskompatibilität
  document.querySelectorAll('#pemEquipmentWrap .pem-eq-group').forEach(group => {
    const loc = group.dataset.eqloc;
    group.classList.toggle('visible', activeLocs.has(loc));
    const locEq = isOldFormat ? { available: eq, excluded: [] } : (eq[loc] || { available: [], excluded: [] });
    const avail = new Set(locEq.available || []);
    const excl  = new Set(locEq.excluded || []);
    group.querySelectorAll('.tp-chip').forEach(chip => {
      chip.classList.remove('active', 'excluded');
      if (avail.has(chip.dataset.eq))     chip.classList.add('active');
      else if (excl.has(chip.dataset.eq)) chip.classList.add('excluded');
    });
  });

  openModal('profileEditModal');
}

function saveProfileEdit() {
  const target = state._editTarget || 'self';
  const p = _resolveProfile(target);
  if (!p) return;

  p.name             = document.getElementById('pemName').value.trim();
  p.nachname         = document.getElementById('pemNachname').value.trim();
  p.alter            = parseInt(document.getElementById('pemAlter').value, 10) || p.alter;
  p.groesse          = parseInt(document.getElementById('pemGroesse').value, 10) || p.groesse;
  p.gewicht          = parseFloat(document.getElementById('pemGewicht').value) || p.gewicht;
  p.hfmax            = parseInt(document.getElementById('pemHfmax').value, 10) || p.hfmax;
  p.goal             = document.getElementById('pemGoal').value;

  p.trainingLocation = Array.from(document.querySelectorAll('#pemLocationChips .tp-chip.active'))
    .map(c => c.dataset.loc);
  p.tage = Array.from(document.querySelectorAll('#pemTageChips .tp-chip.active'))
    .map(c => c.dataset.day);

  // Equipment pro Trainingsort (Drei-Zustand: available / excluded)
  const eq = {};
  p.trainingLocation.forEach(loc => {
    const chips = document.querySelectorAll(`#pemEquipmentWrap .tp-chip[data-eqloc="${loc}"]`);
    eq[loc] = { available: [], excluded: [] };
    chips.forEach(c => {
      if (c.classList.contains('active'))   eq[loc].available.push(c.dataset.eq);
      if (c.classList.contains('excluded')) eq[loc].excluded.push(c.dataset.eq);
    });
  });
  p.equipment = eq;

  if (target === 'self') {
    // Re-render: Info-Tab und Sidebar-Label
    renderInfo(p);
    const roleNameEl = document.getElementById('roleName');
    if (roleNameEl) roleNameEl.textContent = (p.name || '').trim() || 'Profil';
    // Dropdown-Eintrag "eigenes Profil" mit neuem Namen aktualisieren
    const selfSwitch = document.querySelector('[data-athlete-switch="self"] span:last-child');
    if (selfSwitch) {
      const displayName = ((p.name || '') + ' ' + (p.nachname || '')).trim() || 'Mein Profil';
      selfSwitch.textContent = displayName + ' (eigenes Profil)';
    }
  } else {
    // Athleten-Card in der Profil-Section aktualisieren
    renderAthleteRow(target, p);
  }

  closeModal('profileEditModal');
  _saveProfile();
  toast((target === 'self' ? 'Profil' : 'Athlet') + ' gespeichert');
}

// Einzelne Athleten-Zeile in der Verwalten-Card neu zeichnen
function renderAthleteRow(key, p) {
  const row = document.querySelector('.info-athlete-row [data-athlete-edit="' + key + '"]')?.closest('.info-athlete-row');
  if (!row) return;
  const fullName = ((p.name || '') + ' ' + (p.nachname || '')).trim();
  const initials = ((p.name || '?')[0] + (p.nachname || '')[0]).toUpperCase();
  const goalLabels = {
    hypertrophie: 'Hypertrophie', maximalkraft: 'Maximalkraft',
    kraftausdauer: 'Kraftausdauer', abnehmen: 'Abnehmen', allgemein: 'Fitness'
  };
  const goal = goalLabels[p.goal] || p.goal;
  const freq = (p.tage || []).length;
  const avatarEl = row.querySelector('.info-athlete-avatar');
  const nameEl   = row.querySelector('.info-athlete-name');
  const metaEl   = row.querySelector('.info-athlete-meta');
  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl)   nameEl.textContent   = fullName;
  if (metaEl)   metaEl.textContent   = `${p.alter} J · ${goal} · ${freq}×/Woche · Demo-Athletin`;
}

// Alte String-Werte wie "Studio + Zuhause" oder "outdoor" → Array ['studio','home']
function _parseLocationString(str) {
  if (!str || typeof str !== 'string') return [];
  const s = str.toLowerCase();
  const result = [];
  if (s.includes('studio'))             result.push('studio');
  if (s.includes('zuhause') || s.includes('home')) result.push('home');
  if (s.includes('outdoor') || s.includes('calisthenics') || s.includes('park')) result.push('outdoor');
  return result.length ? result : [s.trim()];
}
// Array/String → lesbarer Text für Anzeige
function _formatLocations(loc) {
  const labels = { studio: 'Studio', home: 'Zuhause', outdoor: 'Outdoor' };
  const arr = Array.isArray(loc) ? loc : _parseLocationString(loc || '');
  return arr.map(l => labels[l] || l).join(' · ') || '—';
}
// Equipment-Objekt → lesbarer Text (pro Ort, Excluded durchgestrichen)
// Verfügbares Equipment für den aktuellen Plan-Block (Übungspicker)
function _pickerAvailableEq() {
  const kw = state.tpViewKw;
  const plan = (state.profile?.plans || {})['w' + kw];
  const loc = plan?._location || 'studio';
  const eq = state.profile?.equipment;
  if (!eq || Array.isArray(eq)) return null;
  const locEq = eq[loc];
  if (!locEq) return null;
  const avail = new Set(locEq.available || []);
  const excl  = new Set(locEq.excluded || []);
  avail.add('Bodyweight');
  excl.forEach(e => avail.delete(e));
  return avail;
}

function _formatEquipment(eq) {
  if (!eq) return '—';
  // Altes flaches Array
  if (Array.isArray(eq)) return eq.join(', ') || '—';
  // Neues verschachteltes Format
  const locLabels = { studio: 'Studio', home: 'Zuhause', outdoor: 'Outdoor' };
  const parts = [];
  Object.entries(eq).forEach(([loc, data]) => {
    const avail = (data.available || []).map(e => escapeHtml(e)).join(', ');
    const excl  = (data.excluded || []).map(e => '<s style="color:var(--danger)">' + escapeHtml(e) + '</s>').join(', ');
    const items = [avail, excl].filter(Boolean).join(', ');
    if (items) parts.push('<strong>' + (locLabels[loc] || loc) + ':</strong> ' + items);
  });
  return parts.join('<br>') || '—';
}


