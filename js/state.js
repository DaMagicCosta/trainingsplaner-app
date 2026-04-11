import { toast } from "./utils.js";
/* ═══════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════ */
export const STORAGE_KEYS = {
  tab: 'tpv2_active_tab',
  role: 'tpv2_role',
  theme: 'tpv2_theme',
  balView: 'tpv2_bal_view',
  balRange: 'tpv2_bal_range',
  fpRange: 'tpv2_fp_range',
  fpExercise: 'tpv2_fp_exercise',
  fpAgg: 'tpv2_fp_agg',
  showDemos: 'tpv2_show_demos'
};

// ─── Profil-Persistenz (localStorage) ───
export function _saveProfile() {
  if (!state.profile) return;
  // Demo-Vorschau-Modus: Schutz vor versehentlichem Überschreiben des
  // eigenen Profils. Mutationen am Demo bleiben in RAM, gehen beim
  // Verlassen der Vorschau verloren. Banner warnt den User.
  if (state.demoMode) {
    console.log('[Persist] Demo-Modus aktiv (' + state.demoMode + ') — kein Save');
    return;
  }
  try {
    localStorage.setItem('tpv2_profile_data', JSON.stringify(state.profile));
    console.log('[Persist] Profil gespeichert ·', (state.profile.sessions?.length || 0), 'Sessions');
  } catch (e) {
    console.warn('[Persist] Speichern fehlgeschlagen:', e.message);
    if (e.name === 'QuotaExceededError') toast('Speicher voll — Profil exportieren und Browser-Daten prüfen');
  }
}

export function _loadSavedProfile() {
  try {
    const raw = localStorage.getItem('tpv2_profile_data');
    if (!raw) return null;
    const p = JSON.parse(raw);
    console.log('[Persist] Profil aus localStorage geladen ·', p.name, '·', (p.sessions?.length || 0), 'Sessions');
    return p;
  } catch (e) {
    console.warn('[Persist] Laden fehlgeschlagen:', e.message);
    return null;
  }
}

export function _clearSavedProfile() {
  localStorage.removeItem('tpv2_profile_data');
  console.log('[Persist] localStorage gelöscht');
}

// ─── Leeres Profil ───
// Wird beim ersten Aufruf verwendet, wenn kein localStorage-Profil und
// keine explizite Demo-Wahl vorliegt. Alle Pflichtfelder sind angelegt,
// sodass die Render-Funktionen nicht crashen.
export function getEmptyProfile() {
  return {
    id:           'empty-' + Date.now(),
    name:         '',
    nachname:     '',
    alter:        '',
    gewicht:      '',
    groesse:      '',
    hfmax:        '',
    geschlecht:   '',
    goal:         'hypertrophie',
    tage:         [],
    trainingLocation: 'studio',
    equipment:    { studio: { available: [], excluded: [] } },
    sessions:     [],
    plans:        {},
    periodization: null,
    regenConfig:  null,
    athleteRegenWeeks: [],
    anamnesis:    null,
    anamnesisHistory: [],
    agreement:    null,
    agreementHistory: []
  };
}

// ─── v1-Legacy-Cleanup ───
// Räumt alte localStorage-Schlüssel der v1-App auf, die in v2 nicht mehr
// genutzt werden. Wird einmalig beim Init aufgerufen. Wichtig für die
// DSGVO-Belegspur: Die Datenschutzerklärung listet nur tpv2_*-Schlüssel,
// also dürfen keine alten Schlüssel ohne Erklärung im Browser verbleiben.
const LEGACY_KEYS = [
  'trainingsplaner_profiles',     // v1 PROFILES_KEY
  'trainingsplaner_active',       // v1 ACTIVE_PROFILE_KEY
  'trainingsplaner_sync_url',     // v1 SYNC_URL_KEY (Drive-Sync)
  'trainingsplaner_vault',        // v1 TP_VAULT_KEY (AES-Vault)
  'trainingsplaner_verify',       // v1 TP_VERIFY_KEY (PIN-Hash)
  'trainings_planer_active_tab'   // ältere Variante mit Underscore
];

