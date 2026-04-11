import { state, _saveProfile, _loadSavedProfile, _clearSavedProfile, getEmptyProfile } from './state.js';
import { toast } from './utils.js';
import { applyTheme } from './themes.js';
import { switchTab } from './tabs.js';
import { renderCockpit } from "./pages/cockpit.js";
import { renderJahresplan } from "./pages/jahresplan.js";
import { renderTrainingsplan } from "./pages/trainingsplan.js";
import { renderFortschritt } from "./pages/fortschritt.js";
import { renderInfo } from "./pages/info.js";
import { buildPlanBalance } from "./features/plan-balance.js";
import { _parseLocationString } from "./features/profile-edit.js";

export { DEMO_PATH, DEMO_PATH_JULIA, _applyProfile, _loadDemoFromFetch, loadDemoProfile, reloadDemoProfile, loadDemoAlexander, loadDemoJulia, applyEmptyProfile, exitDemoMode };

/* ═══════════════════════════════════════════════════════
   DEMO PROFILE LOADER
   ═══════════════════════════════════════════════════════ */
const DEMO_PATH       = './Trainingsplaner_Alexander_Demo.json';
const DEMO_PATH_JULIA = './Trainingsplaner_Julia_Demo.json';

function _applyProfile(profile, source) {
  // Equipment-Format migrieren (altes Array → neues Objekt)
  if (Array.isArray(profile.equipment)) {
    const loc = Array.isArray(profile.trainingLocation) ? profile.trainingLocation[0]
              : (_parseLocationString(profile.trainingLocation || '')[0] || 'studio');
    profile.equipment = { [loc]: { available: profile.equipment, excluded: [] } };
  }
  state.profile = profile;
  window._profile = profile;

  const sessions = profile.sessions || [];
  const isEmpty = typeof profile.id === 'string' && profile.id.startsWith('empty-');
  console.log(`[${source}] Profil geladen:`, profile.name, '·', sessions.length, 'Sessions');

  if (!isEmpty) {
    toast(`${profile.name || 'Profil'} geladen · ${sessions.length} Einheiten`);
  }

  // Sidebar-Name und Dropdown an geladenes Profil anpassen
  const fullName = ((profile.name || '') + ' ' + (profile.nachname || '')).trim();
  const sidebarLabel = fullName || (isEmpty ? 'Leeres Profil' : 'Profil');
  const roleNameEl = document.getElementById('roleName');
  if (roleNameEl) roleNameEl.textContent = sidebarLabel;
  const selfSwitch = document.querySelector('[data-athlete-switch="self"] span:last-child');
  if (selfSwitch) {
    selfSwitch.textContent = fullName ? fullName + ' (eigenes Profil)' : 'Mein Profil';
  }

  // Hardcoded Julia-Reste aus dem alten Demo-Modell entfernen — gilt
  // für alle Quellen außer der echten Demo-Julia-Vorschau (wo sie eh
  // gerade aktiv geladen wird, also nicht doppelt erscheinen darf).
  if (source !== 'Demo Julia') {
    const juliaSwitch = document.querySelector('[data-athlete-switch="lisa"]');
    if (juliaSwitch) juliaSwitch.remove();
    const athletesList = document.getElementById('infoAthletesList');
    if (athletesList) athletesList.innerHTML = '';
    state._juliaProfile = null;
    state.demoAthletes = {};
  }

  renderCockpit(profile);
  renderJahresplan(profile);
  renderTrainingsplan(profile);
  renderFortschritt(profile);
  renderInfo(profile);
  buildPlanBalance(profile);
  return profile;
}

/**
 * Init-Lader für die App-Sequenz.
 *
 * Verhalten seit Etappe D (11.04.2026):
 * - Wenn ein lokal gespeichertes Profil existiert: laden
 * - Sonst: leeres Profil verwenden (kein Auto-Demo mehr)
 *
 * Demo-Profile (Alexander, Julia) können über loadDemoAlexander() / loadDemoJulia()
 * explizit nachgeladen werden — Trigger sind Command Palette, Info → Daten
 * und der Demo-Banner im Cockpit.
 */
async function loadDemoProfile() {
  const saved = _loadSavedProfile();
  if (saved) return _applyProfile(saved, 'Persist');

  // Kein gespeichertes Profil → leeres Profil verwenden
  return applyEmptyProfile();
}

function applyEmptyProfile() {
  const empty = getEmptyProfile();
  console.log('[Empty] Leeres Profil verwendet — Erstaufruf');
  return _applyProfile(empty, 'Empty');
}

