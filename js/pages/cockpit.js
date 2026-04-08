import { state, STORAGE_KEYS } from '../state.js';
import { toast, _parseDE, _isoWeek, _sessionVolume, _calc1RM, _daysAgo, _fmtNum, _fmtKg, _DOW_DE_SHORT, _DOW_DE_LONG, _MONTH_DE } from '../utils.js';
import { switchTab } from '../tabs.js';
import { calculateReadiness } from '../features/readiness.js';
import { buildMuscleBalance } from '../features/muscle-balance.js';
import { buildPlanBalance } from '../features/plan-balance.js';

export { renderCockpit };

/* ═══════════════════════════════════════════════════════
   COCKPIT-RENDER
   ═══════════════════════════════════════════════════════ */

function renderCockpit(profile) {
  if (!profile) return;
  const sessions = profile.sessions || [];

  // Echtes Datum für KW-Anzeige im Header
  const now = new Date();
  const iso = _isoWeek(now);
  const curYear = iso.year;
  const curKw = iso.week;

  // Daten-Anker für Berechnungen (neueste Session — Demo-Daten enden in der Vergangenheit)
  let refDate = now;
  if (sessions.length > 0) {
    const dates = sessions.map(s => _parseDE(s.date)).filter(Boolean);
    if (dates.length) refDate = new Date(Math.max(...dates));
  }
  const dataIso = _isoWeek(refDate);
  const dataYear = dataIso.year;
  const dataKw = dataIso.week;

  // ─── Header: Crumb + Begrüßung ──────────────────────
  const dow = _DOW_DE_LONG[now.getDay()];
  const dd = String(now.getDate()).padStart(2, '0');
  const mon = _MONTH_DE[now.getMonth()];
  const yy = now.getFullYear();
  document.getElementById('cpCrumb').textContent =
    `${dow} · ${dd} ${mon} ${yy} · KW ${curKw}`;

  // Begrüßung nach echter Tageszeit (refDate ist nur ein Datum ohne Uhrzeit)
  const hour = new Date().getHours();
  const gruss =
    hour < 5  ? 'Gute Nacht' :
    hour < 11 ? 'Guten Morgen' :
    hour < 14 ? 'Guten Tag' :
    hour < 18 ? 'Hallo' :
    hour < 22 ? 'Guten Abend' :
                'Gute Nacht';
  const firstName = (profile.name || 'Athlet').split(' ')[0];
  document.getElementById('cpGreeting').textContent = `${gruss}, ${firstName}.`;

  // ─── Volumen nach KW aggregieren ───────────────────
  // Map "YYYY_KW" → {volume, year, week, wIdx (fortlaufend)}
  const volByKw = new Map();
  sessions.forEach(s => {
    const d = _parseDE(s.date);
    if (!d) return;
    const si = _isoWeek(d);
    const key = si.year + '_' + si.week;
    const entry = volByKw.get(key) || { year: si.year, week: si.week, vol: 0 };
    entry.vol += _sessionVolume(s);
    volByKw.set(key, entry);
  });

  const volCur = volByKw.get(dataYear + '_' + dataKw)?.vol || 0;

  // Vorwoche = letzte KW mit Daten VOR der Daten-KW (robust gegen Lücken/Deload)
  const sortedWeeks = Array.from(volByKw.values())
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.week - b.week);
  const curIdx = sortedWeeks.findIndex(w => w.year === dataYear && w.week === dataKw);
  const prevEntry = curIdx > 0 ? sortedWeeks[curIdx - 1] : null;
  const volPrev = prevEntry ? prevEntry.vol : 0;

  document.getElementById('cpVolumeLabel').innerHTML = `↗ &nbsp;Volumen KW ${dataKw}`;
  document.getElementById('cpVolume').textContent = _fmtNum(volCur);

  const deltaEl = document.getElementById('cpVolumeDelta');
  const metaVolEl = document.getElementById('cpVolumeMeta');
  if (volPrev > 0 && volCur > 0) {
    const deltaPct = Math.round(((volCur - volPrev) / volPrev) * 100);
    deltaEl.textContent = (deltaPct >= 0 ? '↑ ' : '↓ ') + Math.abs(deltaPct) + '%';
    deltaEl.className = 'stat-delta ' + (deltaPct >= 0 ? 'up' : 'down');
    deltaEl.style.display = '';
    const isDirect = prevEntry.year === dataYear && prevEntry.week === dataKw - 1;
    metaVolEl.textContent = isDirect ? 'ggü. Vorwoche' : `ggü. KW ${prevEntry.week}`;
  } else {
    deltaEl.style.display = 'none';
    metaVolEl.textContent = volCur > 0 ? 'Erste aktive Woche — keine Vergleichsbasis' : 'Noch keine Einheit diese Woche';
  }

  // ─── Einheiten diese Woche vs. profile.tage ────────
  const sessThisWeek = sessions.filter(s => {
    const d = _parseDE(s.date);
    if (!d) return false;
    const si = _isoWeek(d);
    return si.year === dataYear && si.week === dataKw;
  });
  const planned = (profile.tage || []).length || 0;
  const done = sessThisWeek.length;
  document.getElementById('cpSessions').textContent = done;
  document.getElementById('cpSessionsPlan').textContent = `/ ${planned} geplant`;

  const missing = Math.max(0, planned - done);
  const sessMetaEl = document.getElementById('cpSessionsMeta');
  if (done === 0)       sessMetaEl.textContent = 'Woche startet noch';
  else if (missing === 0) sessMetaEl.textContent = 'Woche komplett abgeschlossen ✓';
  else                    sessMetaEl.textContent = `noch ${missing} Einheit${missing > 1 ? 'en' : ''} bis Sonntag`;

  // ─── Bester 1RM der letzten 7 Tage ─────────────────
  const cutoff = new Date(refDate); cutoff.setDate(cutoff.getDate() - 7);
  let best = { oneRM: 0 };
  sessions.forEach(s => {
    const d = _parseDE(s.date);
    if (!d || d < cutoff || d > refDate) return;
    (s.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(set => {
        const orm = _calc1RM(Number(set.gewicht), Number(set.wdh));
        if (orm > best.oneRM) {
          best = {
            oneRM: orm,
            weight: set.gewicht,
            reps: set.wdh,
            exercise: ex.name,
            date: d
          };
        }
      });
    });
  });

  if (best.oneRM > 0) {
    document.getElementById('cpPrValue').textContent = Math.round(best.oneRM);
    const ago = _daysAgo(best.date, refDate);
    const agoStr = ago === 0 ? 'heute' : ago === 1 ? 'gestern' : `vor ${ago} Tagen`;
    document.getElementById('cpPrMeta').textContent =
      `${best.exercise} · ${best.weight} kg × ${best.reps} · ${agoStr}`;
  } else {
    document.getElementById('cpPrValue').textContent = '—';
    document.getElementById('cpPrMeta').textContent = 'Keine Daten der letzten 7 Tage';
  }

  // ─── Nächste geplante Einheit ──────────────────────
  const tage = profile.tage || [];
  const plans = profile.plans || {};

  const nextDowEl    = document.getElementById('cpNextDow');
  const nextDayEl    = document.getElementById('cpNextDay');
  const nextTitleEl  = document.getElementById('cpNextTitle');
  const nextMetaEl   = document.getElementById('cpNextMeta');
  const nextActionEl = document.getElementById('cpNextAction');

  let nextDate = null, nextLabel = null, nextKw = null, nextPlan = null, nextDayIdx = -1;
  if (tage.length) {
    // Max. 14 Tage ab refDate durchsuchen (bis wir einen Trainingstag finden, für den auch ein Plan existiert)
    for (let i = 1; i <= 14; i++) {
      const cand = new Date(refDate); cand.setDate(cand.getDate() + i);
      const lbl = _DOW_DE_SHORT[cand.getDay()];
      if (!tage.includes(lbl)) continue;
      const iso = _isoWeek(cand);
      const plan = plans['w' + iso.week];
      if (!plan || !plan.days) continue;
      const dIdx = (plan.days || []).findIndex(d => d.label === lbl);
      if (dIdx < 0) continue;
      // Gefunden
      nextDate = cand;
      nextLabel = lbl;
      nextKw = iso.week;
      nextPlan = plan;
      nextDayIdx = dIdx;
      break;
    }
  }

  if (nextDate && nextPlan) {
    nextDowEl.textContent = nextLabel.toUpperCase();
    nextDayEl.textContent = String(nextDate.getDate()).padStart(2, '0');

    const day = nextPlan.days[nextDayIdx];
    const exCount  = (day.exercises || []).length;
    const setCount = (day.exercises || []).reduce((a, e) => a + (Number(e.saetze) || 0), 0);
    const minutes  = Math.round(setCount * 2.5 + exCount * 3); // grober Schätzer

    nextTitleEl.textContent = `${nextPlan.name} · ${nextLabel}`;
    nextMetaEl.innerHTML = `
      <span>▤ ${exCount} Übungen</span>
      <span>◯ ${setCount} Sätze</span>
      <span>⌁ ca. ${minutes} Min</span>
      <span>▣ Block ${(nextPlan._block ?? 0) + 1} · ${nextPlan.goal || '—'}</span>
    `;

    // Deep-Link-Daten auf den Button hängen
    if (nextActionEl) {
      nextActionEl.dataset.targetKw  = String(nextKw);
      nextActionEl.dataset.targetDay = String(nextDayIdx);
      nextActionEl.disabled = false;
      nextActionEl.style.opacity = '';
      nextActionEl.style.cursor = 'pointer';
    }
  } else {
    nextTitleEl.textContent = 'Kein aktiver Plan';
    nextMetaEl.textContent = '';
    if (nextActionEl) {
      delete nextActionEl.dataset.targetKw;
      delete nextActionEl.dataset.targetDay;
      nextActionEl.disabled = true;
      nextActionEl.style.opacity = '0.4';
      nextActionEl.style.cursor = 'default';
    }
  }

  // ─── Readiness / Fatigue Score ───────────────────
  const readiness = calculateReadiness(profile, refDate);
  const rdNumEl   = document.getElementById('cpReadiness');
  const rdStateEl = document.getElementById('cpReadinessState');
  const rdPillEl  = rdStateEl?.closest('.hero-state');
  const rdHeroNum = rdNumEl?.closest('.hero-number');

  // State-Klassen zurücksetzen
  if (rdPillEl)  rdPillEl.classList.remove('state-warn', 'state-danger');
  if (rdHeroNum) rdHeroNum.classList.remove('state-warn', 'state-danger');

  if (readiness) {
    rdNumEl.textContent = readiness.score;
    rdStateEl.textContent = readiness.label;
    if (readiness.state === 'warn')   { rdPillEl.classList.add('state-warn');   rdHeroNum.classList.add('state-warn'); }
    if (readiness.state === 'danger') { rdPillEl.classList.add('state-danger'); rdHeroNum.classList.add('state-danger'); }
  } else {
    rdNumEl.textContent = '—';
    rdStateEl.textContent = 'Zu wenige Daten';
  }

  // ─── Muskel-Balancer ──
  buildMuscleBalance(profile, state.balView, state.balRange);

  console.log('[Cockpit] gerendert', {
    refDate: refDate.toLocaleDateString('de-DE'),
    kw: curKw,
    volCur: _fmtNum(volCur), volPrev: _fmtNum(volPrev),
    sessions: `${done}/${planned}`,
    best1RM: best.oneRM > 0 ? best.oneRM.toFixed(1) + ' kg ' + best.exercise : '—',
    readiness: readiness ? `${readiness.score} · ${readiness.state}` : '—',
    components: readiness?.components
  });
}