export function _cleanupLegacyKeys() {
  const removed = [];
  LEGACY_KEYS.forEach(k => {
    if (localStorage.getItem(k) !== null) {
      localStorage.removeItem(k);
      removed.push(k);
    }
  });
  if (removed.length) {
    console.log('[Cleanup] v1-Legacy-Schlüssel entfernt:', removed.join(', '));
  }
}

export const state = {
  activeTab: localStorage.getItem(STORAGE_KEYS.tab) || 'cockpit',
  role: localStorage.getItem(STORAGE_KEYS.role) || 'trainer',
  theme: (() => { const t = localStorage.getItem(STORAGE_KEYS.theme); const valid = ['midnight','ember','tealDeep','pastell']; return valid.includes(t) ? t : 'tealDeep'; })(),
  balView: localStorage.getItem(STORAGE_KEYS.balView) || 'antagonists',
  balRange: localStorage.getItem(STORAGE_KEYS.balRange) || '12W',
  gSequence: false,
  gTimeout: null,
  cmdkOpen: false,
  cmdkSelected: 0,
  profile: null,  // wird von loadDemoProfile() befüllt
  tpViewKw: null, // aktiv ausgewählte KW im Trainingsplan-Tab
  tpViewDay: 0,   // aktiv ausgewählter Tag-Index
  tpEditing: null, // { exerciseName, setIdx } oder null — aktiv bearbeitete Satz-Zeile
  tpEditMode: false, // Trainingsplan Bearbeiten-Modus (Trainer-only)
  tpUseHome: false,  // Studio/Home-Toggle im Trainingsplan
  fpRange: localStorage.getItem('tpv2_fp_range') || '12W',
  fpExercise: localStorage.getItem('tpv2_fp_exercise') || '',
  fpAgg: localStorage.getItem('tpv2_fp_agg') || 'week',
  lxSearch: '',
  lxCategory: 'all',
  lxLocation: 'all',
  infoSection: localStorage.getItem('tpv2_info_section') || 'profil',
  // Demo-Athleten (RAM-only, Variante B). Erweiterbar sobald Multi-Profil-
  // Persistenz kommt. Keys entsprechen data-athlete-edit-Werten.
  demoAthletes: {
    lisa: {
      name: 'Julia',
      nachname: 'da Costa Amaral',
      alter: 38,
      groesse: 168,
      gewicht: 62,
      hfmax: 182,
      goal: 'kraftausdauer',
      geschlecht: 'weiblich',
      tage: ['Mo', 'Mi', 'Fr'],
      trainingLocation: ['studio', 'home'],
      equipment: {
        studio: { available: ['Langhantel', 'Kurzhanteln', 'Kabelzug', 'Maschinen', 'Klimmzugstange', 'Hantelbank'], excluded: [] },
        home:   { available: ['Kurzhanteln', 'Widerstandsbänder', 'Gymnastikmatte'], excluded: [] }
      },
      plans: {},
      sessions: [],
      periodization: { active: false, startKw: 1, blockLength: 4, blocks: [] },
      regenConfig: { interval: 13, regenBetween: true },
      athleteRegenWeeks: []
    }
  },
  activeProfile: 'self', // 'self' = Alexander, 'lisa' = Julia
  _editTarget: 'self',

  // ─── Demo-Vorschau-Modus (seit 11.04.2026) ───
  // Wenn aktiv, ist das geladene Profil eine RAM-only Vorschau eines
  // Demo-Athleten. Das eigene Profil ist in _savedProfileBackup geparkt
  // und wird beim Exit zurückgespielt. _saveProfile() ist im Demo-Modus
  // gesperrt — Mutationen gehen beim Verlassen verloren.
  demoMode: null,            // 'alexander' | 'julia' | null
  _savedProfileBackup: null, // das eigene Profil während Demo-Vorschau

  // ─── UI-Einstellung: Demo-Sektion im Profil-Tab anzeigen? ───
  showDemos: localStorage.getItem('tpv2_show_demos') !== 'false'  // default: true
};
