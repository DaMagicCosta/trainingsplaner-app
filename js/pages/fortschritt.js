import { state, STORAGE_KEYS } from '../state.js';
import { toast, _parseDE, _isoWeek, _sessionVolume, _calc1RM, _fmtNum, _fmtKg, _MONTH_DE } from '../utils.js';
import { MUSCLE_MAP } from '../data/muscle-map.js';
import { _effectiveWeight, _getBwFactor } from '../features/muscle-balance.js';
export { renderFortschritt };

   FORTSCHRITT (v2.5) — Render-Logik
   ═══════════════════════════════════════════════════════ */

// Zeitraum-Range in Tage umrechnen
function _fpRangeToDays(range) {
  switch (range) {
    case '4W':  return 28;
    case '12W': return 84;
    case '6M':  return 182;
    case '1J':  return 365;
    case 'all': return Infinity;
    default:    return 84;
  }
}

// Sessions im Zeitraum filtern (ab refDate rückwärts)
function _fpFilterSessions(profile, range) {
  const sessions = profile.sessions || [];
  if (sessions.length === 0) return [];
  // Anker = neueste Session (Prototyp-Konsistenz)
  const dates = sessions.map(s => _parseDE(s.date)).filter(Boolean);
  if (!dates.length) return [];
  const anchor = new Date(Math.max(...dates));
  const days = _fpRangeToDays(range);
  if (days === Infinity) return sessions.slice();
  const cutoff = new Date(anchor);
  cutoff.setDate(cutoff.getDate() - days);
  return sessions.filter(s => {
    const d = _parseDE(s.date);
    return d && d >= cutoff && d <= anchor;
  });
}

// Exercise-Daten aus gefilterten Sessions aggregieren
// Gibt Map { exerciseName → { entries: [{date, maxKg, 1rm, vol, ts}], totalVol, totalSets } }
function _fpAggregateByExercise(sessions) {
  const map = {};
  sessions.forEach(s => {
    const ts = _parseDE(s.date)?.getTime() || 0;
    (s.exercises || []).forEach(ex => {
      if (!map[ex.name]) {
        map[ex.name] = { name: ex.name, muscle: ex.muscle || '', entries: [], totalVol: 0, totalSets: 0 };
      }
      let maxKg = 0, best1RM = 0, exVol = 0;
      (ex.sets || []).forEach(set => {
        map[ex.name].totalSets++;
        const kg = Number(set.gewicht) || 0;
        const wdh = Number(set.wdh) || 0;
        if (kg > 0 && wdh > 0) {
          exVol += kg * wdh;
          if (kg > maxKg) maxKg = kg;
          const orm = kg * (1 + wdh / 30);
          if (orm > best1RM) best1RM = orm;
        }
      });
      map[ex.name].totalVol += exVol;
      if (maxKg > 0) {
        map[ex.name].entries.push({
          date: s.date, ts, maxKg,
          oneRM: Math.round(best1RM * 10) / 10,
          vol: exVol
        });
      }
    });
  });
  // Entries pro Übung chronologisch sortieren
  Object.values(map).forEach(ex => { ex.entries.sort((a, b) => a.ts - b.ts); });
  return map;
}

