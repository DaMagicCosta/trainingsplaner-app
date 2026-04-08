import { state, _saveProfile } from '../state.js';
import { toast } from '../utils.js';
import { LEXIKON_DATA, _lxAllExercises } from '../data/lexikon-data.js';
import { _allGroups } from './muscle-balance.js';
import { buildPlanBalance } from './plan-balance.js';
import { _parseLocationString } from './profile-edit.js';
import { renderJahresplan } from '../pages/jahresplan.js';
import { renderTrainingsplan } from '../pages/trainingsplan.js';
import { renderCockpit } from '../pages/cockpit.js';

/* ═══════════════════════════════════════════════════════
   WOCHENPLAN-GENERATOR
   ═══════════════════════════════════════════════════════ */
(function initGenerator() {

  // ── Mobile Accordion: Schritte auf-/zuklappen ──
  const pnCards = document.querySelectorAll('.pn-grid .pn-form-card');
  pnCards.forEach((card, i) => {
    // Erster Schritt initial offen
    if (i === 0) card.classList.add('pn-open');
    const label = card.querySelector('.pn-card-label');
    if (label) {
      label.addEventListener('click', () => {
        if (window.innerWidth > 720) return; // nur Mobile
        const wasOpen = card.classList.contains('pn-open');
        pnCards.forEach(c => c.classList.remove('pn-open'));
        if (!wasOpen) {
          card.classList.add('pn-open');
          setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        }
      });
    }
  });

  // ── Balance-Preview Accordion auf Mobile ──
  const balPreview = document.getElementById('jpBalPreview');
  if (balPreview) {
    const balHead = balPreview.querySelector('.card-head');
    if (balHead) {
      balHead.addEventListener('click', () => {
        if (window.innerWidth > 720) return;
        balPreview.classList.toggle('pn-open');
      });
    }
  }

  // ── Vorlagen für neue Blöcke ──
  const BLOCK_TEMPLATES = [
    { label: 'Grundlagen',    goal: 'kraftausdauer', saetze: 3, wdh: 20, color: '#4cc9f0' },
    { label: 'Muskelaufbau', goal: 'hypertrophie', saetze: 4, wdh: 10, color: '#f4a261' },
    { label: 'Maximalkraft',         goal: 'maximalkraft', saetze: 5, wdh: 5,  color: '#9b5de5' },
    { label: 'Kraftausdauer',         goal: 'kraftausdauer', saetze: 3, wdh: 15, color: '#10B981' }
  ];
  const GOAL_PRESETS = {
    kraftausdauer: { saetze: 3, wdh: 20 },
    hypertrophie:  { saetze: 4, wdh: 10 },
    maximalkraft:  { saetze: 5, wdh: 5  },
    allgemein:     { saetze: 3, wdh: 12 }
  };

  const SPLITS = {
    ppl: { days: [
      { label: 'Push', cats: ['p_brust', 'p_schulter'], extras: ['Trizepsdrücken (Kabel)'] },
      { label: 'Pull', cats: ['p_ruecken'], extras: ['Bizeps-Curls (Langhantel)', 'Face Pulls (Kabel)'] },
      { label: 'Legs', cats: ['p_unterkoerper'], extras: ['Wadenheben (stehend)'] }
    ]},
    ok_uk: { days: [
      { label: 'OK', cats: ['p_brust', 'p_schulter', 'p_ruecken', 'p_arme'], extras: [] },
      { label: 'UK', cats: ['p_unterkoerper', 'p_bauch'], extras: [] }
    ]},
    'ganzkörper': { days: [
      { label: 'GK', cats: ['p_brust', 'p_ruecken', 'p_unterkoerper', 'p_schulter'], extras: [] }
    ]}
  };

  const blockRowsEl  = document.getElementById('genBlockRows');
  const addBlockBtn  = document.getElementById('genAddBlock');
  const kwStartInput = document.getElementById('genKwStart');
  const regenModeEl  = document.getElementById('genRegenMode');
  const regenAfterEl = document.getElementById('genRegenAfter');
  const regenAfterField = document.getElementById('genRegenAfterField');
  const regenAfterUnit  = document.getElementById('genRegenAfterUnit');
  const regenDurEl   = document.getElementById('genRegenDuration');
  const summaryEl    = document.getElementById('genSummary');
  const splitSelect  = document.getElementById('genSplit');
  const submitBtn    = document.getElementById('genSubmit');
  const dayChips     = document.getElementById('genDayChips');
  if (!submitBtn || !blockRowsEl) return;

  // Default-Location aus Profil: erster hinterlegter Ort, oder 'studio'
  function _defaultLoc() {
    const locs = state.profile?.trainingLocation;
    if (Array.isArray(locs) && locs.length) return locs[0];
    if (typeof locs === 'string' && locs) {
      const parsed = _parseLocationString(locs);
      return parsed[0] || 'studio';
    }
    return 'studio';
  }

  let blocks = [
    { label: 'Grundlagen',    goal: 'kraftausdauer', length: 4, saetze: 3, wdh: 20, color: '#4cc9f0' },
    { label: 'Muskelaufbau', goal: 'hypertrophie', length: 4, saetze: 4, wdh: 10, color: '#f4a261' },
    { label: 'Maximalkraft',         goal: 'maximalkraft', length: 4, saetze: 5, wdh: 5,  color: '#9b5de5' }
  ];

  // ── Block-Zeile rendern ──
  // Nur die Orte anbieten die im Profil hinterlegt sind (Fallback: alle)
  function _locOptions(selected) {
    // Im Generator immer alle Orte anbieten — Profil-Orte werden hervorgehoben
    const rawLocs = state.profile?.trainingLocation;
    const profileLocs = new Set(Array.isArray(rawLocs) ? rawLocs
               : (typeof rawLocs === 'string' ? _parseLocationString(rawLocs) : []));
    const all = [
      { val: 'studio', label: '◇ Studio' },
      { val: 'home',   label: '⌂ Home' },
      { val: 'outdoor', label: '✦ Outdoor' }
    ];
    return all.map(o => `<option value="${o.val}"${o.val === selected ? ' selected' : ''}>${o.label}</option>`).join('');
  }

  function renderBlockRow(block, idx) {
    // Lazy-Default: location setzen beim ersten Render wenn noch nicht vorhanden
    if (!block.location) block.location = _defaultLoc();
    return `
      <div class="pn-block-row" data-idx="${idx}" style="border-left: 3px solid ${block.color};">
        <select class="pn-block-goal" data-field="goal">
          <option value="kraftausdauer"${block.goal==='kraftausdauer'?' selected':''}>Grundlagen</option>
          <option value="hypertrophie"${block.goal==='hypertrophie'?' selected':''}>Muskelaufbau</option>
          <option value="maximalkraft"${block.goal==='maximalkraft'?' selected':''}>Maximalkraft</option>
          <option value="allgemein"${block.goal==='allgemein'?' selected':''}>Allgemein</option>
        </select>
        <select class="pn-block-goal" data-field="location" title="Trainingsort für diesen Block">
          ${_locOptions(block.location)}
        </select>
        <div class="pn-block-len">
          <input type="number" class="pn-input" data-field="length" min="2" max="12" value="${block.length}">
          <span class="pn-field-label">Wo.</span>
        </div>
        <div class="pn-preset-badge" style="background:${block.color}22;border-color:${block.color}66;color:${block.color};">${block.saetze}×${block.wdh}</div>
        <button class="pn-block-remove" type="button" title="Block entfernen">✕</button>
      </div>`;
  }

  function renderAllBlocks() {
    blockRowsEl.innerHTML = blocks.map((b, i) => renderBlockRow(b, i)).join('');
    addBlockBtn.disabled = blocks.length >= 4;
    wireBlockEvents();
    applyToProfile();
  }

  function wireBlockEvents() {
    blockRowsEl.querySelectorAll('.pn-block-row').forEach(row => {
      const idx = parseInt(row.dataset.idx);
      row.querySelector('[data-field="goal"]').addEventListener('change', (e) => {
        blocks[idx].goal = e.target.value;
        const p = GOAL_PRESETS[blocks[idx].goal] || GOAL_PRESETS.allgemein;
        blocks[idx].saetze = p.saetze;
        blocks[idx].wdh = p.wdh;
        renderAllBlocks();
      });
      row.querySelector('[data-field="location"]').addEventListener('change', (e) => {
        blocks[idx].location = e.target.value;
        applyToProfile();
      });
      row.querySelector('[data-field="length"]').addEventListener('change', (e) => {
        blocks[idx].length = parseInt(e.target.value) || 4;
        applyToProfile();
      });
      row.querySelector('.pn-block-remove').addEventListener('click', () => {
        if (blocks.length <= 1) { toast('Mindestens ein Block nötig'); return; }
        blocks.splice(idx, 1);
        renderAllBlocks();
      });
    });
  }

  addBlockBtn.addEventListener('click', () => {
    if (blocks.length >= 4) return;
    const tpl = BLOCK_TEMPLATES[blocks.length] || BLOCK_TEMPLATES[0];
    blocks.push({ ...tpl, length: 4 }); // location wird lazy in renderBlockRow gesetzt
    renderAllBlocks();
  });

  // ── Regen-Modus UI ──
  function updateRegenUI() {
    const mode = regenModeEl.value;
    regenAfterField.style.display = (mode === 'after_n' || mode === 'after_weeks') ? '' : 'none';
    regenAfterUnit.textContent = mode === 'after_weeks' ? 'Wochen' : 'Blöcken';
    document.getElementById('genRegenDuration').closest('.pn-form-field').style.display = mode === 'none' ? 'none' : '';
    applyToProfile();
  }
  regenModeEl.addEventListener('change', updateRegenUI);
  regenAfterEl.addEventListener('change', applyToProfile);
  regenDurEl.addEventListener('change', applyToProfile);
  kwStartInput.addEventListener('change', applyToProfile);

  // ── Periodisierung berechnen + Timeline sofort updaten ──
  function readRegenConfig() {
    const mode = regenModeEl.value;
    const afterN = parseInt(regenAfterEl.value) || 2;
    const duration = parseInt(regenDurEl.value) || 1;
    return { mode, afterN, duration };
  }

  function applyToProfile() {
    const profile = state.profile;
    if (!profile || blocks.length === 0) return;

    const startKw = parseInt(kwStartInput.value) || 1;
    const regen = readRegenConfig();

    // Regen-Wochen berechnen basierend auf Modus (inkl. Ganzjährig-Wiederholung)
    const regenWeeks = [];
    let kw = startKw;
    let safetyCalc = 200;

    function calcOnePass() {
      let weeksSinceRegen = 0;
      blocks.forEach((b, i) => {
        kw += b.length;
        weeksSinceRegen += b.length;

        let insertRegen = false;
        if (regen.mode === 'after_each') insertRegen = true;
        else if (regen.mode === 'after_n' && (i + 1) % regen.afterN === 0) insertRegen = true;
        else if (regen.mode === 'after_weeks' && weeksSinceRegen >= regen.afterN) insertRegen = true;

        if (insertRegen && regen.mode !== 'none') {
          for (let r = 0; r < regen.duration && kw <= 52; r++) { regenWeeks.push(kw); kw++; }
          weeksSinceRegen = 0;
        }
      });
    }

    calcOnePass();
    if (repeatYear) {
      while (kw <= 52 && safetyCalc-- > 0) calcOnePass();
    }

    // Periodisierung ins Profil schreiben
    const endKw = Math.min(kw - 1, 52); // letzte belegte KW
    const GOAL_LABELS = { kraftausdauer: 'Grundlagen', hypertrophie: 'Muskelaufbau', maximalkraft: 'Maximalkraft', allgemein: 'Allgemein' };
    profile.periodization = {
      active: true, startKw, endKw,
      blocks: blocks.map(b => ({ label: b.label || GOAL_LABELS[b.goal] || b.goal, goal: b.goal, length: b.length }))
    };
    profile.regenConfig = { regenBetween: regen.mode === 'after_each' };
    profile.athleteRegenWeeks = regenWeeks;

    // Summary
    const totalWeeks = blocks.reduce((s, b) => s + b.length, 0);
    if (summaryEl) {
      summaryEl.textContent = `→ ${totalWeeks} Trainingswochen · KW ${startKw}–${endKw}` +
        (regenWeeks.length ? ` · ${regenWeeks.length} Regen-Wo. (KW ${regenWeeks.join(', ')})` : ' · keine Regen');
    }

    renderJahresplan(profile);
  }

  // ── Day-Chips ──
  if (dayChips) {
    dayChips.querySelectorAll('.tp-chip').forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });
  }

  function pickExercises(catKey, count, location) {
    // Equipment des Athleten für diesen Trainingsort
    const eq = state.profile?.equipment;
    const locEq = eq && !Array.isArray(eq) ? eq[location] : null;
    const availEq = locEq ? new Set([...(locEq.available || []), 'Bodyweight']) : null;
    if (availEq && locEq?.excluded) locEq.excluded.forEach(e => availEq.delete(e));

    return (LEXIKON_DATA[catKey] || [])
      .filter(ex => {
        // Wenn Athlet Equipment für diesen Ort hat → danach filtern
        if (availEq && ex.eq) {
          return ex.eq.some(e => availEq.has(e));
        }
        // Fallback: nach Location filtern
        return location === 'all' || (ex.location || 'studio') === location;
      })
      .slice(0, count);
  }

  // ── Einen Wochenplan für einen Block generieren ──
  function buildWeekPlan(blockDef, splitDef, selectedDays, location, blockIdx) {
    const exPerCat = blockDef.goal === 'maximalkraft' ? 2 : 3;
    const goalLabels = { kraftausdauer: 'Grundlagen', hypertrophie: 'Muskelaufbau', maximalkraft: 'Maximalkraft', allgemein: 'Allgemein' };
    const days = selectedDays.map((dayLabel, dayIdx) => {
      const splitDay = splitDef.days[dayIdx % splitDef.days.length];
      const exercises = [];
      splitDay.cats.forEach(catKey => {
        pickExercises(catKey, exPerCat, location).forEach(ex => {
          exercises.push({ name: ex.name, muscle: ex.muscle, saetze: blockDef.saetze, wdh: blockDef.wdh, gewicht: null });
        });
      });
      // Extras nur für Studio (Kabelzug etc.)
      if (location === 'studio' || location === 'all') {
        splitDay.extras.forEach(exName => {
          const found = _lxAllExercises().find(e => e.name === exName);
          if (found && (location === 'all' || (found.location || 'studio') === location)) {
            exercises.push({ name: found.name, muscle: found.muscle, saetze: blockDef.saetze, wdh: blockDef.wdh, gewicht: null });
          }
        });
      }
      return { label: dayLabel, exercises: exercises.slice(0, 6) };
    });
    return {
      name: `${blockDef.saetze}×${blockDef.wdh} ${goalLabels[blockDef.goal] || blockDef.goal}`,
      goal: blockDef.goal, _source: 'generator', _block: blockIdx, days
    };
  }

  // ── Pläne generieren ──
  submitBtn.addEventListener('click', () => {
    const profile = state.profile;
    if (!profile || blocks.length === 0) { toast('Keine Blöcke definiert'); return; }

    const split = splitSelect.value;
    const splitDef = SPLITS[split];
    const homeFallback = document.getElementById('genHomeFallback')?.checked;
    const repeatYear = document.getElementById('genRepeatYear')?.checked;
    const startKw = parseInt(kwStartInput.value) || 1;
    const regen = readRegenConfig();

    const selectedDays = [];
    if (dayChips) dayChips.querySelectorAll('.tp-chip.active').forEach(c => selectedDays.push(c.dataset.day));
    if (selectedDays.length === 0) { toast('Mindestens einen Trainingstag wählen'); return; }

    if (!profile.plans) profile.plans = {};

    // Alte generierte Pläne entfernen (nur _source: 'generator', manuelle bleiben)
    for (let k = 1; k <= 52; k++) {
      const key = 'w' + k;
      if (profile.plans[key]?._source === 'generator') delete profile.plans[key];
    }

    let kw = startKw;
    let weeksSinceRegen = 0;
    let safetyLimit = 200; // Endlos-Loop-Schutz

    // Einmal durchlaufen oder bei "Ganzjährig" wiederholen bis KW 52
    function generateOnePass() {
      blocks.forEach((blockDef, blockIdx) => {
        const blockLoc = blockDef.location || 'studio';
        for (let w = 0; w < blockDef.length && kw <= 52 && safetyLimit-- > 0; w++, kw++) {
          const plan = buildWeekPlan(blockDef, splitDef, selectedDays, blockLoc, blockIdx);
          plan._location = blockLoc;
          profile.plans['w' + kw] = plan;

          if (homeFallback) {
            if (blockLoc !== 'home') {
              const homePlan = buildWeekPlan(blockDef, splitDef, selectedDays, 'home', blockIdx);
              profile.plans['w' + kw]._homeFallback = homePlan.days;
            }
            if (blockLoc !== 'studio') {
              const studioPlan = buildWeekPlan(blockDef, splitDef, selectedDays, 'studio', blockIdx);
              profile.plans['w' + kw]._studioFallback = studioPlan.days;
            }
          }

          weeksSinceRegen++;
        }

        // Regen einfügen
        let insertRegen = false;
        if (regen.mode === 'after_each') insertRegen = true;
        else if (regen.mode === 'after_n' && (blockIdx + 1) % regen.afterN === 0) insertRegen = true;
        else if (regen.mode === 'after_weeks' && weeksSinceRegen >= regen.afterN) insertRegen = true;

        if (insertRegen && regen.mode !== 'none') {
          for (let r = 0; r < regen.duration && kw <= 52; r++) {
            delete profile.plans['w' + kw];
            kw++;
          }
        weeksSinceRegen = 0;
      }
      });
    }

    // Einmal oder ganzjährig wiederholen
    generateOnePass();
    if (repeatYear) {
      while (kw <= 52 && safetyLimit > 0) {
        generateOnePass();
      }
    }

    applyToProfile();
    // Bei ganzjährig: endKw auf 52 setzen
    if (repeatYear) profile.periodization.endKw = 52;

    renderJahresplan(profile);
    renderTrainingsplan(profile);
    renderCockpit(profile);
    buildPlanBalance(profile);
    _saveProfile();

    const totalPlans = Object.keys(profile.plans).filter(k => k.startsWith('w')).length;
    toast(`${totalPlans} Wochenpläne generiert${repeatYear ? ' (ganzjährig)' : ''}`);
  });

  // ── Initial ──
  renderAllBlocks();
  updateRegenUI();
})();

