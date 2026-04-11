/**
 * gates.js — Pflicht-Gates für Anamnese und Trainervereinbarung
 *
 * Nach dem DSGVO-Consent-Gate (consent.js) ist dies die zweite Pflicht-Stufe:
 * Die Anamnese muss bestätigt sein, bevor Trainingspläne angezeigt werden.
 * Ist sie nicht bestätigt, sperren wir Jahresplan/Trainingsplan/Fortschritt
 * über eine CSS-Klasse am <body> und fangen Tab-Wechsel in switchTab() ab.
 * Im Cockpit erscheint ein rotes Banner mit Direkt-Button zum Anamnese-Modal.
 *
 * Die Trainervereinbarung (Trainer-Rolle) wird nur per Banner angemahnt,
 * nicht mit Tab-Sperre — Multi-Athleten-Verwaltung ist noch Bau-Etappe.
 *
 * Einzige Ausnahme: state.demoMode !== null → die RAM-only Demo-Vorschau
 * darf immer durch, weil sie nicht persistent ist.
 *
 * Achtung: Leere Profile (id startet mit 'empty-') sind NICHT vom Gate
 * ausgenommen. Das war frueher so gedacht, war aber ein Loch: Nach
 * Cache-/localStorage-Loeschung faellt loadDemoProfile() auf ein leeres
 * Profil zurueck, und ohne Gate waere die Trainingsfunktion sofort
 * wieder nutzbar, obwohl Anamnese und Vereinbarung gerade verloren
 * gegangen sind. Der cpDemoBanner ("Eigenes Profil erstellen") und der
 * Anamnese-Banner koexistieren im Cockpit — inhaltlich nicht im Konflikt.
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
 * Setzt body-Klassen + Banner-Sichtbarkeit entsprechend dem aktuellen
 * Gate-Status. Wird nach jedem relevanten State-Wechsel gerufen:
 * Profil-Load, Anamnese-Save, Agreement-Save, Rollen-Wechsel, Demo-Toggle.
 */
function applyGates() {
  const profile = state.profile;
  const anamGated = isAnamnesisGated(profile);
  const agrGated = isAgreementGated(profile);

  document.body.classList.toggle('anamnesis-required', anamGated);
  document.body.classList.toggle('agreement-required', agrGated);

  const anamBanner = document.getElementById('cpAnamnesisBanner');
  if (anamBanner) anamBanner.style.display = anamGated ? '' : 'none';
  const agrBanner = document.getElementById('cpAgreementBanner');
  if (agrBanner) agrBanner.style.display = agrGated ? '' : 'none';

  // Wenn der Nutzer aktuell auf einem gesperrten Tab steht, sofort auf
  // Cockpit umleiten. Passiert z. B. bei Hard Reload mit letztem activeTab
  // auf 'trainingsplan', oder wenn die Anamnese gerade widerrufen wurde.
  if (anamGated && GATED_TABS.has(state.activeTab)) {
    import('./tabs.js').then(({ switchTab }) => switchTab('cockpit'));
  }
}

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
