import { state } from '../state.js';
import { toast, _parseDE, _fmtKg } from '../utils.js';
import { MUSCLE_MAP, ANTAGONIST_PAIRS, SOLO_GROUPS, BALANCE_VIEWS } from '../data/muscle-map.js';

export { _allGroups, _getBwFactor, _effectiveWeight, buildMuscleBalance };


// Alle Muskelgruppen einer Übung → Set von kanonischen Gruppen
function _allGroups(exercise) {
  const parts = (exercise.muscle || '').split(',').map(s => s.trim());
  const groups = new Set();
  parts.forEach(raw => {
    const g = MUSCLE_MAP[raw];
    if (g) groups.add(g);
  });
  return groups;
}

// BW-Faktor einer Übung aus dem Lexikon (0 = kein Bodyweight)
function _getBwFactor(exerciseName) {
  const ex = _lxAllExercises().find(e => e.name === exerciseName);
  return ex?.bwFactor ?? 0;
}

// Effektives Gewicht: BW × Faktor + Zusatzgewicht (oder nur Gewicht wenn kein BW)
function _effectiveWeight(exerciseName, zusatz, profile) {
  const factor = _getBwFactor(exerciseName);
  if (!factor) return Number(zusatz) || 0;
  const bw = Number(profile?.gewicht) || 80;
  return Math.round(bw * factor + (Number(zusatz) || 0));
}

