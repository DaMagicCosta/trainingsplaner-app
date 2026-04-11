/**
 * strength-standards.js — NSCA/ACSM-basierte Kraft-Standards
 *
 * Einzige Quelle der Wahrheit für die Stärke-Ratios, die in der App
 * an zwei Stellen genutzt werden:
 *
 * 1. Fortschritt-Tab → Standards-View (zeigt Athleten-1RM gegen Tabelle)
 *    Aktuell hat fortschritt.js noch eine eigene Kopie — sollte später
 *    auf dieses Modul umgestellt werden (Refactor-Todo).
 *
 * 2. Wochenplan-Generator → estimateStartWeight() leitet aus dem
 *    Anamnese-Level + Bodyweight + Geschlecht ein Start-Gewicht für
 *    Compound-Übungen ab, sodass beim Generieren des ersten Plans
 *    konkrete kg-Werte stehen statt nur Wdh.
 *
 * Quellen der Ratios:
 * - NSCA Strength & Conditioning Journal — Strength Standards by Body Weight
 * - ACSM Guidelines for Exercise Testing & Prescription, 11th ed.
 * - ExRx.net Strength Standards (cross-validated)
 *
 * Werte sind 1RM als Ratio des Körpergewichts. Beispiel:
 *   Bankdrücken männlich erfahren (Level 2) = 1.0 × BW → 80 kg bei 80 kg BW
 */

// ─── Ratios ───────────────────────────────────────────────────────
// Index: 0=Anfänger, 1=Geübt, 2=Fortgeschr., 3=Stark, 4=Elite
export const STANDARDS_M = {
  'Bankdrücken':       [0.50, 0.75, 1.00, 1.25, 1.50],
  'Kniebeuge':         [0.75, 1.00, 1.25, 1.75, 2.25],
  'Kreuzheben':        [1.00, 1.25, 1.50, 2.00, 2.50],
  'Schulterdrücken':   [0.35, 0.55, 0.70, 0.85, 1.05],
  'Rudern':            [0.50, 0.70, 0.90, 1.10, 1.35]
};

export const STANDARDS_F = {
  'Bankdrücken':       [0.25, 0.40, 0.60, 0.80, 1.00],
  'Kniebeuge':         [0.50, 0.70, 0.90, 1.20, 1.50],
  'Kreuzheben':        [0.65, 0.85, 1.10, 1.40, 1.75],
  'Schulterdrücken':   [0.20, 0.35, 0.45, 0.60, 0.75],
  'Rudern':            [0.30, 0.45, 0.60, 0.75, 0.90]
};

export const STANDARD_LABELS = ['Anfänger', 'Geübt', 'Fortgeschritten', 'Stark', 'Elite'];

// ─── Übungs-Aliase: Lexikon-Name → Standards-Eintrag ──────────────
// Wird genutzt, um Variantennamen wie "Flachbankdrücken mit der
// Kurzhantel" auf den generischen Standard "Bankdrücken" zu mappen.
export const EXERCISE_MAP = {
  'Bankdrücken':     ['Bankdrücken', 'Flachbankdrücken', 'Chest Press', 'Bankdrückmaschine'],
  'Kniebeuge':       ['Kniebeuge', 'Kniebeugen', 'Back Squat', 'Beinpresse'],
  'Kreuzheben':      ['Kreuzheben', 'Deadlift', 'Rumänisches Kreuzheben'],
  'Schulterdrücken': ['Military Press', 'Schulterdrücken', 'Shoulder Press', 'Kurzhanteldrücken sitzend', 'Nackendrückmaschine'],
  'Rudern':          ['Rudern', 'Langhantelrudern', 'Latzug', 'Cable Row', 'Low Row', 'Upper Back']
};

// ─── Isolations-Map: Substring → Compound-Übung + Faktor ──────────
// Für Iso- und Maschinen-Übungen, die keinen eigenen NSCA-Standard
// haben, wird das Gewicht als Bruchteil einer Compound-Übung
// abgeleitet (Faustregeln aus der Praxis, keine offiziellen Werte).
//
// Substrings sind kleingeschrieben — werden mit toLowerCase()
// gegen den Übungsnamen geprüft. Reihenfolge ist wichtig: das
// erste Match gewinnt, deshalb spezifischere Patterns vor allgemeinen.
export const ISOLATION_PATTERNS = [
  // ─── Brust-Iso ───
  ['butterfly',           'Bankdrücken', 0.50],
  ['pectoral machine',    'Bankdrücken', 0.50],
  ['fliegende',           'Bankdrücken', 0.30],
  ['flys',                'Bankdrücken', 0.30],

  // ─── Schulter-Iso ───
  ['seitheben',           'Schulterdrücken', 0.20],
  ['frontheben',          'Schulterdrücken', 0.20],
  ['reverse fly',         'Schulterdrücken', 0.15],
  ['innenrotation',       'Schulterdrücken', 0.10],
  ['außenrotation',       'Schulterdrücken', 0.10],

  // ─── Bein-Iso (sitzend/liegend an der Maschine) ───
  ['beinstreckmaschine',  'Kniebeuge', 0.50],
  ['beinstrecker',        'Kniebeuge', 0.50],
  ['beinbeugemaschine',   'Kniebeuge', 0.40],
  ['beinbeuger',          'Kniebeuge', 0.40],
  ['adduktor',            'Kniebeuge', 0.30],
  ['abduktor',            'Kniebeuge', 0.30],
  ['wadenmaschine',       'Kniebeuge', 0.80],
  ['hüftstreck',          'Kniebeuge', 0.40],
  ['ausfallschritt',      'Kniebeuge', 0.30],
  ['lunges',              'Kniebeuge', 0.30],

  // ─── Rücken-Iso ───
  ['rückenstreckmaschine','Kreuzheben', 0.40],
  ['rückenstrecken',      'Kreuzheben', 0.40],

  // ─── Bizeps-Iso ───
  ['langhantelcurl',      'Bankdrücken', 0.30],
  ['konzentrationscurl',  'Bankdrücken', 0.20],
  ['kurzhantelcurl',      'Bankdrücken', 0.20],
  ['bizepscurl',          'Bankdrücken', 0.30],

  // ─── Trizeps-Iso ───
  ['trizepsstrecken',     'Bankdrücken', 0.30],
  ['trizeps kicks',       'Bankdrücken', 0.15],

  // ─── Bauch-Iso ───
  ['bauchmaschine',       'Bankdrücken', 0.40],
  ['beinhebemaschine',    'Bankdrücken', 0.30]
];

