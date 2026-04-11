/**
 * app.js — Einstiegspunkt Trainingsplaner v2
 * Importiert alle Module und orchestriert die Initialisierung.
 */

// ── Basis ──
import { state, _saveProfile, _cleanupLegacyKeys } from './state.js';
import { toast } from './utils.js';
import { initConsent, renderConsentInfo } from './consent.js';
import { applyGates } from './gates.js';

// ── UI-Infrastruktur ──
import { applyTheme } from './themes.js';
import { switchTab } from './tabs.js';
import { setRole } from './roles.js';
import './command-palette.js';
import './keyboard.js';

// ── Features ──
import { buildPlanBalance } from './features/plan-balance.js';
import { openProfileEditModal } from './features/profile-edit.js';
import './features/generator.js?v=20260409g';

// ── Pages ──
import { renderCockpit } from './pages/cockpit.js';
import { renderJahresplan } from './pages/jahresplan.js';
import { renderTrainingsplan } from './pages/trainingsplan.js?v=20260411a';
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
// v1-Legacy-Schlüssel aufräumen, bevor der Nutzer die Datenschutzerklärung
// liest — dort sind nur tpv2_*-Keys aufgelistet, alte Reste würden die
// Belegspur verzerren.
_cleanupLegacyKeys();

// Theme sofort anwenden, damit das Welcome-Modal im richtigen Look erscheint.
applyTheme(state.theme);

// Consent-Gate: blockiert alles weitere, bis der Nutzer akzeptiert hat.
// Bei erneutem Aufruf mit gültigem Consent ist initConsent ein No-Op.
(async () => {
  await initConsent();
  renderConsentInfo();

  switchTab(state.activeTab);
  setRole(state.role);
  // Initial-Toasts von applyTheme/setRole unterdrücken
  setTimeout(() => document.getElementById('toast').classList.remove('show'), 100);

  // Profil laden (oder leeres Profil verwenden, wenn keins gespeichert ist)
  loadDemoProfile().then(() => {
  // Banner-Logik: nur zeigen, wenn aktuelles Profil leer ist (id beginnt mit "empty-")
  const isEmpty = !!(state.profile && typeof state.profile.id === 'string' && state.profile.id.startsWith('empty-'));
  const dismissed = sessionStorage.getItem('tpv2_demo_banner_dismissed');
  const banner = document.getElementById('cpDemoBanner');
  const bannerText = document.getElementById('cpDemoBannerText');
  if (banner && isEmpty && !dismissed) {
    banner.style.display = '';
    if (bannerText) {
      bannerText.innerHTML = '<strong>Leeres Profil</strong> — leg los, indem du dein eigenes Profil erstellst, oder importiere ein Demo-Profil zum Ausprobieren.';
    }
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

  // Onboarding-Kombi-Banner (Profil + Anamnese + Vereinbarung) rendern.
  // Die Schritt-Buttons hoeren ueber Event-Delegation in gates.js, daher
  // keine separaten Handler hier noetig.
  applyGates();
  });
})();
