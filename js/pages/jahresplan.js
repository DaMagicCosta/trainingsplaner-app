import { state, STORAGE_KEYS, _saveProfile } from '../state.js';
import { toast, _parseDE, _isoWeek, _fmtKg, _fmtNum, _DOW_DE_SHORT, _MONTH_DE } from '../utils.js';

export { renderJahresplan, _calcPeriodization, _isoWeekToMonday, _groupSessionsByKw, _blockClass, _abbrevBlock };

/* ═══════════════════════════════════════════════════════
   JAHRESPLAN — Periodisierungs-Berechnung & Render
   ═══════════════════════════════════════════════════════ */

// Block-Label abkürzen: "Akkumulation (GPP)" → "GPP", "Peak / Skills" → "Peak"
function _abbrevBlock(label) {
  if (!label) return '';
  const paren = label.match(/\(([^)]+)\)/);
  if (paren) return paren[1];
  return label.split(/[\s\/]/)[0];
}

// blockIdx → CSS-Klasse für die Block-Farbe
function _blockClass(idx) {
  const map = ['jp-block-gpp', 'jp-block-spp', 'jp-block-peak', 'jp-block-aux'];
  return map[idx] || 'jp-block-aux';
}

// Monday-Date einer ISO-Woche berechnen
function _isoWeekToMonday(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const target = new Date(mondayOfWeek1);
  target.setUTCDate(target.getUTCDate() + (week - 1) * 7);
  return target;
}

// Berechnet für jede KW 1..52 den Block + relative Woche + Regen-Status
// anhand profile.periodization + profile.regenConfig
function _calcPeriodization(profile) {
  const period = profile?.periodization;
  if (!period || !period.active) return null;

  const startKw = period.startKw || 1;
  const endKw   = period.endKw || 52;
  const blocks  = period.blocks || [];
  if (blocks.length === 0) return null;

  const regenCfg      = profile.regenConfig || {};
  const regenBetween  = regenCfg.regenBetween !== false;
  const athleteRegens = new Set(profile.athleteRegenWeeks || []);

  // Zyklus-Länge berechnen (variable Block-Längen + Regen dazwischen)
  let cycleLength = 0;
  blocks.forEach(b => {
    cycleLength += parseInt(b.length) || 4;
    if (regenBetween) cycleLength += 1;
  });

  const result = {};
  for (let kw = 1; kw <= 52; kw++) {
    const offset = kw - startKw;
    if (offset < 0 || kw > endKw) {
      result[kw] = { kw, isPreStart: true };
      continue;
    }

    // Explizite Athlete-Regen
    if (athleteRegens.has(kw)) {
      result[kw] = { kw, isRegen: true, regenSource: 'athlete' };
      continue;
    }

    // Position innerhalb des geplanten Zeitraums (kein Zyklus-Repeat)
    const cyclePos = offset % cycleLength;
    let pos = 0;
    let found = false;

    for (let i = 0; i < blocks.length; i++) {
      const blen = parseInt(blocks[i].length) || 4;
      const blockEnd = pos + blen;

      if (cyclePos >= pos && cyclePos < blockEnd) {
        const relativeWeek = cyclePos - pos + 1;
        result[kw] = {
          kw, isRegen: false, blockIdx: i,
          blockLabel: _abbrevBlock(blocks[i].label || `Block ${i + 1}`),
          blockFullLabel: blocks[i].label || `Block ${i + 1}`,
          blockGoal: blocks[i].goal || '',
          relativeWeek, blockLength: blen
        };
        found = true;
        break;
      }

      pos = blockEnd;

      // Regen-Woche nach diesem Block?
      if (regenBetween) {
        if (cyclePos === pos) {
          result[kw] = { kw, isRegen: true, regenSource: 'interval' };
          found = true;
          break;
        }
        pos++;
      }
    }

    if (!found) {
      result[kw] = { kw, isPreStart: true };
    }
  }
  return result;
}

// Sessions nach KW gruppieren, liefert Map "kw" → Set(dayIdx)
function _groupSessionsByKw(profile, year) {
  const map = {};
  (profile.sessions || []).forEach(s => {
    const d = _parseDE(s.date);
    if (!d) return;
    const iso = _isoWeek(d);
    if (iso.year !== year) return;
    if (!map[iso.week]) map[iso.week] = new Set();
    map[iso.week].add(s.dayIdx ?? 0);
  });
  return map;
}

