/**
 * app.js — Einstiegspunkt Trainingsplaner v2
 * Importiert alle Module und orchestriert die Initialisierung.
 */

// ── Basis ──
import { state, _saveProfile } from './state.js';
import { toast } from './utils.js';

// ── UI-Infrastruktur ──
import { applyTheme } from './themes.js';
import { switchTab } from './tabs.js';
import { setRole } from './roles.js';
import './command-palette.js';
import './keyboard.js';

// ── Features ──
import { buildPlanBalance } from './features/plan-balance.js';
import { openProfileEditModal } from './features/profile-edit.js';
import './features/generator.js?v=20260409d';

// ── Pages ──
import { renderCockpit } from './pages/cockpit.js';
import { renderJahresplan } from './pages/jahresplan.js';
import { renderTrainingsplan } from './pages/trainingsplan.js';
import { renderFortschritt } from './pages/fortschritt.js';
import { renderInfo } from './pages/info.js';
import './pages/lexikon.js';

// ── Demo & Lifecycle ──
import { DEMO_PATH, loadDemoProfile, reloadDemoProfile } from './demo-loader.js';
import { startNextEinheit } from './features/log-session.js';
import { exportProfileJson } from './pages/info.js';

// ── Event-Handler-Setup (nach allen Modulen) ──
import './init-handlers.js';

// ── Isolierte Features ──
import './features/bug-report.js';
import './splash.js';

// ══════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════
applyTheme(state.theme);
switchTab(state.activeTab);
setRole(state.role);
// Initial-Toasts von applyTheme/setRole unterdrücken
setTimeout(() => document.getElementById('toast').classList.remove('show'), 100);

// Demo-Profil im Hintergrund laden
loadDemoProfile().then(() => {
  // Demo-Banner zeigen wenn kein eigenes Profil gespeichert ist
  const hasSaved = !!localStorage.getItem('tpv2_profile_data');
  const dismissed = sessionStorage.getItem('tpv2_demo_banner_dismissed');
  const banner = document.getElementById('cpDemoBanner');
  if (banner && !hasSaved && !dismissed) {
    banner.style.display = '';
  }
  // "Eigenes Profil erstellen" → leeres Profil-Edit-Modal
  const createBtn = document.getElementById('cpDemoCreate');
  if (createBtn) createBtn.addEventListener('click', () => {
    if (state.profile) {
      state.profile.name = '';
      state.profile.nachname = '';
      state.profile.alter = '';
      state.profile.gewicht = '';
      state.profile.groesse = '';
      state.profile.hfmax = '';
      state.profile.goal = 'hypertrophie';
      state.profile.tage = [];
      state.profile.trainingLocation = '';
      state.profile.equipment = {};
      state.profile.sessions = [];
      state.profile.plans = {};
      state.profile.periodization = null;
      state.profile.athleteRegenWeeks = [];
    }

    state._juliaProfile = null;
    state._selfProfile = null;
    state._savedThemeBeforeAthlete = null;
    state.activeProfile = 'self';
    state.demoAthletes = {};

    const juliaSwitch = document.querySelector('[data-athlete-switch="lisa"]');
    if (juliaSwitch) juliaSwitch.remove();

    const athletesList = document.getElementById('infoAthletesList');
    if (athletesList) athletesList.innerHTML = '';

    document.querySelectorAll('.role-dropdown [data-athlete-switch]').forEach(btn => {
      const isActive = btn.dataset.athleteSwitch === 'self';
      btn.querySelector('.radio')?.classList.toggle('active', isActive);
    });

    if (state.profile) {
      _saveProfile();
      renderCockpit(state.profile);
      renderJahresplan(state.profile);
      renderTrainingsplan(state.profile);
      renderFortschritt(state.profile);
      renderInfo(state.profile);
      buildPlanBalance(state.profile);
    }

    if (banner) banner.style.display = 'none';
    openProfileEditModal('self');
  });

  const dismissBtn = document.getElementById('cpDemoDismiss');
  if (dismissBtn) dismissBtn.addEventListener('click', () => {
    if (banner) banner.style.display = 'none';
    sessionStorage.setItem('tpv2_demo_banner_dismissed', '1');
  });
});
