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
  fpAgg: 'tpv2_fp_agg'
};

// ─── Profil-Persistenz (localStorage) ───
export function _saveProfile() {
  if (!state.profile) return;
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
  _editTarget: 'self'
};
