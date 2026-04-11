/**
 * anamnese-edit.js — Anamnesebogen bearbeiten und rendern
 *
 * Etappe A des Audit-Folge-Backlogs (Risiko 2): Die Anamnese ist nicht
 * mehr read-only Demo, sondern echte editierbare Daten. Damit ist die
 * AGB-Klausel "Anamnesebogen muss wahrheitsgemäß ausgefüllt werden"
 * substantiell erfüllbar.
 *
 * Datenmodell: state.profile.anamnesis = {
 *   version: 1,
 *   confirmedAt: ISO-Timestamp | null,
 *   general:           'sehr_gut' | 'gut' | 'befriedigend' | 'eingeschraenkt',
 *   clearance:         'nicht_benoetigt' | 'vorhanden' | 'erforderlich_offen',
 *   conditions:        ['herz_kreislauf', ...],
 *   otherConditions:   string,
 *   currentPain:       'nein' | 'ja',
 *   painDetails:       string,
 *   surgery:           'nein' | 'ja',
 *   surgeryDetails:    string,
 *   medication:        'nein' | 'ja',
 *   medicationDetails: string,
 *   experience:        'anfaenger' | 'beginner' | 'erfahren' | 'fortgeschritten' | 'elite',
 *   restricted:        string
 * }
 *
 * confirmedAt = null bedeutet "noch nicht ausgefüllt".
 *
 * Belegspur: Notizen/2026-04-10_rechtsaudit-umsetzung.md (Nachtrag 3)
 */

import { state, _saveProfile } from '../state.js';
import { toast, escapeHtml } from '../utils.js';
import { openModal, closeModal } from './profile-edit.js';

export const ANAMNESIS_VERSION = 1;

// Label-Maps für die Read-only-Anzeige
const LABELS_GENERAL = {
  sehr_gut:       'Sehr gut',
  gut:            'Gut',
  befriedigend:   'Befriedigend',
  eingeschraenkt: 'Eingeschränkt'
};
const LABELS_CLEARANCE = {
  nicht_benoetigt:    'Nicht benötigt',
  vorhanden:          'Vorhanden',
  erforderlich_offen: 'Erforderlich, aber noch nicht eingeholt'
};
const LABELS_CONDITION = {
  herz_kreislauf: 'Herz-Kreislauf',
  bluthochdruck:  'Bluthochdruck',
  diabetes:       'Diabetes',
  asthma:         'Asthma / Atemwege',
  gelenke:        'Gelenkprobleme',
  ruecken:        'Rückenprobleme',
  bandscheibe:    'Bandscheibenvorfall',
  schilddruese:   'Schilddrüse',
  epilepsie:      'Epilepsie',
  osteoporose:    'Osteoporose'
};
const LABELS_YESNO = { ja: 'Ja', nein: 'Nein' };
const LABELS_EXPERIENCE = {
  anfaenger:       'Anfänger (< 6 Monate)',
  beginner:        'Beginner (6 Monate – 2 Jahre)',
  erfahren:        'Erfahren (2 – 5 Jahre)',
  fortgeschritten: 'Fortgeschritten (> 5 Jahre)',
  elite:           'Elite / Wettkampf'
};

/**
 * Liefert ein Default-Anamnese-Objekt (alles leer, noch nicht bestätigt).
 */
export function getDefaultAnamnesis() {
  return {
    version: ANAMNESIS_VERSION,
    confirmedAt: null,
    general: 'gut',
    clearance: 'nicht_benoetigt',
    conditions: [],
    otherConditions: '',
    currentPain: 'nein',
    painDetails: '',
    surgery: 'nein',
    surgeryDetails: '',
    medication: 'nein',
    medicationDetails: '',
    experience: 'beginner',
    restricted: ''
  };
}

/**
 * Hat der Nutzer die Anamnese bereits ausgefüllt und bestätigt?
 */
export function hasConfirmedAnamnesis(profile) {
  return !!(profile && profile.anamnesis && profile.anamnesis.confirmedAt);
}

/**
 * Formatiert ein ISO-Datum für die Anzeige.
 */
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
 * Berechnet das "Gültig bis"-Datum (1 Jahr nach Bestätigung).
 */
function calcValidUntil(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
  } catch (e) {
    return null;
  }
}

/**
 * Rendert die Anamnese-Sektion auf Basis von profile.anamnesis.
 * Wenn keine Daten vorhanden sind, werden Default-Platzhalter angezeigt
 * und der Status zeigt "Noch nicht ausgefüllt".
 */