async function _loadDemoFromFetch() {
  return _loadDemoFromPath(DEMO_PATH, 'Demo Alexander');
}

async function _loadDemoFromPath(path, label) {
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const profile = await res.json();
    const applied = _applyProfile(profile, label);
    _saveProfile();
    return applied;
  } catch (err) {
    console.warn('[' + label + '] Konnte Profil nicht laden:', err.message);
    toast(label + ' nicht geladen – Live Server starten');
    return null;
  }
}

/**
 * Lädt ein Demo-Profil als RAM-only Vorschau, ohne das eigene Profil
 * im localStorage anzufassen. Das aktuelle Profil wird in
 * state._savedProfileBackup geparkt; exitDemoMode() spielt es zurück.
 *
 * Mutationen am Demo bleiben nur in RAM, weil _saveProfile() im
 * Demo-Modus blockiert ist.
 */
async function _loadDemoAsPreview(path, label, modeKey) {
  // Bereits in einer anderen Demo-Vorschau? Erst sauber zurück, sonst
  // würde das Backup überschrieben werden.
  if (state.demoMode) {
    state.profile = state._savedProfileBackup;
    state.demoMode = null;
    state._savedProfileBackup = null;
  }

  // Aktuelles eigenes Profil parken
  state._savedProfileBackup = state.profile;

  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const profile = await res.json();
    // Demo-Modus *vor* _applyProfile setzen, damit kein Save-Effekt entsteht
    state.demoMode = modeKey;
    _applyProfile(profile, label);
    _renderDemoBanner();
    toast('Demo-Vorschau: ' + (profile.name || modeKey) + ' · Änderungen werden nicht gespeichert');
    return profile;
  } catch (err) {
    // Bei Fehler: Backup wiederherstellen, Modus zurücksetzen
    state.profile = state._savedProfileBackup;
    state._savedProfileBackup = null;
    state.demoMode = null;
    console.warn('[' + label + '] Konnte Profil nicht laden:', err.message);
    toast(label + ' nicht geladen – Live Server starten');
    return null;
  }
}

/**
 * Lädt das Alexander-Demo als Vorschau (430 Sessions, Calisthenics).
 */
async function loadDemoAlexander() {
  return _loadDemoAsPreview(DEMO_PATH, 'Demo Alexander', 'alexander');
}

/**
 * Lädt das Julia-Demo als Vorschau (Studio + Cardio).
 */
async function loadDemoJulia() {
  return _loadDemoAsPreview(DEMO_PATH_JULIA, 'Demo Julia', 'julia');
}

/**
 * Verlässt den Demo-Vorschau-Modus und stellt das eigene Profil wieder her.
 * Wenn vorher kein eigenes Profil vorhanden war, fällt es auf das leere
 * Profil zurück.
 */
function exitDemoMode() {
  if (!state.demoMode) return;
  const backup = state._savedProfileBackup;
  state.demoMode = null;
  state._savedProfileBackup = null;
  if (backup) {
    _applyProfile(backup, 'Persist');
  } else {
    applyEmptyProfile();
  }
  _renderDemoBanner();
  toast('Zurück zu deinem Profil');
}

/**
 * Aktualisiert den Demo-Vorschau-Banner und Sidebar-Pill.
 * Wird von _loadDemoAsPreview() und exitDemoMode() aufgerufen.
 */
function _renderDemoBanner() {
  const banner = document.getElementById('demoModeBanner');
  const labelEl = document.getElementById('demoModeBannerLabel');
  const pill = document.getElementById('sidebarDemoPill');
  if (state.demoMode) {
    if (banner) banner.style.display = '';
    if (labelEl) {
      const name = state.demoMode === 'alexander' ? 'Alexander' : 'Julia';
      labelEl.textContent = 'Du erkundest die Demo „' + name + '" — Änderungen werden nicht gespeichert.';
    }
    if (pill) pill.style.display = '';
  } else {
    if (banner) banner.style.display = 'none';
    if (pill) pill.style.display = 'none';
  }
}

async function reloadDemoProfile() {
  // Im neuen Vorschau-Modell gibt es kein "Demo zurücksetzen" mehr im
  // klassischen Sinn — die Vorschau ist eh RAM-only. Wenn diese Funktion
  // noch gerufen wird (Command Palette), dann lädt sie die aktive Demo neu.
  if (state.demoMode === 'julia') {
    return loadDemoJulia();
  }
  return loadDemoAlexander();
}