function renderJahresplan(profile) {
  if (!profile) return;

  const anchor = new Date();
  const curIso = _isoWeek(anchor);
  const year = curIso.year;
  const currentKw = curIso.week;

  const titleEl = document.getElementById('jpTitle');
  if (titleEl) titleEl.textContent = `Jahresplan ${year}`;

  const period = _calcPeriodization(profile);
  const sessionsByKw = _groupSessionsByKw(profile, year);
  const plans = profile.plans || {};
  const plannedDays = (profile.tage || []).length || 3;

  // ─── Block-Timeline (52 Segmente + Quartals-Marker) ───────────────
  const timelineEl = document.getElementById('jpTimeline');
  if (timelineEl) {
    let tHtml = '';
    for (let kw = 1; kw <= 52; kw++) {
      // Quartals-Trennlinie vor KW 14, 27, 40
      if (kw === 14 || kw === 27 || kw === 40) {
        tHtml += `<div class="jp-seg-qmark" title="Q${kw === 14 ? 2 : kw === 27 ? 3 : 4}"></div>`;
      }
      const p = period ? period[kw] : null;
      const isCurrent = kw === currentKw;
      if (!p || p.isPreStart) {
        tHtml += `<div class="jp-seg" title="KW ${kw}"></div>`;
        continue;
      }
      if (p.isRegen) {
        tHtml += `<div class="jp-seg jp-seg-regen${isCurrent ? ' jp-seg-current' : ''}" title="KW ${kw} · Regen"></div>`;
        continue;
      }
      const cls = _blockClass(p.blockIdx);
      const title = `KW ${kw} · ${p.blockLabel} · W${p.relativeWeek}`;
      tHtml += `<div class="jp-seg ${cls}${isCurrent ? ' jp-seg-current' : ''}" title="${title}"></div>`;
    }
    timelineEl.innerHTML = tHtml;
  }

  // ─── Legende dynamisch aus Periodisierungs-Blöcken ───────────────
  const legendEl = document.querySelector('.jp-timeline-legend');
  if (legendEl && profile.periodization?.blocks?.length) {
    let lHtml = profile.periodization.blocks.map((b, i) => {
      const cls = _blockClass(i);
      const label = b.label || `Block ${i + 1}`;
      return `<span class="jp-legend-item ${cls}"><span class="jp-legend-dot"></span>${label}</span>`;
    }).join('');
    lHtml += '<span class="jp-legend-item"><span class="jp-legend-dot jp-legend-regen"></span>Regen</span>';
    legendEl.innerHTML = lHtml;
  }

  // ─── Quartals-Grids (4 Quartale) ────────────────
  const quartersEl = document.getElementById('jpQuarters');
  if (!quartersEl) return;

  const quarters = [
    { label: 'Q1', start: 1,  end: 13 },
    { label: 'Q2', start: 14, end: 26 },
    { label: 'Q3', start: 27, end: 39 },
    { label: 'Q4', start: 40, end: 52 }
  ];

  // Aktuelles Quartal nach oben sortieren
  const currentQIdx = quarters.findIndex(q => currentKw >= q.start && currentKw <= q.end);
  if (currentQIdx > 0) {
    const reordered = [
      ...quarters.slice(currentQIdx),
      ...quarters.slice(0, currentQIdx)
    ];
    quarters.length = 0;
    quarters.push(...reordered);
  }

  let qHtml = '';
  quarters.forEach(q => {
    qHtml += `<div class="jp-quarter">
      <div class="jp-quarter-head">${q.label} · KW ${q.start}–${q.end}</div>
      <div class="jp-week-grid">`;
    for (let kw = q.start; kw <= q.end; kw++) {
      qHtml += _renderWeekCard(kw, year, period, sessionsByKw, plans, plannedDays, currentKw);
    }
    qHtml += `</div></div>`;
  });
  quartersEl.innerHTML = qHtml;

  // Klick-Listener: Tiefer-Link zum Trainingsplan mit vorausgewählter KW
  quartersEl.querySelectorAll('.jp-week[data-kw]').forEach(card => {
    card.addEventListener('click', () => {
      const kw = parseInt(card.dataset.kw, 10);
      state.tpViewKw = kw;
      state.tpViewDay = 0;
      state.tpEditing = null;
      if (state.profile) renderTrainingsplan(state.profile);
      switchTab('trainingsplan');
    });
  });

  console.log('[Jahresplan] gerendert', { year, currentKw, plansCount: Object.keys(plans).length });
}

// Eine einzelne Woche-Karte rendern
function _renderWeekCard(kw, year, period, sessionsByKw, plans, plannedDays, currentKw) {
  const p = period ? period[kw] : null;
  const monday = _isoWeekToMonday(year, kw);
  const dateStr = `${String(monday.getUTCDate()).padStart(2, '0')} ${_MONTH_DE[monday.getUTCMonth()]}`;
  const kwStr = `KW ${String(kw).padStart(2, '0')}`;
  const isCurrent = kw === currentKw;

  // Regen-Woche
  if (p && p.isRegen) {
    return `
      <div class="jp-week jp-week-regen${isCurrent ? ' jp-week-current' : ''}" data-kw="${kw}">
        <div class="jp-week-kw">${kwStr}</div>
        <div class="jp-week-date">${dateStr}</div>
        <div class="jp-week-block">Regen</div>
      </div>`;
  }

  // Trainingswoche (isPreStart = außerhalb des geplanten Zeitraums)
  const hasBlock = p && !p.isPreStart && p.blockLabel;
  const blockCls = hasBlock ? _blockClass(p.blockIdx) : '';
  const blockLabel = hasBlock ? `${p.blockLabel} · W${p.relativeWeek}` : '—';

  // Location-Icon aus dem Plan-Objekt
  const planObj = plans['w' + kw];
  const locIcons = { studio: '◇', home: '⌂', outdoor: '✦' };
  const planLoc = planObj?._location;
  const locIcon = planLoc ? locIcons[planLoc] || '' : '';

  // Session-Dots: Anzahl der geplanten Tage, gefüllt wenn geloggt
  const kwSessions = sessionsByKw[kw] || new Set();
  let dotsHtml = '';
  if (kw <= currentKw) {
    const dayCount = planObj?.days?.length || plannedDays;
    let dotSpans = '';
    for (let i = 0; i < dayCount; i++) {
      const done = kwSessions.has(i);
      dotSpans += `<span${done ? ' class="done"' : ''}></span>`;
    }
    dotsHtml = `<div class="jp-week-dots">${dotSpans}</div>`;
  }

  return `
    <div class="jp-week ${blockCls}${isCurrent ? ' jp-week-current' : ''}" data-kw="${kw}">
      <div class="jp-week-kw">${kwStr}${locIcon ? ' <span class="jp-week-loc">' + locIcon + '</span>' : ''}</div>
      <div class="jp-week-date">${dateStr}</div>
      <div class="jp-week-block">${blockLabel}</div>
      ${dotsHtml}
    </div>`;
}


