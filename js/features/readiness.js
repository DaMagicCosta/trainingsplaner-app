import { _parseDE, _isoWeek } from '../utils.js';

export { calculateReadiness };

/* ═══════════════════════════════════════════════════════
   READINESS / FATIGUE SCORE
   Portiert aus Original-App (calculateFatigueScore).
   4 gewichtete Komponenten, Baseline 70, Clamp 0–100.
   ═══════════════════════════════════════════════════════ */

function calculateReadiness(profile, refDate) {
  const sessions = (profile && profile.sessions) || [];
  if (sessions.length < 3) return null;

  // Neueste zuerst sortieren
  const sorted = sessions.slice().sort((a, b) => {
    const ta = _parseDE(a.date)?.getTime() || 0;
    const tb = _parseDE(b.date)?.getTime() || 0;
    return tb - ta;
  });

  let score = 70; // Baseline

  // ─── 1. RPE-Trend (35 %) — letzte 3 Sessions ──────
  const rpeValues = [];
  sorted.slice(0, 3).forEach(s => {
    (s.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(set => {
        if (set.rpe) rpeValues.push(set.rpe);
      });
    });
  });
  const rpeComp = { label: 'RPE', value: 0, detail: '' };
  if (rpeValues.length > 0) {
    const avgRPE = Math.round((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10) / 10;
    if (avgRPE >= 9)      { rpeComp.value = -25; rpeComp.detail = `avg ${avgRPE} · sehr hoch`; }
    else if (avgRPE >= 8) { rpeComp.value = -12; rpeComp.detail = `avg ${avgRPE} · hoch`; }
    else if (avgRPE >= 7) { rpeComp.value =  -5; rpeComp.detail = `avg ${avgRPE} · moderat`; }
    else if (avgRPE >= 5) { rpeComp.value =   5; rpeComp.detail = `avg ${avgRPE} · gut`; }
    else                  { rpeComp.value =   8; rpeComp.detail = `avg ${avgRPE} · leicht`; }
  } else {
    rpeComp.detail = 'keine RPE-Daten';
  }
  score += rpeComp.value;

  // ─── 2. Volumen-Trend (25 %) — letzte 3 vs vorherige 3 ──
  const volComp = { label: 'VOL', value: 0, detail: '' };
  if (sorted.length >= 6) {
    let recentVol = 0, olderVol = 0;
    sorted.slice(0, 3).forEach(s => {
      (s.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(set => {
          if (set.gewicht && set.wdh) recentVol += set.gewicht * set.wdh;
        });
      });
    });
    sorted.slice(3, 6).forEach(s => {
      (s.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(set => {
          if (set.gewicht && set.wdh) olderVol += set.gewicht * set.wdh;
        });
      });
    });
    if (olderVol > 0) {
      const volChange = Math.round((recentVol / olderVol - 1) * 100);
      if (volChange > 15)       { volComp.value = -10; volComp.detail = `+${volChange} % · Overreaching`; }
      else if (volChange > -10) { volComp.value =   5; volComp.detail = `${volChange >= 0 ? '+' : ''}${volChange} % · stabil`; }
      else                      { volComp.value =  -3; volComp.detail = `${volChange} % · Rückgang`; }
    } else {
      volComp.detail = 'zu wenig Daten';
    }
  } else {
    volComp.detail = 'mind. 6 Sessions nötig';
  }
  score += volComp.value;

  // ─── 3. Frequenz (20 %) — 14 Tage ab refDate ───────
  const freqComp = { label: 'FREQ', value: 0, detail: '' };
  const fourteenDaysAgo = new Date(refDate);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const recentCount = sorted.filter(s => {
    const t = _parseDE(s.date);
    return t && t >= fourteenDaysAgo && t <= refDate;
  }).length;
  if (recentCount === 0)      { freqComp.value = -12; freqComp.detail = '0 Einheiten'; }
  else if (recentCount <= 2)  { freqComp.value =   0; freqComp.detail = `${recentCount} Einheiten`; }
  else if (recentCount <= 5)  { freqComp.value =   8; freqComp.detail = `${recentCount} Einheiten · gut`; }
  else                        { freqComp.value =  -5; freqComp.detail = `${recentCount} Einheiten · Vorsicht`; }
  score += freqComp.value;

  // ─── 4. Stagnation (20 %) ──────────────────────────
  const stagComp = { label: 'STAG', value: 0, detail: '' };
  const exMaxByName = {};
  sessions.forEach(s => {
    (s.exercises || []).forEach(ex => {
      if (!exMaxByName[ex.name]) exMaxByName[ex.name] = [];
      let maxKg = 0;
      (ex.sets || []).forEach(set => { if (set.gewicht && set.gewicht > maxKg) maxKg = set.gewicht; });
      if (maxKg > 0) {
        exMaxByName[ex.name].push({ ts: _parseDE(s.date)?.getTime() || 0, maxKg });
      }
    });
  });
  let stagCount = 0;
  Object.keys(exMaxByName).forEach(name => {
    const arr = exMaxByName[name].sort((a, b) => a.ts - b.ts);
    if (arr.length >= 3) {
      const l3 = arr.slice(-3);
      if (l3[0].maxKg === l3[1].maxKg && l3[1].maxKg === l3[2].maxKg) stagCount++;
    }
  });
  if (stagCount === 0)      { stagComp.value =  8; stagComp.detail = 'keine'; }
  else if (stagCount <= 2)  { stagComp.value =  0; stagComp.detail = `${stagCount} Übung${stagCount > 1 ? 'en' : ''}`; }
  else                      { stagComp.value = -8; stagComp.detail = `${stagCount} Übungen · kritisch`; }
  score += stagComp.value;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let state, label, recommendation;
  if (score >= 70) {
    state = 'fit';
    label = 'Bereit für intensives Training';
    recommendation = 'Progressive Überladung fortführen.';
  } else if (score >= 40) {
    state = 'warn';
    label = 'Belastet — moderates Training';
    recommendation = 'Fokus auf Technik, Volumen leicht reduzieren.';
  } else {
    state = 'danger';
    label = 'Überlastet — Deload empfohlen';
    recommendation = 'Volumen und Intensität um 40–50 % reduzieren.';
  }

  return {
    score,
    state,
    label,
    recommendation,
    components: [rpeComp, volComp, freqComp, stagComp]
  };
}
