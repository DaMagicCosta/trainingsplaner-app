/**
 * agreement-edit.js — Trainer-Vereinbarung bestätigen, widerrufen, dokumentieren
 *
 * Etappe B des Audit-Folge-Backlogs: Die Trainer-Vereinbarung war read-only
 * Demo-Text mit zwei Toast-Stubs ("Erneut bestätigen", "Widerrufen"). Jetzt
 * gibt es einen echten Bestätigungs-Mechanismus mit Pflicht-Checkbox, einen
 * Widerrufs-Mechanismus mit Bestätigungs-Confirm und eine vollständige
 * Verlauf-Dokumentation.
 *
 * Datenmodell: state.profile.agreement = {
 *   version: 1,
 *   confirmedAt: ISO | null,        // letzter confirm-Timestamp
 *   revokedAt: ISO | null,          // letzter revoke-Timestamp
 *   agreementVersion: string         // Versions-Hash der Vereinbarungs-Texte
 * }
 *
 * state.profile.agreementHistory = [
 *   { type: 'confirm' | 'revoke', timestamp, agreementVersion }
 * ]
 *
 * Status (abgeleitet):
 * - 'pending'   = !confirmedAt
 * - 'confirmed' = confirmedAt && (!revokedAt || confirmedAt > revokedAt)
 * - 'revoked'   = revokedAt && revokedAt >= confirmedAt
 *
 * Belegspur: Notizen/2026-04-10_rechtsaudit-umsetzung.md (Nachtrag 5)
 */

import { state, _saveProfile } from '../state.js';
import { toast, escapeHtml } from '../utils.js';
import { openModal, closeModal } from './profile-edit.js';

export const AGREEMENT_DATA_VERSION = 1;
export const AGREEMENT_TEXT_VERSION = '2026-04-10';

/**
 * Liefert ein leeres, nicht-bestätigtes Vereinbarungs-Objekt.
 */
export function getDefaultAgreement() {
  return {
    version: AGREEMENT_DATA_VERSION,
    confirmedAt: null,
    revokedAt: null,
    agreementVersion: AGREEMENT_TEXT_VERSION
  };
}

/**
 * Berechnet den aktuellen Status der Vereinbarung.
 */
export function getAgreementStatus(profile) {
  const a = profile?.agreement;
  if (!a || !a.confirmedAt) return 'pending';
  if (a.revokedAt) {
    const cAt = new Date(a.confirmedAt).getTime();
    const rAt = new Date(a.revokedAt).getTime();
    if (rAt >= cAt) return 'revoked';
  }
  return 'confirmed';
}

/**
 * Formatiert ein ISO-Datum (DD.MM.YYYY um HH:MM Uhr).
 */
