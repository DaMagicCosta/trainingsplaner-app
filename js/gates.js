/**
 * gates.js — Pflicht-Gates und Onboarding-Kombi-Banner
 *
 * Nach dem DSGVO-Consent-Gate (consent.js) ist dies die zweite Pflicht-Stufe:
 * Die Anamnese muss bestätigt sein, bevor Trainingspläne angezeigt werden.
 * Ist sie nicht bestätigt, sperren wir Jahresplan/Trainingsplan/Fortschritt
 * über eine CSS-Klasse am <body> und fangen Tab-Wechsel in switchTab() ab.
 *
 * Der Onboarding-Banner (#cpOnboardingBanner) zeigt alle offenen Schritte
 * als nummerierte Checkliste im Cockpit. Je nach Profil-Zustand sind 0–3
 * Schritte offen:
 *   1. Profil-Stammdaten anlegen (Empfohlen, keine Tab-Sperre)
 *   2. Gesundheits-Anamnese bestätigen (Pflicht, sperrt Trainings-Tabs)
 *   3. Trainervereinbarung bestätigen (nur Trainer-Modus, Empfohlen)
 * Sobald alle Schritte erledigt sind, verschwindet der Banner komplett.
 *
 * Einzige Gate-Ausnahme: state.demoMode !== null → die RAM-only Demo-
 * Vorschau darf immer durch, weil sie nicht persistent ist. Leere Profile
 * (id startet mit 'empty-') sind NICHT vom Gate ausgenommen — das war
 * frueher so gedacht, war aber ein Loch: Nach Cache-/localStorage-
 * Loeschung faellt loadDemoProfile() auf ein leeres Profil zurueck, und
 * ohne Gate waere die Trainingsfunktion sofort wieder nutzbar, obwohl
 * Anamnese gerade verloren gegangen ist.
 */

import { state } from './state.js';

export { isAnamnesisGated, isAgreementGated, applyGates, enforceTabGate };

const GATED_TABS = new Set(['jahresplan', 'trainingsplan', 'fortschritt']);

// Inline-Checks, um statische Abhaengigkeiten zu features/* und damit
// zirkulaere Auswertungs-Reihenfolge zu vermeiden. Die Datenstruktur ist
// in anamnese-edit.js / agreement-edit.js definiert; hier nur lesender
// Zugriff auf die confirmedAt/revokedAt-Felder.
function _hasConfirmedAnamnesis(profile) {
  return !!(profile && profile.anamnesis && profile.anamnesis.confirmedAt);
}

function _agreementConfirmed(profile) {
  const a = profile?.agreement;
  if (!a || !a.confirmedAt) return false;
  if (a.revokedAt) {
    const cAt = new Date(a.confirmedAt).getTime();
    const rAt = new Date(a.revokedAt).getTime();
    if (rAt >= cAt) return false;
  }
  return true;
}

/**
 * Greift das Anamnese-Gate gerade? Demo ausgenommen; leere Profile
 * werden absichtlich NICHT ausgenommen — siehe Header-Kommentar.
 */
function isAnamnesisGated(profile) {
  if (state.demoMode !== null) return false;
  if (!profile) return false;
  return !_hasConfirmedAnamnesis(profile);
}

/**
 * Greift das Vereinbarungs-Gate? Nur im Trainer-Modus, sonst nie. Kein
 * Tab-Lock, nur Banner-Signal.
 */
function isAgreementGated(profile) {
  if (state.demoMode !== null) return false;
  if (state.role !== 'trainer') return false;
  if (!profile) return false;
  return !_agreementConfirmed(profile);
}

/**
 * Baut die Liste der offenen Onboarding-Schritte.
 * Reihenfolge: Profil zuerst (natuerlicher Flow), dann Anamnese (Pflicht),
 * dann Vereinbarung (nur im Trainer-Modus).
 */