function buildMuscleBalance(profile, viewKey = 'antagonists', range = '12W') {
  const wrap = document.getElementById('cpBalance');
  const windowEl = document.getElementById('cpBalWindow');
  if (!wrap) return;

  const view = BALANCE_VIEWS[viewKey] || BALANCE_VIEWS.antagonists;
  const sessions = profile.sessions || [];

  // Fenster bestimmen: letzte N ISO-Wochen rückwärts ab neuester Session
  const rangeMap = { '4W': 4, '12W': 12, '6M': 26, '1J': 52 };
  const n = rangeMap[range] || 12;
  const labelMap = { '4W': 'letzte 4 Wochen', '12W': 'letzte 12 Wochen', '6M': 'letzte 26 Wochen', '1J': 'letzte 52 Wochen' };
  if (windowEl) windowEl.textContent = '· ' + (labelMap[range] || '');

  // Neueste Session-Datum = Ankerpunkt
  let anchor = null;
  sessions.forEach(s => {
    const d = _parseDE(s.date);
    if (d && (!anchor || d > anchor)) anchor = d;
  });
  if (!anchor) {
    wrap.innerHTML = '<div class="bal-empty">Keine Daten</div>';
    return;
  }

  // Cutoff = anchor − (n × 7) Tage
  const cutoff = new Date(anchor);
  cutoff.setDate(cutoff.getDate() - n * 7);

  // Volumen pro kanonische Muskelgruppe im Fenster sammeln
  // Jede Übung zählt für ALLE ihre Muskelgruppen (nicht nur die erste)
  const volByGroup = {};
  sessions.forEach(s => {
    const d = _parseDE(s.date);
    if (!d || d < cutoff || d > anchor) return;
    (s.exercises || []).forEach(ex => {
      const groups = _allGroups(ex);
      if (groups.size === 0) return;
      let setsVol = 0;
      (ex.sets || []).forEach(set => {
        setsVol += (Number(set.wdh) || 0) * (Number(set.gewicht) || 0);
      });
      groups.forEach(g => {
        volByGroup[g] = (volByGroup[g] || 0) + setsVol;
      });
    });
  });

  // Hilfsfunktion: eine Balance-Row rendern (klein oder master)
  function renderRow(pair, opts = {}) {
    const lVol = pair.lGroups.reduce((a, g) => a + (volByGroup[g] || 0), 0);
    const rVol = pair.rGroups.reduce((a, g) => a + (volByGroup[g] || 0), 0);
    const total = lVol + rVol;
    const rowClass = opts.master ? 'bal-row bal-row-master' : 'bal-row';
    const warnAt   = opts.warnAt   ?? pair.warnAt   ?? 15;
    const dangerAt = opts.dangerAt ?? pair.dangerAt ?? 30;

    if (total === 0) {
      return `
        <div class="${rowClass}">
          <div class="bal-label bal-label-l">${pair.l}</div>
          <div class="bal-track"><div class="bal-fill-l" style="width:0"></div><div class="bal-fill-r" style="width:0"></div></div>
          <div class="bal-label bal-label-r">${pair.r}</div>
          <div class="bal-meta">
            <span class="bal-meta-l">—</span>
            <span class="bal-meta-c">keine Daten</span>
            <span class="bal-meta-r">—</span>
          </div>
        </div>`;
    }

    const lPct = Math.round((lVol / total) * 100);
    const rPct = 100 - lPct;
    const skew = Math.abs(lPct - rPct);
    const skewTag =
      skew >= dangerAt ? ` · <span class="skew-tag">Dysbalance</span>` :
      skew >= warnAt   ? ` · <span class="skew-tag">Schieflage</span>` :
      '';
    const dominant = lPct > rPct ? pair.l : pair.r;

    return `
      <div class="${rowClass}">
        <div class="bal-label bal-label-l">${pair.l}</div>
        <div class="bal-track">
          <div class="bal-fill-l" style="width:${lPct}%"></div>
          <div class="bal-fill-r" style="width:${rPct}%"></div>
        </div>
        <div class="bal-label bal-label-r">${pair.r}</div>
        <div class="bal-meta">
          <span class="bal-meta-l">${lPct}% · ${_fmtNum(lVol)} kg</span>
          <span class="bal-meta-c">${skew < warnAt ? 'ausgewogen' : 'Schwerpunkt: ' + dominant}${skewTag}</span>
          <span class="bal-meta-r">${_fmtNum(rVol)} kg · ${rPct}%</span>
        </div>
      </div>`;
  }

  // Breakdown für Master-Views: Muskelgruppen je Seite sortiert nach Volumen
  function renderBreakdown(pair) {
    const leftItems = pair.lGroups
      .map(g => ({ name: g, vol: volByGroup[g] || 0 }))
      .filter(it => it.vol > 0)
      .sort((a, b) => b.vol - a.vol);
    const rightItems = pair.rGroups
      .map(g => ({ name: g, vol: volByGroup[g] || 0 }))
      .filter(it => it.vol > 0)
      .sort((a, b) => b.vol - a.vol);
    const lTotal = leftItems.reduce((a, it) => a + it.vol, 0);
    const rTotal = rightItems.reduce((a, it) => a + it.vol, 0);

    const col = (head, total, items, side) => `
      <div class="bal-bd-col">
        <div class="bal-bd-head">
          <span class="bal-bd-dot ${side}"></span>
          ${head.toUpperCase()}
          <span class="bal-bd-head-total">· ${_fmtNum(total)} kg</span>
        </div>
        ${items.length
          ? items.map(it => `
              <div class="bal-bd-item">
                <span class="bal-bd-item-name">${it.name}</span>
                <span class="bal-bd-item-val">${_fmtNum(it.vol)} kg</span>
              </div>
            `).join('')
          : '<div class="bal-bd-item"><span class="bal-bd-item-name" style="color:var(--text-3)">keine Daten</span></div>'
        }
      </div>`;

    return `
      <div class="bal-breakdown">
        ${col(pair.l, lTotal, leftItems, 'l')}
        ${col(pair.r, rTotal, rightItems, 'r')}
      </div>`;
  }

  // ─── Rendern je nach View-Typ ──────────────────────
  let html = '';

  if (view.type === 'pairs') {
    // Antagonisten: 4 feine Paare
    view.pairs.forEach(pair => { html += renderRow(pair); });

    // Solo-Muskeln
    if (view.showSolo) {
      const soloVols = SOLO_GROUPS.map(sg => ({
        label: sg.label,
        vol: sg.groups.reduce((a, g) => a + (volByGroup[g] || 0), 0)
      }));
      const anySolo = soloVols.some(s => s.vol > 0);
      if (anySolo) {
        html += `
          <div class="bal-divider"></div>
          <div class="bal-solo-head">Weitere Muskelgruppen · ohne klassischen Antagonisten</div>
          <div class="bal-solo">
            ${soloVols.map(s => `
              <div class="bal-solo-item">
                <div class="bal-solo-label">${s.label}</div>
                <div class="bal-solo-value">${s.vol > 0 ? _fmtNum(s.vol) + ' kg' : '—'}</div>
              </div>
            `).join('')}
          </div>`;
      }
    }
  } else if (view.type === 'master') {
    // Ober/Unter, Push/Pull, V/H-Kette: eine große Zeile + Hint + Breakdown
    html += renderRow(view.pair, {
      master: true,
      warnAt: view.pair.warnAt,
      dangerAt: view.pair.dangerAt
    });
    if (view.hint) {
      html += `<div class="bal-hint">${view.hint}</div>`;
    }
    html += renderBreakdown(view.pair);
  }

  wrap.innerHTML = html;
  void wrap.offsetHeight; // Samsung Internet: Reflow erzwingen nach DOM-Swap

  console.log('[Balance] gerendert', {
    view: viewKey, range,
    anchor: anchor.toLocaleDateString('de-DE'),
    volByGroup
  });
}


// Window-Brücke für log-session.js + fortschritt.js (temporär)