// Overview-Stats berechnen (Einheiten, Sätze, Volumen, PRs)
// WICHTIG: profile wird für die PR-Berechnung gebraucht, weil ein "echter" PR
// ein neuer All-Time-High ist — nicht nur eine Verbesserung innerhalb des
// Filter-Zeitraums. Dafür muss die gesamte History gesehen werden.
function _fpComputeOverview(sessions, exerciseMap, profile) {
  let totalSets = 0, totalVol = 0;
  sessions.forEach(s => {
    (s.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(set => {
        totalSets++;
        const kg = Number(set.gewicht) || 0;
        const wdh = Number(set.wdh) || 0;
        if (kg > 0 && wdh > 0) totalVol += kg * wdh;
      });
    });
  });

  // ─── PR-Zählung: All-Time-Highs im aktuellen Zeitraum ──────────────────
  // 1. Alle Sessions der gesamten History chronologisch durchlaufen
  // 2. Pro Übung einen Running-Max (bestes 1RM) mitführen
  // 3. Jedes Mal, wenn eine Session das bisherige Maximum schlägt, ist das
  //    ein PR-Event. Timestamp + Übungsname merken.
  // 4. Am Ende zählen, wie viele dieser PR-Events im gefilterten Zeitraum
  //    liegen (also in der `sessions`-Liste, die der Aufrufer übergibt).
  let prs = 0;
  if (profile) {
    const _ts = s => _parseDE(s.date)?.getTime() || 0;
    const allSorted = (profile.sessions || [])
      .slice()
      .sort((a, b) => _ts(a) - _ts(b));

    const prEventKeys = new Set(); // "ts|exName" für jedes PR-Event
    const runningMax = {};         // exName → bestes bisheriges 1RM

    allSorted.forEach(s => {
      const ts = _ts(s);
      (s.exercises || []).forEach(ex => {
        // Bestes 1RM dieser Session-Übung ermitteln
        let sessionBest = 0;
        (ex.sets || []).forEach(set => {
          const oneRM = _calc1RM(Number(set.gewicht) || 0, Number(set.wdh) || 0);
          if (oneRM > sessionBest) sessionBest = oneRM;
        });
        if (sessionBest <= 0) return;

        const prev = runningMax[ex.name] || 0;
        if (sessionBest > prev + 0.01) { // kleine Epsilon gegen FP-Jitter
          runningMax[ex.name] = sessionBest;
          prEventKeys.add(ts + '|' + ex.name);
        }
      });
    });

    // Jetzt zählen, wie viele PR-Events in den gefilterten Sessions stecken
    sessions.forEach(s => {
      const ts = _ts(s);
      (s.exercises || []).forEach(ex => {
        if (prEventKeys.has(ts + '|' + ex.name)) prs++;
      });
    });
  }

  return { sessions: sessions.length, sets: totalSets, volume: totalVol, prs };
}