export function renderAnamnese(profile) {
  if (!profile) return;

  const a = profile.anamnesis || null;
  const filled = !!(a && a.confirmedAt);

  // Status-Zeile
  const badge = document.getElementById('anamStatusBadge');
  const valid = document.getElementById('anamValidUntil');
  if (badge) {
    if (filled) {
      badge.className = 'info-pill info-pill-success';
      badge.innerHTML = '● Bestätigt am ' + formatDate(a.confirmedAt);
    } else {
      badge.className = 'info-pill info-pill-muted';
      badge.textContent = '○ Noch nicht ausgefüllt';
    }
  }
  if (valid) {
    if (filled) {
      const until = calcValidUntil(a.confirmedAt);
      valid.textContent = formatDate(until) + ' · bei Änderung des Gesundheitszustands früher aktualisieren';
    } else {
      valid.textContent = '— · bitte zunächst ausfüllen';
    }
  }

  // Helper: Feld setzen
  const set = (id, value, isEmpty) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    el.classList.toggle('info-form-a-empty', !!isEmpty);
  };

  if (!filled) {
    // Alle Antworten leer
    ['anamGeneral','anamClearance','anamConditions','anamOtherConditions',
     'anamCurrentPain','anamPainDetails','anamSurgery','anamSurgeryDetails',
     'anamMedication','anamMedicationDetails','anamExperience','anamRestricted'
    ].forEach(id => set(id, '— noch nicht ausgefüllt', true));

    const cb = document.getElementById('anamConfirmBox');
    if (cb) cb.style.display = 'none';
    return;
  }

  // Sektion 1
  set('anamGeneral',   LABELS_GENERAL[a.general] || '—', !a.general);
  set('anamClearance', LABELS_CLEARANCE[a.clearance] || '—', !a.clearance);

  // Sektion 2
  const condEl = document.getElementById('anamConditions');
  if (condEl) {
    if (Array.isArray(a.conditions) && a.conditions.length) {
      const chips = a.conditions
        .map(c => `<span class="info-chip-muted">${escapeHtml(LABELS_CONDITION[c] || c)}</span>`)
        .join(' ');
      condEl.innerHTML = chips;
      condEl.classList.remove('info-form-a-empty');
    } else {
      condEl.innerHTML = '<span style="color:var(--success);font-size:12px;">→ Keine der aufgelisteten</span>';
      condEl.classList.remove('info-form-a-empty');
    }
  }
  set('anamOtherConditions', a.otherConditions || 'Keine Angabe', !a.otherConditions);

  // Sektion 3
  set('anamCurrentPain',    LABELS_YESNO[a.currentPain] || '—', false);
  set('anamPainDetails',    a.painDetails || '—', !a.painDetails);
  set('anamSurgery',        LABELS_YESNO[a.surgery] || '—', false);
  set('anamSurgeryDetails', a.surgeryDetails || '—', !a.surgeryDetails);

  // Sektion 4
  set('anamMedication',        LABELS_YESNO[a.medication] || '—', false);
  set('anamMedicationDetails', a.medicationDetails || '—', !a.medicationDetails);

  // Sektion 5
  set('anamExperience', LABELS_EXPERIENCE[a.experience] || '—', !a.experience);
  set('anamRestricted', a.restricted || 'Keine bekannten Einschränkungen', !a.restricted);

  // Bestätigungs-Box
  const cb = document.getElementById('anamConfirmBox');
  const cbDate = document.getElementById('anamConfirmDate');
  if (cb && cbDate) {
    cb.style.display = '';
    cbDate.textContent = formatDate(a.confirmedAt);
  }

  console.log('[Anamnese] gerendert · bestätigt am', a.confirmedAt);
}

/**
 * Öffnet das Anamnese-Edit-Modal und befüllt die Form mit aktuellen Werten.
 */