// Range-Toggle (Zeitfenster) einmalig verdrahten
document.querySelectorAll('#cpBalRange button').forEach(btn => {
  // initial aktiven Button anhand state setzen
  btn.classList.toggle('active', btn.dataset.range === state.balRange);
  btn.addEventListener('click', () => {
    state.balRange = btn.dataset.range;
    localStorage.setItem(STORAGE_KEYS.balRange, state.balRange);
    document.querySelectorAll('#cpBalRange button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (state.profile) buildMuscleBalance(state.profile, state.balView, state.balRange);
  });
});

// View-Switcher (Antagonisten / Ober-Unter / Push-Pull / V-H-Kette) verdrahten
document.querySelectorAll('#cpBalView button').forEach(btn => {
  btn.classList.toggle('active', btn.dataset.view === state.balView);
  btn.addEventListener('click', () => {
    state.balView = btn.dataset.view;
    localStorage.setItem(STORAGE_KEYS.balView, state.balView);
    document.querySelectorAll('#cpBalView button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (state.profile) buildMuscleBalance(state.profile, state.balView, state.balRange);
  });
});

// Trainingsplan Tag-Tabs (Schritt 1: reiner Active-State-Switch, kein Content-Wechsel)
document.querySelectorAll('.tp-day-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tp-day-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.tpViewDay = parseInt(tab.dataset.day || '0', 10);
  });
});

