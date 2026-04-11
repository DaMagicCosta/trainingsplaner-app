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

export { DEMO_PATH, DEMO_PATH_JULIA, _applyProfile, _loadDemoFromFetch, loadDemoProfile, reloadDemoProfile, loadDemoMax, loadDemoJulia, applyEmptyProfile };

/* ═══════════════════════════════════════════════════════
   DEMO PROFILE LOADER
   ═══════════════════════════════════════════════════════ */
const DEMO_PATH       = './Trainingsplaner_Max_Mustermann_Demo.json';
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
  console.log(`[${source}] Profil geladen:`, profile.name, '·', sessions.length, 'Sessions');

  toast(`${profile.name || 'Profil'} geladen · ${sessions.length} Einheiten`);

  // Sidebar-Name und Dropdown an geladenes Profil anpassen
  const roleNameEl = document.getElementById('roleName');
  if (roleNameEl) roleNameEl.textContent = (profile.name || '').trim() || 'Profil';
  const selfSwitch = document.querySelector('[data-athlete-switch="self"] span:last-child');
  if (selfSwitch) {
    const displayName = ((profile.name || '') + ' ' + (profile.nachname || '')).trim() || 'Mein Profil';
    selfSwitch.textContent = displayName + ' (eigenes Profil)';
  }

  // Bei eigenem Profil (aus localStorage): Demo-Athleten komplett entfernen
  if (source === 'Persist') {
    const juliaSwitch = document.querySelector('[data-athlete-switch="lisa"]');
    if (juliaSwitch) juliaSwitch.remove();
    // Athleten-Verwaltung im Info-Tab leeren (hardcoded Julia-Zeile)
    const athletesList = document.getElementById('infoAthletesList');
    if (athletesList) athletesList.innerHTML = '';
    // Demo-Athleten-State aufräumen
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
 * Demo-Profile (Max, Julia) können über loadDemoMax() / loadDemoJulia()
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
  return _loadDemoFromPath(DEMO_PATH, 'Demo Max');
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
 * Prüft, ob ein gespeichertes Profil "real" ist (nicht das leere Stub-Profil).
 * Ein leeres Profil hat eine id, die mit 'empty-' beginnt.
 */
function _isRealProfile(p) {
  if (!p) return false;
  if (typeof p.id === 'string' && p.id.startsWith('empty-')) return false;
  return true;
}

/**
 * Lädt das Max-Demo (Alexander Cali · 430 Sessions). Mit optionalem
 * Confirm wenn bereits ein echtes Profil im localStorage existiert.
 */
async function loadDemoMax() {
  const saved = _loadSavedProfile();
  if (_isRealProfile(saved)) {
    const ok = confirm(
      'Aktuelles Profil mit dem Demo "Max Mustermann" überschreiben?\n\n' +
      'Dein bisheriges Profil geht dabei verloren. Erstelle vorher ein ' +
      'Backup über Info → Daten → Export, falls du es behalten willst.'
    );
    if (!ok) return;
  }
  _clearSavedProfile();
  const result = await _loadDemoFromPath(DEMO_PATH, 'Demo Max');
  if (result) {
    setTimeout(() => location.reload(), 600);
  }
  return result;
}

/**
 * Lädt das Julia-Demo (Studio + Cardio · Frauen-Profil).
 */
async function loadDemoJulia() {
  const saved = _loadSavedProfile();
  if (_isRealProfile(saved)) {
    const ok = confirm(
      'Aktuelles Profil mit dem Demo "Julia" überschreiben?\n\n' +
      'Dein bisheriges Profil geht dabei verloren. Erstelle vorher ein ' +
      'Backup über Info → Daten → Export, falls du es behalten willst.'
    );
    if (!ok) return;
  }
  _clearSavedProfile();
  const result = await _loadDemoFromPath(DEMO_PATH_JULIA, 'Demo Julia');
  if (result) {
    setTimeout(() => location.reload(), 600);
  }
  return result;
}

async function reloadDemoProfile() {
  _clearSavedProfile();
  toast('Demo zurückgesetzt …');
  await _loadDemoFromPath(DEMO_PATH, 'Demo Max');
  setTimeout(() => location.reload(), 600);
}