// ─── Anamnese-Level → Standards-Index ─────────────────────────────
// Anamnese-Werte: anfaenger, beginner, erfahren, fortgeschritten, elite
// Index in den Ratio-Arrays oben: 0..4
export const LEVEL_MAP = {
  anfaenger:       0,
  beginner:        1,
  erfahren:        2,
  fortgeschritten: 3,
  elite:           4
};

/**
 * Sucht zu einem Lexikon-Übungsnamen den passenden Standards-Eintrag.
 * @param {string} name — Lexikon-Übungsname
 * @returns {string | null} — Standards-Schlüssel ('Bankdrücken', ...) oder null
 */
export function resolveStandardExercise(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const [stdKey, aliases] of Object.entries(EXERCISE_MAP)) {
    for (const alias of aliases) {
      if (lower.includes(alias.toLowerCase())) return stdKey;
    }
  }
  return null;
}

/**
 * Liest das Anamnese-Erfahrungslevel aus dem Profil und mappt auf
 * den Standards-Index. Default = 'beginner' (Index 1).
 */
export function getExperienceIndex(profile) {
  const exp = profile?.anamnesis?.experience;
  if (exp && LEVEL_MAP[exp] !== undefined) return LEVEL_MAP[exp];
  return LEVEL_MAP.beginner; // konservativer Default
}

/**
 * Interner Helper: rechnet ein Compound-Gewicht für ein gegebenes
 * Standards-Key (Bankdrücken / Kniebeuge / etc.) und Profile.
 * Gibt das Arbeitsgewicht als Float zurück (ungerundet).
 */
function _computeCompoundWorkingWeight(stdKey, reps, profile) {
  const isFemale = (profile.geschlecht || '').toLowerCase().includes('w');
  const standards = isFemale ? STANDARDS_F : STANDARDS_M;
  const ratios = standards[stdKey];
  if (!ratios) return null;

  const levelIdx = getExperienceIndex(profile);
  const ratio = ratios[levelIdx];
  if (typeof ratio !== 'number') return null;

  const bw = parseFloat(profile.gewicht) || 80;
  const oneRm = ratio * bw;

  // Epley invers: weight = 1RM / (1 + reps/30)
  const safeReps = Math.max(1, Math.min(reps || 10, 30));
  return oneRm / (1 + safeReps / 30);
}

/**
 * Sucht in der ISOLATION_PATTERNS-Liste das erste Pattern, das im
 * Übungsnamen vorkommt. Gibt das Tupel [substring, base, factor]
 * oder null zurück.
 */
function _resolveIsolationPattern(exerciseName) {
  if (!exerciseName) return null;
  const lower = exerciseName.toLowerCase();
  for (const entry of ISOLATION_PATTERNS) {
    if (lower.includes(entry[0])) return entry;
  }
  return null;
}

/**
 * Schätzt ein Start-Gewicht für eine Übung basierend auf:
 * - Anamnese-Level (oder Default 'beginner')
 * - Geschlecht (oder Default männlich)
 * - Körpergewicht
 * - Geplante Wiederholungszahl (Epley-Umrechnung 1RM → Arbeitsgewicht)
 *
 * Drei-Stufen-Auflösung:
 * 1. Direkter Compound-Match über EXERCISE_MAP → eigene Ratio
 * 2. Isolations-Pattern über ISOLATION_PATTERNS → Compound × Faktor
 * 3. Sonst null (keine Schätzung möglich)
 *
 * @param {string} exerciseName — z. B. "Flachbankdrücken mit der Langhantel"
 * @param {number} reps — geplante Wdh-Zahl pro Satz
 * @param {object} profile — state.profile
 * @returns {number | null} — gerundetes Arbeitsgewicht in kg, oder null
 */
export function estimateStartWeight(exerciseName, reps, profile) {
  if (!profile) return null;

  // Stufe 1: Compound-Match über EXERCISE_MAP
  const stdKey = resolveStandardExercise(exerciseName);
  let workingWeight = null;
  if (stdKey) {
    workingWeight = _computeCompoundWorkingWeight(stdKey, reps, profile);
  } else {
    // Stufe 2: Isolations-Pattern → Compound × Faktor
    const iso = _resolveIsolationPattern(exerciseName);
    if (iso) {
      const baseWeight = _computeCompoundWorkingWeight(iso[1], reps, profile);
      if (baseWeight != null) workingWeight = baseWeight * iso[2];
    }
  }

  if (workingWeight == null) return null;

  // Auf 2.5 kg runden (Studio-Standard)
  const rounded = Math.round(workingWeight / 2.5) * 2.5;

  // Mindestgewicht: 5 kg (sonst kommen unsinnig kleine Werte raus)
  return Math.max(5, rounded);
}
