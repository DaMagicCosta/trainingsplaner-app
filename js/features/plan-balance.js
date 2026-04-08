import { _fmtKg } from '../utils.js';
import { MUSCLE_MAP } from '../data/muscle-map.js';
import { _allGroups } from './muscle-balance.js';

export { buildPlanBalance };

/* ═══════════════════════════════════════════════════════
   PLANUNGS-BALANCE (Sätze pro Muskelgruppe pro Woche)
   ═══════════════════════════════════════════════════════ */

function buildPlanBalance(profile) {
  const wrap = document.getElementById('jpBalContent');
  const preview = document.getElementById('jpBalPreview');
  const subEl = document.getElementById('jpBalSub');
  if (!wrap || !preview) return;

  const plans = profile.plans || {};
  // Alle Pläne mit Übungen sammeln (Durchschnitt über gesamten Planzeitraum)
  const genPlans = [];
  for (let kw = 1; kw <= 52; kw++) {
    const p = plans['w' + kw];
    if (p && p.days && p.days.length > 0) genPlans.push(p);
  }

  if (genPlans.length === 0) {
    preview.removeAttribute('data-has-data');
    return;
  }

  // Sätze pro Muskelgruppe über alle geplanten Wochen mitteln
  const setsByGroup = {};
  let totalWeeks = genPlans.length;

  genPlans.forEach(plan => {
    (plan.days || []).forEach(day => {
      (day.exercises || []).forEach(ex => {
        const groups = _allGroups(ex);
        const saetze = Number(ex.saetze) || 3;
        groups.forEach(g => {
          setsByGroup[g] = (setsByGroup[g] || 0) + saetze;
        });
      });
    });
  });

  // Durchschnitt pro Woche
  Object.keys(setsByGroup).forEach(g => {
    setsByGroup[g] = Math.round(setsByGroup[g] / totalWeeks * 10) / 10;
  });

  if (subEl) subEl.textContent = `· ø Sätze pro Woche · ${totalWeeks} geplante Wochen`;

  // Render-Helper: Balance-Row für Sätze
  function renderPlanRow(pair, opts = {}) {
    const lSets = pair.lGroups.reduce((a, g) => a + (setsByGroup[g] || 0), 0);
    const rSets = pair.rGroups.reduce((a, g) => a + (setsByGroup[g] || 0), 0);
    const total = lSets + rSets;
    const rowClass = opts.master ? 'bal-row bal-row-master' : 'bal-row';
    const warnAt = opts.warnAt ?? 20;
    const dangerAt = opts.dangerAt ?? 40;

    if (total === 0) {
      return `
        <div class="${rowClass}">
          <div class="bal-label bal-label-l">${pair.l}</div>
          <div class="bal-track"><div class="bal-fill-l" style="width:0"></div><div class="bal-fill-r" style="width:0"></div></div>
          <div class="bal-label bal-label-r">${pair.r}</div>
          <div class="bal-meta">
            <span class="bal-meta-l">—</span>
            <span class="bal-meta-c">keine Übungen</span>
            <span class="bal-meta-r">—</span>
          </div>
        </div>`;
    }

    const lPct = Math.round((lSets / total) * 100);
    const rPct = 100 - lPct;
    const skew = Math.abs(lPct - rPct);
    const skewTag =
      skew >= dangerAt ? ' · <span class="skew-tag">Dysbalance</span>' :
      skew >= warnAt   ? ' · <span class="skew-tag">Schieflage</span>' :
      '';

    const lFmt = lSets % 1 === 0 ? lSets : lSets.toFixed(1);
    const rFmt = rSets % 1 === 0 ? rSets : rSets.toFixed(1);

    return `
      <div class="${rowClass}">
        <div class="bal-label bal-label-l">${pair.l}</div>
        <div class="bal-track">
          <div class="bal-fill-l" style="width:${lPct}%"></div>
          <div class="bal-fill-r" style="width:${rPct}%"></div>
        </div>
        <div class="bal-label bal-label-r">${pair.r}</div>
        <div class="bal-meta">
          <span class="bal-meta-l">${lPct}% · ${lFmt} S.</span>
          <span class="bal-meta-c">${skew < warnAt ? 'ausgewogen' : 'Schwerpunkt: ' + (lPct > rPct ? pair.l : pair.r)}${skewTag}</span>
          <span class="bal-meta-r">${rFmt} S. · ${rPct}%</span>
        </div>
      </div>`;
  }

  // Antagonisten + Ober/Unter rendern
  let html = '';

  // 4 Antagonisten-Paare + Ober/Unter in einer Rubrik
  const upperGroups = ['Brust', 'Rücken', 'Bizeps', 'Trizeps', 'Vordere Schulter', 'Hintere Schulter', 'Seitliche Schulter'];
  const lowerGroups = ['Quadrizeps', 'Hamstrings', 'Waden', 'Unt. Rücken'];

  ANTAGONIST_PAIRS.forEach(pair => {
    html += renderPlanRow(pair);
  });
  html += renderPlanRow({
    l: 'Oberkörper', lGroups: upperGroups,
    r: 'Unterkörper', rGroups: lowerGroups
  }, { warnAt: 30, dangerAt: 50 });

  // Volume Landmarks Referenz
  html += `<div class="jp-bal-landmark">
    Volume Landmarks (Hypertrophie): <span>&lt; 10 S./Wo = wenig</span> · <span>10–20 S./Wo = optimal</span> · <span>&gt; 20 S./Wo = viel</span>
  </div>`;

  wrap.innerHTML = html;
  void wrap.offsetHeight;
  preview.setAttribute('data-has-data', '');

  console.log('[PlanBalance] gerendert', { setsByGroup, totalWeeks });
}