export function openAnamneseEditModal() {
  const modal = document.getElementById('anamneseEditModal');
  if (!modal) return;

  // Migration: wenn kein anamnesis-Feld, Default verwenden
  if (state.profile && !state.profile.anamnesis) {
    state.profile.anamnesis = getDefaultAnamnesis();
  }
  const a = state.profile?.anamnesis || getDefaultAnamnesis();

  // Selects
  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  };
  setVal('aemGeneral',           a.general);
  setVal('aemClearance',         a.clearance);
  setVal('aemOtherConditions',   a.otherConditions);
  setVal('aemCurrentPain',       a.currentPain);
  setVal('aemPainDetails',       a.painDetails);
  setVal('aemSurgery',           a.surgery);
  setVal('aemSurgeryDetails',    a.surgeryDetails);
  setVal('aemMedication',        a.medication);
  setVal('aemMedicationDetails', a.medicationDetails);
  setVal('aemExperience',        a.experience);
  setVal('aemRestricted',        a.restricted);

  // Conditions-Chips toggeln
  const conditions = Array.isArray(a.conditions) ? a.conditions : [];
  document.querySelectorAll('#aemConditionsChips .tp-chip').forEach(chip => {
    chip.classList.toggle('active', conditions.includes(chip.dataset.condition));
  });

  // Confirm-Checkbox + Speichern-Button reset
  const confirmCb = document.getElementById('aemConfirm');
  const saveBtn = document.getElementById('aemSaveBtn');
  if (confirmCb) confirmCb.checked = false;
  if (saveBtn)   saveBtn.disabled = true;

  openModal('anamneseEditModal');
}

/**
 * Schließt das Anamnese-Edit-Modal ohne Speichern.
 */
export function closeAnamneseEditModal() {
  closeModal('anamneseEditModal');
}

/**
 * Sammelt die Form-Werte und schreibt sie zurück in state.profile.anamnesis,
 * setzt confirmedAt auf jetzt, persistiert und re-rendert.
 *
 * Vor dem Überschreiben wird der bisherige Stand (sofern bestätigt) in
 * profile.anamnesisHistory gepusht — AGB Abschnitt 6 verlangt, dass
 * vorherige Versionen zur Dokumentation erhalten bleiben.
 */
export function saveAnamneseEdit() {
  if (!state.profile) {
    toast('Kein Profil geladen');
    return;
  }
  const confirmCb = document.getElementById('aemConfirm');
  if (!confirmCb || !confirmCb.checked) {
    toast('Bitte die Bestätigungs-Checkbox aktivieren');
    return;
  }

  const get = (id) => document.getElementById(id)?.value?.trim() || '';

  const conditions = [];
  document.querySelectorAll('#aemConditionsChips .tp-chip.active').forEach(chip => {
    if (chip.dataset.condition) conditions.push(chip.dataset.condition);
  });

  // History-Push: Wenn bereits ein bestätigter Stand existiert, ihn vor
  // dem Überschreiben in die Historie aufnehmen. Defensive Init.
  if (!Array.isArray(state.profile.anamnesisHistory)) {
    state.profile.anamnesisHistory = [];
  }
  if (state.profile.anamnesis && state.profile.anamnesis.confirmedAt) {
    state.profile.anamnesisHistory.push({ ...state.profile.anamnesis });
  }

  state.profile.anamnesis = {
    version: ANAMNESIS_VERSION,
    confirmedAt: new Date().toISOString(),
    general:           get('aemGeneral')           || 'gut',
    clearance:         get('aemClearance')         || 'nicht_benoetigt',
    conditions,
    otherConditions:   get('aemOtherConditions'),
    currentPain:       get('aemCurrentPain')       || 'nein',
    painDetails:       get('aemPainDetails'),
    surgery:           get('aemSurgery')           || 'nein',
    surgeryDetails:    get('aemSurgeryDetails'),
    medication:        get('aemMedication')        || 'nein',
    medicationDetails: get('aemMedicationDetails'),
    experience:        get('aemExperience')        || 'beginner',
    restricted:        get('aemRestricted')
  };

  _saveProfile();
  renderAnamnese(state.profile);
  closeAnamneseEditModal();
  // Pflicht-Gate neu auswerten: Banner entfernen, Tabs entsperren
  import('../gates.js').then(({ applyGates }) => applyGates());
  const histLen = state.profile.anamnesisHistory.length;
  toast('✓ Anamnese gespeichert' + (histLen ? ` · ${histLen} ${histLen === 1 ? 'frühere Version' : 'frühere Versionen'} archiviert` : ''));
}

/**
 * Rendert die Anamnese-Historie als HTML in das History-Modal.
 * Sortiert die Snapshots absteigend nach confirmedAt (neueste zuerst).
 */
