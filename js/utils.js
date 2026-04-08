/* ═══════════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════════ */
let toastTimer;
export { toast, escapeHtml, _parseDE, _isoWeek, _sessionVolume, _calc1RM, _daysAgo, _fmtNum, _fmtKg, _DOW_DE_SHORT, _DOW_DE_LONG, _MONTH_DE };
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ═══════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════ */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

/* ═══════════════════════════════════════════════════════
   DATEN-HELPER (portiert aus Original-App)
   ═══════════════════════════════════════════════════════ */

// "DD.MM.YYYY" → Date
function _parseDE(str) {
  if (!str) return null;
  const [d, m, y] = String(str).split('.').map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

// ISO-Woche {year, week} für ein Date
function _isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    year: d.getUTCFullYear(),
    week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  };
}

// Summe aller Sätze × Wdh × Gewicht einer Session
function _sessionVolume(s) {
  let v = 0;
  (s.exercises || []).forEach(ex => {
    (ex.sets || []).forEach(set => {
      v += (Number(set.wdh) || 0) * (Number(set.gewicht) || 0);
    });
  });
  return v;
}

// 1RM nach Epley
function _calc1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

// Tage-Differenz (ganze Tage)
function _daysAgo(date, ref) {
  return Math.floor((ref - date) / 86400000);
}

// Zahlen mit deutschem Tausendertrenner
function _fmtNum(n) {
  return Math.round(n).toLocaleString('de-DE');
}
// kg smart: 60 → "60", 62.5 → "62.5", 60.0 → "60"
function _fmtKg(n) {
  const v = Number(n);
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
}

// Deutsche Wochentags-Abkürzungen
const _DOW_DE_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const _DOW_DE_LONG  = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const _MONTH_DE     = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

