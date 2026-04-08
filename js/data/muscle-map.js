// Muskel-Mapping & Antagonisten-Paare

/* ═══════════════════════════════════════════════════════
   MUSKEL-BALANCE (Antagonisten)
   ═══════════════════════════════════════════════════════ */

// Rohnamen aus dem Profil → kanonische Muskelgruppen
export const MUSCLE_MAP = {
  // Brust
  'Großer Brustmuskel':    'Brust',
  'Großer Brustmuskel (unterer Anteil)':  'Brust',
  'Großer Brustmuskel (oberer Anteil)':   'Brust',
  'Großer Brustmuskel (innerer Anteil)':  'Brust',
  'Großer Brustmuskel (unterer Bereich)': 'Brust',
  'Brustmuskel':           'Brust',
  'Brustmuskel (oberer Anteil)':  'Brust',
  'Kleiner Brustmuskel':   'Brust',
  'Vorderer Sägemuskel':   'Brust',
  'Brust':                 'Brust',
  // Rücken
  'Latissimus':            'Rücken',
  'Oberer Rücken':         'Rücken',
  'Breiter Rückenmuskel':  'Rücken',
  'Rautenmuskeln':         'Rücken',
  'Rautenmuskel':          'Rücken',
  'Trapezmuskel':          'Rücken',
  'Trapezmuskel (oberer Anteil)':    'Rücken',
  'Trapezmuskel (mittlerer Anteil)': 'Rücken',
  'Trapezmuskel (unterer Anteil)':   'Rücken',
  'großer Rundmuskel':     'Rücken',
  'Rücken':                'Rücken',
  // Arme
  'Bizeps':                'Bizeps',
  'Bizeps (kurzer Kopf)':  'Bizeps',
  'Bizeps (langer Kopf)':  'Bizeps',
  'Armbeuger':             'Bizeps',
  'Hakenarmmuskel':        'Bizeps',
  'Oberarmspeichenmuskel': 'Bizeps',
  'Trizeps':               'Trizeps',
  // Beine
  'Quadrizeps':            'Quadrizeps',
  'Vorderer Oberschenkel': 'Quadrizeps',
  'Beinbeuger':            'Hamstrings',
  'Beinbizeps':            'Hamstrings',
  'Beinbeugemuskulatur':   'Hamstrings',
  'Hintere Oberschenkelmuskulatur': 'Hamstrings',
  'Gesäß':                 'Hamstrings',
  'Gesäßmuskel':           'Hamstrings',
  'Großer Gesäßmuskel':    'Hamstrings',
  'Gluteus':               'Hamstrings',
  // Schulter — anatomische Langformen + Kurzformen
  'Schulter':              'Vordere Schulter',
  'Vordere Schulter':      'Vordere Schulter',
  'Deltamuskel':           'Seitliche Schulter',
  'Deltamuskel (vorderer Anteil)':   'Vordere Schulter',
  'Deltamuskel (vorderer + mittlerer Anteil)': 'Vordere Schulter',
  'Vorderer Teil Deltamuskel':       'Vordere Schulter',
  'Vorderer und mittlerer Anteil Deltamuskel': 'Vordere Schulter',
  'Vorderer Deltamuskel':  'Vordere Schulter',
  'Hintere Schulter':      'Hintere Schulter',
  'Deltamuskel (hinterer Anteil)':   'Hintere Schulter',
  'Hinterer Teil Deltamuskel':       'Hintere Schulter',
  'Hinterer Deltamuskel':  'Hintere Schulter',
  'Rotatorenmanschette':   'Hintere Schulter',
  'Seitliche Schulter':    'Seitliche Schulter',
  'Deltamuskel (mittlerer Anteil)':  'Seitliche Schulter',
  'Mittlerer Anteil Deltamuskel':    'Seitliche Schulter',
  'Mittlerer Deltamuskel': 'Seitliche Schulter',
  'Obergrätenmuskel':      'Seitliche Schulter',
  // Solo-Gruppen
  'Waden':                 'Waden',
  'Wadenmuskel':           'Waden',
  'Zwillingswadenmuskel':  'Waden',
  'Schollenmuskel':        'Waden',
  'unterer Rücken':        'Unt. Rücken',
  'Unterer Rücken':        'Unt. Rücken',
  'Rückenstrecker':        'Unt. Rücken',
  'Gerader Bauchmuskel':   'Bauch',
  'Querer Bauchmuskel':    'Bauch',
  'Schräge Bauchmuskeln':  'Bauch',
  'Schräge Bauchmuskulatur': 'Bauch',
  'Bauch':                 'Bauch'
};

