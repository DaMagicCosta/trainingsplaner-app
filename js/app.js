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

  // Profil laden (oder leeres Profil verwenden, wenn keins gespeichert ist).
  // Der frueher hier angesiedelte cpDemoBanner ("Leeres Profil — leg los")
  // ist entfallen — seine Funktion ist seit dem Onboarding-Kombi-Banner
  // (Schritt 1: Profil anlegen) redundant.
  loadDemoProfile().then(() => {
  // Onboarding-Kombi-Banner (Profil + Anamnese + Vereinbarung) rendern.
  // Die Schritt-Buttons hoeren ueber Event-Delegation in gates.js, daher
  // keine separaten Handler hier noetig.
  applyGates();
  });
})();