export function renderAnamneseHistory() {
  const container = document.getElementById('anamneseHistoryList');
  if (!container) return;
  const history = state.profile?.anamnesisHistory || [];

  if (!history.length) {
    container.innerHTML = '<div class="info-form-a info-form-a-empty" style="padding:16px;">Noch keine vorherigen Versionen — die erste Bestätigung steht oben in der Anamnese-Sektion.</div>';
    return;
  }

  // Absteigend sortieren (neueste zuerst)
  const sorted = [...history].sort((a, b) => {
    return new Date(b.confirmedAt || 0) - new Date(a.confirmedAt || 0);
  });

  const html = sorted.map((snap, idx) => {
    const num = sorted.length - idx;  // Versions-Nummer (älteste = 1)
    const date = formatDate(snap.confirmedAt);
    const conditions = Array.isArray(snap.conditions) ? snap.conditions : [];
    const condCount = conditions.length;
    const condSummary = condCount
      ? `${condCount} ${condCount === 1 ? 'Vorerkrankung' : 'Vorerkrankungen'}`
      : 'keine Vorerkrankungen';
    const painYes = snap.currentPain === 'ja';
    const surgYes = snap.surgery === 'ja';
    const medYes = snap.medication === 'ja';
    const flags = [];
    if (painYes) flags.push('Beschwerden');
    if (surgYes) flags.push('OP/Verletzung');
    if (medYes)  flags.push('Medikamente');
    const flagSummary = flags.length ? flags.join(' · ') : '—';

    const conditionChips = conditions.length
      ? conditions.map(c => `<span class="info-chip-muted">${escapeHtml(LABELS_CONDITION[c] || c)}</span>`).join(' ')
      : '<span style="color:var(--text-3);font-style:italic;">keine</span>';

    return `
      <details class="anam-history-entry">
        <summary class="anam-history-summary">
          <div class="anam-history-summary-main">
            <span class="anam-history-num">v${num}</span>
            <strong>${escapeHtml(date)}</strong>
          </div>
          <div class="anam-history-summary-meta">${escapeHtml(condSummary)} · ${escapeHtml(flagSummary)}</div>
        </summary>
        <div class="anam-history-body">
          <div class="info-form-rows">
            <div class="info-form-row"><div class="info-form-q">Allgemeiner Gesundheitszustand</div><div class="info-form-a">${escapeHtml(LABELS_GENERAL[snap.general] || '—')}</div></div>
            <div class="info-form-row"><div class="info-form-q">Ärztliche Freigabe</div><div class="info-form-a">${escapeHtml(LABELS_CLEARANCE[snap.clearance] || '—')}</div></div>
            <div class="info-form-row"><div class="info-form-q">Vorerkrankungen</div><div class="info-form-a">${conditionChips}</div></div>
            <div class="info-form-row"><div class="info-form-q">Sonstige Erkrankungen</div><div class="info-form-a${snap.otherConditions ? '' : ' info-form-a-empty'}">${escapeHtml(snap.otherConditions || 'Keine Angabe')}</div></div>
            <div class="info-form-row"><div class="info-form-q">Aktuelle Beschwerden</div><div class="info-form-a">${escapeHtml(LABELS_YESNO[snap.currentPain] || '—')}</div></div>
            <div class="info-form-row"><div class="info-form-q">Beschwerden-Details</div><div class="info-form-a${snap.painDetails ? '' : ' info-form-a-empty'}">${escapeHtml(snap.painDetails || '—')}</div></div>
            <div class="info-form-row"><div class="info-form-q">OP/Verletzung (12 Monate)</div><div class="info-form-a">${escapeHtml(LABELS_YESNO[snap.surgery] || '—')}</div></div>
            <div class="info-form-row"><div class="info-form-q">OP-Details</div><div class="info-form-a${snap.surgeryDetails ? '' : ' info-form-a-empty'}">${escapeHtml(snap.surgeryDetails || '—')}</div></div>
            <div class="info-form-row"><div class="info-form-q">Medikamente</div><div class="info-form-a">${escapeHtml(LABELS_YESNO[snap.medication] || '—')}</div></div>
            <div class="info-form-row"><div class="info-form-q">Medikamenten-Details</div><div class="info-form-a${snap.medicationDetails ? '' : ' info-form-a-empty'}">${escapeHtml(snap.medicationDetails || '—')}</div></div>
            <div class="info-form-row"><div class="info-form-q">Trainingserfahrung</div><div class="info-form-a">${escapeHtml(LABELS_EXPERIENCE[snap.experience] || '—')}</div></div>
            <div class="info-form-row"><div class="info-form-q">Übungs-Einschränkungen</div><div class="info-form-a${snap.restricted ? '' : ' info-form-a-empty'}">${escapeHtml(snap.restricted || 'Keine')}</div></div>
          </div>
        </div>
      </details>
    `;
  }).join('');

  container.innerHTML = html;
}

/**
 * Öffnet das History-Modal.
 */
export function openAnamneseHistoryModal() {
  renderAnamneseHistory();
  openModal('anamneseHistoryModal');
}