function _getPendingSteps(profile) {
  if (!profile || state.demoMode !== null) return [];
  const steps = [];

  // 1) Profil-Stammdaten — empfohlen, keine Tab-Sperre
  const hasEmptyId = typeof profile.id === 'string' && profile.id.startsWith('empty-');
  const hasName = typeof profile.name === 'string' && profile.name.trim().length > 0;
  if (hasEmptyId && !hasName) {
    steps.push({
      action: 'profile',
      label: 'Profil-Stammdaten anlegen',
      desc: 'Name, Alter, Gewicht, Trainingsziel — wichtig fuer Gewichtsvorschlaege und Plan-Generierung.',
      btnText: 'Profil anlegen',
      required: false
    });
  }

  // 2) Anamnese — Pflicht, sperrt Jahresplan/Trainingsplan/Fortschritt
  if (!_hasConfirmedAnamnesis(profile)) {
    steps.push({
      action: 'anamnesis',
      label: 'Gesundheits-Anamnese bestaetigen',
      desc: 'Pflichtangaben zu Vorerkrankungen und Belastbarkeit. Jahresplan, Trainingsplan und Fortschritt bleiben gesperrt bis zur Bestaetigung.',
      btnText: 'Anamnese ausfuellen',
      required: true
    });
  }

  // 3) Trainervereinbarung — nur im Trainer-Modus, empfohlen
  if (state.role === 'trainer' && !_agreementConfirmed(profile)) {
    steps.push({
      action: 'agreement',
      label: 'Trainervereinbarung bestaetigen',
      desc: 'Regelt Haftung, Datennutzung und Weisungsrecht zwischen Trainer und Athlet.',
      btnText: 'Vereinbarung bestaetigen',
      required: false
    });
  }

  return steps;
}

function _renderOnboardingBanner(steps) {
  const banner = document.getElementById('cpOnboardingBanner');
  const list = document.getElementById('cpOnboardingSteps');
  if (!banner || !list) return;

  if (steps.length === 0) {
    banner.style.display = 'none';
    list.innerHTML = '';
    return;
  }

  list.innerHTML = steps.map((step, idx) => {
    const num = idx + 1;
    const stepCls = 'cp-ob-step' + (step.required ? ' cp-ob-step--required' : '');
    const badge = step.required
      ? '<span class="cp-ob-req">Pflicht</span>'
      : '<span class="cp-ob-opt">Empfohlen</span>';
    return `
      <li class="${stepCls}">
        <div class="cp-ob-num">${num}</div>
        <div class="cp-ob-content">
          <div class="cp-ob-label">${step.label} ${badge}</div>
          <div class="cp-ob-desc">${step.desc}</div>
        </div>
        <button class="cp-ob-btn" data-ob-action="${step.action}" type="button">${step.btnText}</button>
      </li>`;
  }).join('');
  banner.style.display = '';
}

/**
 * Setzt body-Klassen + Banner-Sichtbarkeit entsprechend dem aktuellen
 * Gate-Status. Wird nach jedem relevanten State-Wechsel gerufen:
 * Profil-Load, Anamnese-Save, Agreement-Save, Rollen-Wechsel, Demo-Toggle.
 */
function applyGates() {
  const profile = state.profile;
  const anamGated = isAnamnesisGated(profile);
  const steps = _getPendingSteps(profile);

  document.body.classList.toggle('anamnesis-required', anamGated);
  document.body.classList.toggle('onboarding-pending', steps.length > 0);

  _renderOnboardingBanner(steps);

  // Wenn der Nutzer aktuell auf einem gesperrten Tab steht, sofort auf
  // Cockpit umleiten. Passiert z. B. bei Hard Reload mit letztem activeTab
  // auf 'trainingsplan', oder wenn die Anamnese gerade widerrufen wurde.
  if (anamGated && GATED_TABS.has(state.activeTab)) {
    import('./tabs.js').then(({ switchTab }) => switchTab('cockpit'));
  }
}

// Event-Delegation fuer die Onboarding-Schritt-Buttons. Einmal beim Modul-
// Load registriert, fangen alle kuenftigen Klicks auf data-ob-action-Knoten
// ab — egal wann gates.js den Banner neu rendert.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-ob-action]');
  if (!btn) return;
  const action = btn.dataset.obAction;
  if (action === 'profile') {
    import('./features/profile-edit.js').then(({ openProfileEditModal }) => openProfileEditModal('self'));
  } else if (action === 'anamnesis') {
    import('./features/anamnese-edit.js').then(({ openAnamneseEditModal }) => openAnamneseEditModal());
  } else if (action === 'agreement') {
    import('./features/agreement-edit.js').then(({ openAgreementConfirmModal }) => openAgreementConfirmModal());
  }
});

/**
 * Vor jedem Tab-Wechsel aufrufen. Gibt true zurück, wenn der Wechsel
 * erlaubt ist. Gibt false zurück und zeigt einen Toast, wenn das Gate
 * greift — der Aufrufer soll den Wechsel dann abbrechen.
 */
function enforceTabGate(tabName) {
  if (!GATED_TABS.has(tabName)) return true;
  if (!isAnamnesisGated(state.profile)) return true;
  // Lazy-Import, um Zirkel mit utils.js → tabs.js zu vermeiden
  import('./utils.js').then(({ toast }) => {
    toast('Bitte zuerst die Gesundheits-Anamnese ausfüllen');
  });
  return false;
}