// Mini-Sparkline als Inline-SVG rendern (für die Top-Liste)
// entries: [{oneRM, maxKg, ts, ...}], chronologisch sortiert
function _fpSparkline(entries, width = 140, height = 32) {
  if (!entries || entries.length < 2) {
    return `<svg class="fp-sparkline" viewBox="0 0 ${width} ${height}"
            preserveAspectRatio="none"></svg>`;
  }
  const values = entries.map(e => e.oneRM);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const dx = width / (values.length - 1);
  const pad = 3;

  const pts = values.map((v, i) => {
    const x = i * dx;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = 'M ' + pts.join(' L ');
  const areaPath = linePath + ` L ${width},${height} L 0,${height} Z`;

  return `
    <svg class="fp-sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"
         style="color: var(--accent);">
      <path d="${areaPath}" fill="currentColor" opacity="0.15"/>
      <path d="${linePath}" stroke="currentColor" stroke-width="1.5" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

// Trend über die Einträge einer Übung ermitteln: up / down / flat
function _fpTrend(entries) {
  if (!entries || entries.length < 2) return 'flat';
  const first = entries[0].oneRM;
  const last  = entries[entries.length - 1].oneRM;
  if (!first) return 'flat';
  const pct = ((last - first) / first) * 100;
  if (pct > 5)  return 'up';
  if (pct < -5) return 'down';
  return 'flat';
}

// PR / Stagnation erkennen für die letzten Einträge
function _fpPrStatus(entries) {
  if (!entries || entries.length < 2) return null;
  const last = entries[entries.length - 1];
  const prev = entries[entries.length - 2];
  if (last.maxKg > prev.maxKg) return { type: 'pr', value: last.maxKg };
  if (entries.length >= 3) {
    const l3 = entries.slice(-3);
    if (l3.every(e => e.maxKg === l3[0].maxKg) && l3[0].maxKg > 0) {
      return { type: 'stag', value: l3[0].maxKg };
    }
  }
  return null;
}

// Zeitraum-Label in lesbaren Text umwandeln
function _fpRangeLabel(range) {
  switch (range) {
    case '4W':  return 'letzte 4 Wochen';
    case '12W': return 'letzte 12 Wochen';
    case '6M':  return 'letzte 26 Wochen';
    case '1J':  return 'letztes Jahr';
    case 'all': return 'gesamter Zeitraum';
    default:    return '';
  }
}

let _fpChart = null;
let _fpMiniCharts = { sessions: null, sets: null, volume: null, prs: null };

// ─── Mini-Chart für Overview-Karten zeichnen ─────────────────
function _fpDrawMiniChart(canvasId, labels, data, chartKey, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (_fpMiniCharts[chartKey]) { _fpMiniCharts[chartKey].destroy(); _fpMiniCharts[chartKey] = null; }

  const ctx = canvas.getContext('2d');
  const style = getComputedStyle(document.body);
  const accent = color || style.getPropertyValue('--accent').trim();
  const textCol = style.getPropertyValue('--text-3').trim();
  const borderSub = style.getPropertyValue('--border-subtle').trim();

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.parentElement.offsetHeight || 100);
  gradient.addColorStop(0, accent + '30');
  gradient.addColorStop(1, accent + '05');

  _fpMiniCharts[chartKey] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: accent,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: data.length > 20 ? 0 : 2,
        pointHoverRadius: 4,
        pointBackgroundColor: accent,
        pointBorderColor: 'transparent'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: style.getPropertyValue('--surface-2').trim(),
        titleColor: textCol,
        bodyColor: style.getPropertyValue('--text').trim(),
        borderColor: borderSub,
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        callbacks: { title: items => items[0]?.label || '' }
      }},
      scales: {
        x: { display: false },
        y: { display: false, beginAtZero: true }
      },
      interaction: { mode: 'index', intersect: false }
    }
  });
}

// ─── Auto-Aggregation je nach Range ─────────────
function _fpAutoAgg(range) {
  switch (range) {
    case '4W':  return 'day';
    case '12W': return 'week';
    case '6M':  return 'week';
    case '1J':  return 'month';
    case 'all': return 'quarter';
    default:    return 'week';
  }
}

// ─── Sessions nach Tagen/Wochen/Monaten/Quartalen aggregieren ─────────────
function _fpAggregateTimeSeries(sessions, mode, profile) {
  const buckets = new Map();
  const _ts = s => _parseDE(s.date)?.getTime() || 0;

  // PR-Events berechnen (All-Time-Highs)
  const allSorted = (profile.sessions || []).slice().sort((a, b) => _ts(a) - _ts(b));
  const runningMax = {};
  const prEvents = new Set();
  allSorted.forEach(s => {
    const ts = _ts(s);
    (s.exercises || []).forEach(ex => {
      let best = 0;
      (ex.sets || []).forEach(set => {
        const orm = _calc1RM(Number(set.gewicht) || 0, Number(set.wdh) || 0);
        if (orm > best) best = orm;
      });
      if (best <= 0) return;
      if (!runningMax[ex.name] || best > runningMax[ex.name]) {
        runningMax[ex.name] = best;
        prEvents.add(ts + '|' + ex.name);
      }
    });
  });

  sessions.forEach(s => {
    const d = _parseDE(s.date);
    if (!d) return;
    const iso = _isoWeek(d);
    const ts = d.getTime();
    let key, label;
    if (mode === 'day') {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      key = d.getFullYear() + '_' + mm + '_' + dd;
      label = dd + '.' + mm + '.';
    } else if (mode === 'month') {
      key = d.getFullYear() + '_' + String(d.getMonth() + 1).padStart(2, '0');
      label = _MONTH_DE[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2);
    } else if (mode === 'quarter') {
      const q = Math.ceil(iso.week / 13);
      key = iso.year + '_Q' + q;
      label = 'Q' + q + ' ' + iso.year;
    } else {
      key = iso.year + '_' + String(iso.week).padStart(2, '0');
      label = 'KW ' + iso.week;
    }
    if (!buckets.has(key)) buckets.set(key, { key, label, sessions: 0, sets: 0, volume: 0, prs: 0 });
    const b = buckets.get(key);
    b.sessions++;
    (s.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(set => {
        b.sets++;
        const kg = Number(set.gewicht) || 0;
        const wdh = Number(set.wdh) || 0;
        if (kg > 0 && wdh > 0) b.volume += kg * wdh;
      });
      // PR-Check
      let best = 0;
      (ex.sets || []).forEach(set => {
        const orm = _calc1RM(Number(set.gewicht) || 0, Number(set.wdh) || 0);
        if (orm > best) best = orm;
      });
      if (best > 0 && prEvents.has(ts + '|' + ex.name)) b.prs++;
    });
  });

  return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function renderFortschritt(profile) {
  if (!profile) return;

  // ─── Profil-Badge ──────────────────────────────
  const badgeEl = document.getElementById('fpProfileBadge');
  if (badgeEl) {
    const firstName = (profile.name || 'Athlet').split(' ')[0];
    badgeEl.textContent = firstName;
  }

  const sessions = _fpFilterSessions(profile, state.fpRange);
  const exerciseMap = _fpAggregateByExercise(sessions);
  const overview = _fpComputeOverview(sessions, exerciseMap, profile);
  const aggMode = _fpAutoAgg(state.fpRange);

  // ─── Overview Mini-Charts ──────────────────────
  const timeSeries = _fpAggregateTimeSeries(sessions, aggMode, profile);
  const labels = timeSeries.map(b => b.label);

  document.getElementById('fpStatSessions').textContent = _fmtNum(overview.sessions);
  document.getElementById('fpStatSets').textContent = _fmtNum(overview.sets);
  document.getElementById('fpStatVolume').textContent =
    overview.volume > 0 ? (Math.round(overview.volume / 1000 * 10) / 10).toLocaleString('de-DE') + ' t' : '0';
  document.getElementById('fpStatPrs').textContent = _fmtNum(overview.prs);

  const style = getComputedStyle(document.body);
  const accent = style.getPropertyValue('--accent').trim();
  const success = style.getPropertyValue('--success').trim();
  const warning = style.getPropertyValue('--warning').trim();

  _fpDrawMiniChart('fpChartSessions', labels, timeSeries.map(b => b.sessions), 'sessions', accent);
  _fpDrawMiniChart('fpChartSets', labels, timeSeries.map(b => b.sets), 'sets', accent);
  _fpDrawMiniChart('fpChartVolume', labels, timeSeries.map(b => Math.round(b.volume / 1000)), 'volume', success);
  _fpDrawMiniChart('fpChartPrs', labels, timeSeries.map(b => b.prs), 'prs', warning);

  // ─── Exercise-Select befüllen ───────────────────
  const select = document.getElementById('fpExerciseSelect');
  if (select) {
    const exercises = Object.values(exerciseMap)
      .filter(ex => ex.entries.length > 0)
      .sort((a, b) => b.totalVol - a.totalVol);
    // Default-Auswahl: bisher gewählte Übung falls noch vorhanden, sonst die top-1
    let current = state.fpExercise;
    if (!exercises.some(e => e.name === current)) {
      current = exercises[0]?.name || '';
      state.fpExercise = current;
      if (current) localStorage.setItem(STORAGE_KEYS.fpExercise, current);
    }
    select.innerHTML =
      '<option value="">— Übung wählen —</option>' +
      exercises.map(ex =>
        `<option value="${escapeHtml(ex.name)}"${ex.name === current ? ' selected' : ''}>${escapeHtml(ex.name)}</option>`
      ).join('');
  }

  // ─── Chart zeichnen ─────────────────────────────
  _fpDrawChart(exerciseMap);

  // ─── Top-Liste mit Sparklines, PR-Badges, Trend-Pfeilen ────
  const topEl = document.getElementById('fpTopList');
  if (topEl) {
    const exercises = Object.values(exerciseMap)
      .filter(ex => ex.entries.length > 0)
      .sort((a, b) => b.totalVol - a.totalVol)
      .slice(0, 5);
    if (exercises.length === 0) {
      topEl.innerHTML = '<div class="fp-top-empty">Keine Daten im gewählten Zeitraum.</div>';
    } else {
      topEl.innerHTML = exercises.map(ex => {
        const lastRM = ex.entries[ex.entries.length - 1]?.oneRM || 0;
        const trend  = _fpTrend(ex.entries);
        const pr     = _fpPrStatus(ex.entries);
        const spark  = _fpSparkline(ex.entries);
        const isActive = ex.name === state.fpExercise;

        const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
        const trendClass = 'fp-trend-' + trend;

        let badge = '';
        if (pr?.type === 'pr')   badge = `<span class="fp-pr-badge fp-pr-new">PR · ${pr.value} kg</span>`;
        if (pr?.type === 'stag') badge = `<span class="fp-pr-badge fp-pr-stag">Stagnation</span>`;

        return `
          <div class="fp-top-item${isActive ? ' fp-top-active' : ''}" data-exercise="${escapeHtml(ex.name)}">
            <div class="fp-top-left">
              <div class="fp-top-name">${escapeHtml(ex.name)}${_getBwFactor(ex.name) ? ' <span class="tp-set-bw-tag">(BW)</span>' : ''}</div>
              ${badge}
            </div>
            <div class="fp-top-spark">${spark}</div>
            <div class="fp-top-right">
              <div class="fp-top-stats">
                <span>${_fmtNum(ex.totalSets)}<span class="fp-top-stat-unit">Sätze</span></span>
                <span>${(ex.totalVol / 1000).toFixed(1)}<span class="fp-top-stat-unit">t</span></span>
                <span>${lastRM > 0 ? Math.round(lastRM) : '—'}<span class="fp-top-stat-unit">kg 1RM</span></span>
              </div>
              <div class="fp-top-trend ${trendClass}" title="Trend ${trend}">${trendIcon}</div>
            </div>
          </div>`;
      }).join('');
    }
  }

  console.log('[Fortschritt] gerendert', {
    range: state.fpRange,
    sessions: overview.sessions,
    sets: overview.sets,
    volumeT: (overview.volume / 1000).toFixed(1),
    prs: overview.prs,
    exerciseCount: Object.keys(exerciseMap).length,
    activeExercise: state.fpExercise
  });

  // Zeitvergleich + Standards immer rendern (Dashboard-Flow)
  renderCompare();
  renderStandards();
}

// Chart für die ausgewählte Übung zeichnen
function _fpDrawChart(exerciseMap) {
  const canvas = document.getElementById('fpChart');
  const emptyEl = document.getElementById('fpChartEmpty');
  const subEl = document.getElementById('fpChartSub');
  if (!canvas || typeof Chart === 'undefined') return;

  const name = state.fpExercise;
  const ex = exerciseMap[name];

  if (_fpChart) { _fpChart.destroy(); _fpChart = null; }

  if (!ex || !ex.entries || ex.entries.length === 0) {
    if (emptyEl) emptyEl.style.display = '';
    if (subEl) subEl.textContent = '· wähle eine Übung';
    canvas.style.display = 'none';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  canvas.style.display = '';
  const bwF = _getBwFactor(name);
  if (subEl) {
    const bwInfo = bwF ? ` · BW ${Math.round((Number(state.profile?.gewicht) || 80) * bwF)} kg (×${bwF})` : '';
    subEl.textContent = '· ' + name + bwInfo;
  }

  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const accent    = css.getPropertyValue('--accent').trim();
  const accentDim = css.getPropertyValue('--accent-dim').trim();
  const success   = css.getPropertyValue('--success').trim();
  const warning   = css.getPropertyValue('--warning').trim();
  const text3     = css.getPropertyValue('--text-3').trim();
  const borderSub = css.getPropertyValue('--border-subtle').trim();
  const surface1  = css.getPropertyValue('--surface-1').trim();
  const textMain  = css.getPropertyValue('--text').trim();

  // Adaptiv aggregieren: KW bei kurzem Range, Monat bei langem
  const chartAgg = (state.fpRange === '1J' || state.fpRange === 'all') ? 'month' : 'week';
  const byBucket = new Map();
  ex.entries.forEach(e => {
    const d = new Date(e.ts);
    const iso = _isoWeek(d);
    let key, label, sortKey;
    if (chartAgg === 'month') {
      const m = d.getMonth();
      key = d.getFullYear() + '_' + String(m + 1).padStart(2, '0');
      label = _MONTH_DE[m] + ' ' + String(d.getFullYear()).slice(2);
      sortKey = d.getFullYear() * 100 + m;
    } else {
      key = iso.year * 100 + iso.week;
      label = 'KW ' + iso.week;
      sortKey = key;
    }
    const cur = byBucket.get(key);
    if (!cur || e.oneRM > cur.oneRM) {
      byBucket.set(key, { year: iso.year, week: iso.week, oneRM: e.oneRM, maxKg: e.maxKg, date: e.date, label, sortKey });
    } else if (e.oneRM === cur.oneRM && e.maxKg > cur.maxKg) {
      cur.maxKg = e.maxKg;
    }
  });
  const points = Array.from(byBucket.values()).sort((a, b) => a.sortKey - b.sortKey);

  const labels = points.map(p => p.label);
  const data = points.map(p => p.oneRM);

  // Peak/Dip-Erkennung (wie bei den Balance-Peaks im Cockpit früher)
  const mean = data.reduce((a, b) => a + b, 0) / (data.length || 1);
  const variance = data.reduce((a, b) => a + (b - mean) ** 2, 0) / (data.length || 1);
  const stdDev = Math.sqrt(variance);
  const peakThresh = mean + stdDev * 0.6;
  const dipThresh  = mean - stdDev * 0.6;

  const kinds = data.map((v, i) => {
    const left  = i > 0              ? data[i - 1] :  Infinity;
    const right = i < data.length - 1 ? data[i + 1] :  Infinity;
    if (v > peakThresh && v > left && v > right) return 'peak';
    if (v < dipThresh  && v < left && v < right) return 'dip';
    return 'normal';
  });

  const pointColors = kinds.map(k => k === 'peak' ? success : k === 'dip' ? warning : accent);
  const manyPoints = points.length > 30;
  const pointRadii  = kinds.map(k => {
    if (manyPoints) return k === 'normal' ? 0 : 3; // nur Peaks/Dips sichtbar
    return k === 'normal' ? 3 : 4;
  });

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.parentElement.clientHeight || 280);
  gradient.addColorStop(0, accentDim);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  _fpChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: accent,
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: pointRadii,
        pointHoverRadius: 6,
        pointBackgroundColor: pointColors,
        pointBorderColor: surface1,
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 450 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: surface1,
          borderColor: borderSub,
          borderWidth: 1,
          titleColor: text3,
          bodyColor: textMain,
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          titleFont: { family: "'JetBrains Mono', monospace", size: 10, weight: '500' },
          bodyFont:  { family: "'Inter', sans-serif", size: 13, weight: '600' },
          callbacks: {
            title: items => {
              const p = points[items[0].dataIndex];
              return 'KW ' + p.week + ' · ' + p.year;
            },
            label: item => {
              const p = points[item.dataIndex];
              const bwF = _getBwFactor(name);
              const lines = ['Est. 1RM: ' + Math.round(item.parsed.y) + ' kg'];
              if (bwF) {
                const bw = Number(state.profile?.gewicht) || 80;
                const bwBase = Math.round(bw * bwF);
                const zusatz = Math.round(p.maxKg - bwBase);
                lines.push('Max: ' + _fmtKg(p.maxKg) + ' kg (BW ' + bwBase + (zusatz > 0 ? ' + ' + zusatz : '') + ')');
              } else {
                lines.push('Max: ' + _fmtKg(p.maxKg) + ' kg');
              }
              return lines;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: text3,
            font: { family: "'JetBrains Mono', monospace", size: 10 },
            maxRotation: 0,
            autoSkip: true,
            autoSkipPadding: 24,
            maxTicksLimit: 12
          }
        },
        y: {
          grid: { color: borderSub },
          border: { display: false },
          ticks: {
            color: text3,
            font: { family: "'JetBrains Mono', monospace", size: 10 },
            callback: v => v + ' kg',
            maxTicksLimit: 5,
            padding: 8
          }
        }
      },
      interaction: { mode: 'index', intersect: false }
    }
  });
}


