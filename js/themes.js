import { state, STORAGE_KEYS } from './state.js';
import { toast } from './utils.js';

/* ═══════════════════════════════════════════════════════
   THEMES (temporär für v2.0 — nach Entscheidung bleibt einer)
   ═══════════════════════════════════════════════════════ */
// Dark-Mode Basis-Werte (werden von allen Teal-Themes gesetzt, damit Pastell-Reset funktioniert)
const _darkBase = {
  '--bg':            '#0A0B0E',
  '--surface-1':     '#0F1014',
  '--surface-2':     '#16181F',
  '--surface-3':     '#1D2029',
  '--surface-hover': '#242735',
  '--border-subtle': 'rgba(255,255,255,0.06)',
  '--border-strong': 'rgba(255,255,255,0.10)',
  '--text':          '#F7F8F8',
  '--text-2':        '#8A8F98',
  '--text-3':        '#62666D',
};

const themes = {
  tealLight: { ..._darkBase,
    '--accent':'#14B8A6','--accent-hover':'#2DD4BF',
    '--accent-dim':'rgba(20,184,166,0.12)','--accent-line':'rgba(20,184,166,0.35)',
    '--success':'#10B981','--success-dim':'rgba(16,185,129,0.10)','--success-line':'rgba(16,185,129,0.30)',
    '--warning':'#D4A968','--warning-dim':'rgba(212,169,104,0.10)','--warning-line':'rgba(212,169,104,0.30)',
    '--danger':'#C76A5E','--danger-dim':'rgba(199,106,94,0.10)','--danger-line':'rgba(199,106,94,0.30)',
    '--on-accent':'#ffffff'
  },
  tealMid: { ..._darkBase,
    '--accent':'#0D9488','--accent-hover':'#14B8A6',
    '--accent-dim':'rgba(13,148,136,0.14)','--accent-line':'rgba(13,148,136,0.40)',
    '--success':'#10B981','--success-dim':'rgba(16,185,129,0.10)','--success-line':'rgba(16,185,129,0.30)',
    '--warning':'#D4A968','--warning-dim':'rgba(212,169,104,0.10)','--warning-line':'rgba(212,169,104,0.30)',
    '--danger':'#C76A5E','--danger-dim':'rgba(199,106,94,0.10)','--danger-line':'rgba(199,106,94,0.30)',
    '--on-accent':'#ffffff'
  },
  tealDeep: { ..._darkBase,
    '--accent':'#0F766E','--accent-hover':'#14B8A6',
    '--accent-dim':'rgba(15,118,110,0.16)','--accent-line':'rgba(15,118,110,0.45)',
    '--success':'#10B981','--success-dim':'rgba(16,185,129,0.10)','--success-line':'rgba(16,185,129,0.30)',
    '--warning':'#D4A968','--warning-dim':'rgba(212,169,104,0.10)','--warning-line':'rgba(212,169,104,0.30)',
    '--danger':'#C76A5E','--danger-dim':'rgba(199,106,94,0.10)','--danger-line':'rgba(199,106,94,0.30)',
    '--on-accent':'#ffffff'
  },
  pastell: {
    '--bg':            '#E4D8CC',
    '--surface-1':     '#F2EAE2',
    '--surface-2':     '#E8DDD4',
    '--surface-3':     '#DDD0C5',
    '--surface-hover': '#D4C5B8',
    '--border-subtle': 'rgba(80,50,30,0.12)',
    '--border-strong': 'rgba(80,50,30,0.20)',
    '--text':          '#3D2E22',
    '--text-2':        '#6B5A4E',
    '--text-3':        '#9A887A',
    '--accent':        '#B07A8E',
    '--accent-hover':  '#C48B9F',
    '--accent-dim':    'rgba(176,122,142,0.18)',
    '--accent-line':   'rgba(176,122,142,0.40)',
    '--success':       '#6B9E6F',
    '--success-dim':   'rgba(107,158,111,0.15)',
    '--success-line':  'rgba(107,158,111,0.35)',
    '--warning':       '#C49A58',
    '--warning-dim':   'rgba(196,154,88,0.15)',
    '--warning-line':  'rgba(196,154,88,0.35)',
    '--danger':        '#B85A50',
    '--danger-dim':    'rgba(184,90,80,0.12)',
    '--danger-line':   'rgba(184,90,80,0.30)',
    '--on-accent':     '#ffffff'
  }
};

const themeLabels = {
  tealLight: 'Teal hell · frisch',
  tealMid: 'Teal mittel · elegant',
  tealDeep: 'Teal tief · premium',
  pastell: 'Pastell · Garten'
};

export function applyTheme(key) {
  if (!themes[key]) key = 'tealDeep';
  state.theme = key;
  localStorage.setItem(STORAGE_KEYS.theme, key);
  const root = document.documentElement;
  Object.entries(themes[key]).forEach(([prop, val]) => {
    root.style.setProperty(prop, val);
  });
  document.querySelectorAll('.theme-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.theme === key);
  });

  // Pastell/Garten: Raupe → Schmetterling 🦋
  const bugIcon = key === 'pastell' ? '🦋' : '🐛';
  const floaterIcon = document.querySelector('#bugFloaterBtn .bug-floater-icon');
  if (floaterIcon) floaterIcon.textContent = bugIcon;

  toast('Theme: ' + themeLabels[key]);
}

document.querySelectorAll('.theme-dot').forEach(dot => {
  dot.addEventListener('click', () => applyTheme(dot.dataset.theme));
});

