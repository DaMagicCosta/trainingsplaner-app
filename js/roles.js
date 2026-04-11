import { state, STORAGE_KEYS } from './state.js';
import { toast } from './utils.js';
import { applyTheme } from './themes.js';
import { renderCockpit } from './pages/cockpit.js';
import { renderJahresplan } from './pages/jahresplan.js';
import { renderTrainingsplan } from './pages/trainingsplan.js';
import { renderFortschritt } from './pages/fortschritt.js';
import { renderInfo } from './pages/info.js';

/* ═══════════════════════════════════════════════════════
   ROLE SWITCHER
   ═══════════════════════════════════════════════════════ */
const roleBtn = document.getElementById('roleBtn');
const roleDropdown = document.getElementById('roleDropdown');
const roleModeEl = document.getElementById('roleMode');
const athleteListLabel = document.getElementById('athleteListLabel');

export function setRole(role) {
  state.role = role;
  localStorage.setItem(STORAGE_KEYS.role, role);
  roleModeEl.textContent = role === 'trainer' ? 'Trainer-Modus' : 'Athlet-Modus';

  // Body-Klasse für rollenbasierte CSS-Regeln (Info-Tab: Anamnese/Vereinbarung)
  document.body.classList.toggle('role-trainer', role === 'trainer');
  document.body.classList.toggle('role-athlete', role !== 'trainer');

  // Profil-Label im Info-Tab an neue Rolle anpassen
  const subEl = document.getElementById('infoProfileSub');
  if (subEl) {
    subEl.textContent = role === 'trainer' ? 'Trainer-Profil' : 'Athleten-Profil';
  }

  // Falls aktive Info-Sub-Section für die neue Rolle nicht mehr sichtbar ist → auf Profil zurück
  if (role === 'trainer' && state.infoSection === 'anamnese') {
    state.infoSection = 'profil';
    localStorage.setItem('tpv2_info_section', 'profil');
    document.querySelectorAll('#infoSubnav button').forEach(b => b.classList.toggle('active', b.dataset.section === 'profil'));
    document.querySelectorAll('.info-section').forEach(s => s.classList.toggle('active', s.dataset.section === 'profil'));
  }
  if (role !== 'trainer' && state.infoSection === 'vereinbarung') {
    state.infoSection = 'profil';
    localStorage.setItem('tpv2_info_section', 'profil');
    document.querySelectorAll('#infoSubnav button').forEach(b => b.classList.toggle('active', b.dataset.section === 'profil'));
    document.querySelectorAll('.info-section').forEach(s => s.classList.toggle('active', s.dataset.section === 'profil'));
  }

  document.querySelectorAll('[data-role]').forEach(item => {
    item.classList.toggle('active', item.dataset.role === role);
  });

  // Trainingsplan: Edit-Modus zurücksetzen bei Athletenwechsel
  if (role !== 'trainer') {
    const tpPage = document.querySelector('.page[data-page="trainingsplan"]');
    if (tpPage) tpPage.classList.remove('tp-edit-active');
    state.tpEditMode = false;
    document.querySelectorAll('#tpMode button').forEach(b => b.classList.toggle('active', b.dataset.mode === 'view'));
  }

  // Athletenliste nur im Trainer-Modus
  const showAthletes = role === 'trainer';
  athleteListLabel.style.display = showAthletes ? '' : 'none';
  document.querySelectorAll('[data-athlete-switch]').forEach(el => {
    el.style.display = showAthletes ? '' : 'none';
  });

  // Jahresplan: Rollen-Klasse setzen (blendet Modus-Toggle + Neuer-Plan-Button für Athleten)
  const jp = document.querySelector('.page[data-page="jahresplan"]');
  if (jp) {
    jp.classList.toggle('role-athlete', role !== 'trainer');
    // Athleten können keinen Bearbeiten-Modus haben — auf Ansicht zurücksetzen
    if (role !== 'trainer') {
      jp.classList.remove('mode-edit');
      jp.classList.add('mode-view');
      document.querySelectorAll('#jpMode button').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === 'view');
      });
    }
  }

  // Rollenwechsel kann das Vereinbarungs-Gate ein-/ausblenden
  import('./gates.js').then(({ applyGates }) => applyGates());

  toast(role === 'trainer' ? 'Trainer-Modus aktiv' : 'Athlet-Modus aktiv');
}