function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} um ${hh}:${min} Uhr`;
  } catch (e) {
    return iso;
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch (e) {
    return iso;
  }
}

/**
 * Rendert die Vereinbarungs-Sektion auf Basis von profile.agreement.
 */
export function renderAgreement(profile) {
  if (!profile) return;

  const status = getAgreementStatus(profile);
  const a = profile.agreement || null;

  const badge = document.getElementById('agrStatusBadge');
  const validity = document.getElementById('agrValidity');
  const confirmBox = document.getElementById('agrConfirmBox');
  const confirmDate = document.getElementById('agrConfirmDate');
  const revokedBox = document.getElementById('agrRevokedBox');
  const revokeDate = document.getElementById('agrRevokeDate');
  const reconfirmLabel = document.getElementById('vereinbarungReconfirmBtnLabel');
  const revokeBtn = document.getElementById('vereinbarungRevokeBtn');

  if (status === 'pending') {
    if (badge) {
      badge.className = 'info-pill info-pill-muted';
      badge.textContent = '○ Noch nicht bestätigt';
    }
    if (validity) validity.textContent = '— · bitte zunächst bestätigen';
    if (confirmBox) confirmBox.style.display = 'none';
    if (revokedBox) revokedBox.style.display = 'none';
    if (reconfirmLabel) reconfirmLabel.textContent = 'Vereinbarung bestätigen';
    if (revokeBtn) revokeBtn.style.display = 'none';
  } else if (status === 'confirmed') {
    if (badge) {
      badge.className = 'info-pill info-pill-success';
      badge.textContent = '● Bestätigt am ' + formatDate(a.confirmedAt);
    }
    if (validity) validity.textContent = 'Unbefristet · jederzeit widerrufbar';
    if (confirmBox) {
      confirmBox.style.display = '';
      if (confirmDate) confirmDate.textContent = formatDateTime(a.confirmedAt);
    }
    if (revokedBox) revokedBox.style.display = 'none';
    if (reconfirmLabel) reconfirmLabel.textContent = 'Erneut bestätigen';
    if (revokeBtn) revokeBtn.style.display = '';
  } else { // revoked
    if (badge) {
      badge.className = 'info-pill info-pill-danger';
      badge.textContent = '⊘ Widerrufen am ' + formatDate(a.revokedAt);
    }
    if (validity) validity.textContent = 'Aktuell ohne aktive Vereinbarung — bitte erneut bestätigen';
    if (confirmBox) confirmBox.style.display = 'none';
    if (revokedBox) {
      revokedBox.style.display = '';
      if (revokeDate) revokeDate.textContent = formatDateTime(a.revokedAt);
    }
    if (reconfirmLabel) reconfirmLabel.textContent = 'Erneut bestätigen';
    if (revokeBtn) revokeBtn.style.display = 'none';
  }

  console.log('[Agreement] gerendert · Status:', status);
}

/**
 * Öffnet das Bestätigungs-Modal.
 */
export function openAgreementConfirmModal() {
  const cb = document.getElementById('agrConfirmCheck');
  const btn = document.getElementById('agrConfirmBtn');
  if (cb) cb.checked = false;
  if (btn) btn.disabled = true;
  openModal('agreementConfirmModal');
}

/**
 * Schreibt einen confirm-Eintrag in History und setzt agreement.confirmedAt.
 * Wird vom Bestätigen-Button im Modal aufgerufen.
 */
export function confirmAgreement() {
  if (!state.profile) {
    toast('Kein Profil geladen');
    return;
  }
  const cb = document.getElementById('agrConfirmCheck');
  if (!cb || !cb.checked) {
    toast('Bitte die Bestätigungs-Checkbox aktivieren');
    return;
  }

  const now = new Date().toISOString();

  // Defensive Init
  if (!state.profile.agreement || !state.profile.agreement.confirmedAt) {
    state.profile.agreement = getDefaultAgreement();
  }
  if (!Array.isArray(state.profile.agreementHistory)) {
    state.profile.agreementHistory = [];
  }

  // History-Eintrag
  state.profile.agreementHistory.push({
    type: 'confirm',
    timestamp: now,
    agreementVersion: AGREEMENT_TEXT_VERSION
  });

  // Live-Stand
  state.profile.agreement = {
    version: AGREEMENT_DATA_VERSION,
    confirmedAt: now,
    revokedAt: null,
    agreementVersion: AGREEMENT_TEXT_VERSION
  };

  _saveProfile();
  renderAgreement(state.profile);
  closeModal('agreementConfirmModal');
  // Pflicht-Gate neu auswerten: Vereinbarungs-Banner ausblenden
  import('../gates.js').then(({ applyGates }) => applyGates());
  toast('✓ Trainer-Vereinbarung bestätigt');
}

/**
 * Widerruft die Vereinbarung. Zweistufiger Browser-Confirm.
 * Setzt revokedAt und schreibt einen revoke-Eintrag in die History.
 */
export function revokeAgreement() {
  if (!state.profile) {
    toast('Kein Profil geladen');
    return;
  }
  const status = getAgreementStatus(state.profile);
  if (status !== 'confirmed') {
    toast('Vereinbarung ist aktuell nicht bestätigt');
    return;
  }

  const ok = confirm(
    'Trainer-Vereinbarung wirklich widerrufen?\n\n' +
    'Die Vereinbarung wird auf "widerrufen" gesetzt. Du kannst den ' +
    'Trainer-Modus weiterhin nutzen, bekommst aber einen Hinweis-Banner ' +
    'angezeigt, bis du die Vereinbarung erneut bestätigst.\n\n' +
    'Der Widerruf wird mit Datum und Uhrzeit dokumentiert.'
  );
  if (!ok) return;

  const now = new Date().toISOString();

  if (!Array.isArray(state.profile.agreementHistory)) {
    state.profile.agreementHistory = [];
  }
  state.profile.agreementHistory.push({
    type: 'revoke',
    timestamp: now,
    agreementVersion: state.profile.agreement?.agreementVersion || AGREEMENT_TEXT_VERSION
  });

  state.profile.agreement = {
    ...(state.profile.agreement || getDefaultAgreement()),
    revokedAt: now
  };

  _saveProfile();
  renderAgreement(state.profile);
  // Pflicht-Gate neu auswerten: Widerruf bringt Banner zurück
  import('../gates.js').then(({ applyGates }) => applyGates());
  toast('✓ Vereinbarung widerrufen');
}

/**
 * Rendert die Verlauf-Liste in das History-Modal.
 */
export function renderAgreementHistory() {
  const container = document.getElementById('agreementHistoryList');
  if (!container) return;

  const history = state.profile?.agreementHistory || [];

  if (!history.length) {
    container.innerHTML = '<div class="info-form-a info-form-a-empty" style="padding:16px;">Noch keine Vereinbarungs-Aktionen — die erste Bestätigung erfolgt über den Button "Vereinbarung bestätigen".</div>';
    return;
  }

  // Absteigend sortieren (neueste oben)
  const sorted = [...history].sort((a, b) => {
    return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
  });

  const html = sorted.map((entry) => {
    const isConfirm = entry.type === 'confirm';
    const icon = isConfirm ? '✓' : '⊘';
    const label = isConfirm ? 'Bestätigt' : 'Widerrufen';
    const pillClass = isConfirm ? 'info-pill-success' : 'info-pill-danger';
    const date = formatDateTime(entry.timestamp);
    return `
      <div class="anam-history-entry" style="padding:12px 16px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="info-pill ${pillClass}">${icon} ${escapeHtml(label)}</span>
          <strong style="font-size:.92rem;">${escapeHtml(date)}</strong>
          <span style="margin-left:auto;font-size:.78rem;color:var(--text-3);font-family:var(--font-mono);">v${escapeHtml(entry.agreementVersion || '—')}</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

/**
 * Öffnet das History-Modal.
 */
export function openAgreementHistoryModal() {
  renderAgreementHistory();
  openModal('agreementHistoryModal');
}
