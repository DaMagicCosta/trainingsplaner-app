import { state, _saveProfile, _loadSavedProfile, _clearSavedProfile } from './state.js';
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

export { DEMO_PATH, _applyProfile, loadDemoProfile, reloadDemoProfile };

/* ═══════════════════════════════════════════════════════
   DEMO PROFILE LOADER
   ═══════════════════════════════════════════════════════ */
const DEMO_PATH = './Trainingsplaner_Max_Mustermann_Demo.json';

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

async function loadDemoProfile() {
  // 1. localStorage prüfen (gespeichertes Profil)
  const saved = _loadSavedProfile();
  if (saved) return _applyProfile(saved, 'Persist');

  // 2. Fallback: Demo-JSON laden
  return _loadDemoFromFetch();
}

async function _loadDemoFromFetch() {
  try {
    const res = await fetch(DEMO_PATH, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const profile = await res.json();
    return _applyProfile(profile, 'Demo');
  } catch (err) {
    console.warn('[Demo] Konnte Profil nicht laden:', err.message);
    toast('Demo nicht geladen – Live Server starten');
    return null;
  }
}


async function reloadDemoProfile() {
  _clearSavedProfile();
  toast('Demo zurückgesetzt …');
  await _loadDemoFromFetch();
}