// Klassische Antagonisten-Paare (Fein-Ansicht)
export const ANTAGONIST_PAIRS = [
  { l: 'Brust',       lGroups: ['Brust'],            r: 'Rücken',      rGroups: ['Rücken'] },
  { l: 'Bizeps',      lGroups: ['Bizeps'],           r: 'Trizeps',     rGroups: ['Trizeps'] },
  { l: 'Quadrizeps',  lGroups: ['Quadrizeps'],       r: 'Hamstrings',  rGroups: ['Hamstrings'] },
  { l: 'V. Schulter', lGroups: ['Vordere Schulter'], r: 'H. Schulter', rGroups: ['Hintere Schulter'] }
];

// Solo-Muskeln in der Antagonisten-View
export const SOLO_GROUPS = [
  { label: 'Seitliche Schulter', groups: ['Seitliche Schulter'] },
  { label: 'Bauch',              groups: ['Bauch'] },
  { label: 'Waden',              groups: ['Waden'] },
  { label: 'Unt. Rücken',        groups: ['Unt. Rücken'] }
];

// Views des Muskel-Balancers
// - type 'pairs':  mehrere Feine Paare (Antagonisten) + Solo
// - type 'master': eine große Paar-Zeile + Breakdown pro Seite
export const BALANCE_VIEWS = {
  antagonists: {
    label: 'Antagonisten',
    type: 'pairs',
    pairs: ANTAGONIST_PAIRS,
    showSolo: true
  },
  upperlower: {
    label: 'Ober / Unter',
    type: 'master',
    hint: 'Beintag-Check · fängt Leute, bei denen jede einzelne Zeile ausgewogen ist, aber das Gesamtvolumen kippt',
    pair: {
      l: 'Oberkörper',
      lGroups: ['Brust', 'Rücken', 'Bizeps', 'Trizeps',
                'Vordere Schulter', 'Hintere Schulter', 'Seitliche Schulter'],
      r: 'Unterkörper',
      rGroups: ['Quadrizeps', 'Hamstrings', 'Waden', 'Unt. Rücken'],
      warnAt: 25, dangerAt: 40
    }
  },
  pushpull: {
    label: 'Push / Pull',
    type: 'master',
    hint: 'Drücken vs. Ziehen · klassisches PPL-Paradigma, fängt das häufige Muster „zu viel Push, zu wenig Pull"',
    pair: {
      l: 'Push',
      lGroups: ['Brust', 'Trizeps', 'Vordere Schulter', 'Seitliche Schulter',
                'Quadrizeps', 'Waden'],
      r: 'Pull',
      rGroups: ['Rücken', 'Bizeps', 'Hintere Schulter',
                'Hamstrings', 'Unt. Rücken'],
      warnAt: 20, dangerAt: 35
    }
  },
  chain: {
    label: 'V- / H-Kette',
    type: 'master',
    hint: 'Haltungs-Check · anteriore vs. posteriore Muskelkette. Bei sitzenden Berufen ist die hintere Kette oft unterentwickelt',
    pair: {
      l: 'Vordere Kette',
      lGroups: ['Brust', 'Vordere Schulter', 'Bizeps', 'Quadrizeps'],
      r: 'Hintere Kette',
      rGroups: ['Rücken', 'Hintere Schulter', 'Trizeps',
                'Hamstrings', 'Unt. Rücken'],
      warnAt: 20, dangerAt: 35
    }
  }
};