export function toggleRoleDropdown(force) {
  const isOpen = roleDropdown.classList.contains('open');
  const shouldOpen = force !== undefined ? force : !isOpen;
  roleDropdown.classList.toggle('open', shouldOpen);
}

roleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleRoleDropdown();
});

document.querySelectorAll('[data-role]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setRole(btn.dataset.role);
    toggleRoleDropdown(false);
  });
});

document.addEventListener('click', (e) => {
  if (!roleBtn.contains(e.target) && !roleDropdown.contains(e.target)) {
    toggleRoleDropdown(false);
  }
});

// ── Profil-Wechsel: zwischen Alexander (self) und Athleten wechseln ──
// state._selfProfile speichert Alexanders Profil, damit wir zurückwechseln können
export async function switchProfile(key) {
  // Beim ersten Wechsel: Alexander sichern
  if (!state._selfProfile && state.profile) {
    state._selfProfile = state.profile;
  }

  if (key === 'self') {
    state.profile = state._selfProfile || state.profile;
    state.activeProfile = 'self';
  } else {
    // Julia-Profil laden (beim ersten Mal per fetch, danach gecacht)
    if (!state._juliaProfile) {
      try {
        toast('Lade Julias Profil …');
        const juliaPath = './Trainingsplaner_Julia_Demo.json';
        const res = await fetch(juliaPath, { cache: 'no-cache' });
        if (res.ok) {
          state._juliaProfile = await res.json();
        }
      } catch (e) {
        console.warn('Julia-JSON nicht gefunden, verwende Basis-Profil', e);
        toast('Julia-Profil konnte nicht geladen werden');
      }
    }
    const athleteProfile = state._juliaProfile || state.demoAthletes[key];
    if (!athleteProfile) { toast('Profil nicht gefunden'); return; }
    // Sicherstellen dass Basis-Strukturen existieren
    if (!athleteProfile.plans) athleteProfile.plans = {};
    if (!athleteProfile.sessions) athleteProfile.sessions = [];
    state.profile = athleteProfile;
    state.activeProfile = key;
  }

  // Sidebar-Name updaten
  const name = ((state.profile.name || '') + ' ' + (state.profile.nachname || '')).trim();
  const roleNameEl = document.getElementById('roleName');
  if (roleNameEl) roleNameEl.textContent = name;

  // Aktiven Athleten im Dropdown markieren
  document.querySelectorAll('.role-dropdown [data-athlete-switch]').forEach(btn => {
    const isActive = btn.dataset.athleteSwitch === key;
    btn.querySelector('.radio')?.classList.toggle('active', isActive);
  });

  // Auto-Theme: Julia bekommt Pastell, Alexander seinen Teal
  if (key !== 'self') {
    // Alexanders Theme merken bevor wir auf Pastell wechseln
    if (!state._savedThemeBeforeAthlete) {
      state._savedThemeBeforeAthlete = state.theme !== 'pastell' ? state.theme : 'tealDeep';
    }
    applyTheme('pastell');
  } else {
    const restore = state._savedThemeBeforeAthlete || 'tealDeep';
    state._savedThemeBeforeAthlete = null;
    applyTheme(restore);
  }

  // Alles neu rendern mit dem neuen Profil
  state.tpViewKw = null;
  state.tpViewDay = 0;
  renderCockpit(state.profile);
  renderJahresplan(state.profile);
  renderTrainingsplan(state.profile);
  renderFortschritt(state.profile);
  renderInfo(state.profile);

  // Profilwechsel → Gate neu auswerten (Banner + Tab-Sperre je nach Anamnese des neuen Profils)
  import('./gates.js').then(({ applyGates }) => applyGates());

  toast(key === 'self' ? 'Eigenes Profil aktiv' : `${name} — Athleten-Profil aktiv`);
}

// Sidebar-Dropdown: Klick auf Athleten → Profil wechseln
document.querySelectorAll('.role-dropdown [data-athlete-switch]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleRoleDropdown(false);
    switchProfile(btn.dataset.athleteSwitch);
  });
});

