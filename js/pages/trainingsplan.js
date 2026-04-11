import { state, STORAGE_KEYS, _saveProfile } from '../state.js';
import { toast, escapeHtml, _parseDE, _isoWeek, _fmtKg, _DOW_DE_SHORT, _DOW_DE_LONG, _MONTH_DE } from '../utils.js';
import { LEXIKON_DATA, _lxAllExercises } from '../data/lexikon-data.js';
import { _isoWeekToMonday, _calcPeriodization, _blockClass } from './jahresplan.js';
import { _getBwFactor, _effectiveWeight } from '../features/muscle-balance.js';

export { renderTrainingsplan, _logSet, _getSessionsByDay };

/* ═══════════════════════════════════════════════════════
   TRAININGSPLAN (v2.4)
   Schritt 2: KW-Navigation, Datumsbereich, Block-Kontext
   ═══════════════════════════════════════════════════════ */

// Sonntag-Datum aus Montag berechnen (+ 6 Tage)
function _sundayOfIsoWeek(year, week) {
  const mon = _isoWeekToMonday(year, week);
  const sun = new Date(mon);
  sun.setUTCDate(sun.getUTCDate() + 6);
  return sun;
}

function renderTrainingsplan(profile) {
  if (!profile) return;

  const sessions = profile.sessions || [];
  const anchor = new Date();
  const anchorIso = _isoWeek(anchor);
  const year = anchorIso.year;
  const nowKw = anchorIso.week;

  // State-Initialisierung: beim ersten Aufruf auf "heute" setzen
  if (state.tpViewKw === null || state.tpViewKw === undefined) {
    state.tpViewKw = nowKw;
  }
  const kw = state.tpViewKw;

  // Studio/Home-Toggle initial aus dem Profil ableiten:
  // trainingLocation[0] === 'home' → globaler Default ist Home-Modus.
  // Per-KW-Overrides leben in state.tpUseHomePerKw und überschreiben den
  // Default für die jeweilige Woche.
  if (state.tpUseHome === null || state.tpUseHome === undefined) {
    const locs = Array.isArray(profile.trainingLocation) ? profile.trainingLocation : [];
    state.tpUseHome = locs[0] === 'home';
  }
  // Effektiver Modus für die aktuell angezeigte KW
  const effectiveUseHome = (state.tpUseHomePerKw && state.tpUseHomePerKw[kw] !== undefined)
    ? state.tpUseHomePerKw[kw]
    : state.tpUseHome;

  // Datumsbereich Mo–So
  const monday = _isoWeekToMonday(year, kw);
  const sunday = _sundayOfIsoWeek(year, kw);
  const rangeStr =
    `${String(monday.getUTCDate()).padStart(2, '0')} ${_MONTH_DE[monday.getUTCMonth()]}` +
    ` – ` +
    `${String(sunday.getUTCDate()).padStart(2, '0')} ${_MONTH_DE[sunday.getUTCMonth()]} ${sunday.getUTCFullYear()}`;

  // Kopfzeile befüllen
  const kwLabelEl = document.getElementById('tpKwLabel');
  const kwRangeEl = document.getElementById('tpKwRange');
  if (kwLabelEl) kwLabelEl.textContent = `KW ${kw}`;
  if (kwRangeEl) kwRangeEl.textContent = rangeStr;

  // Heute-Button: inaktiv wenn schon auf aktueller KW, sonst Ziel-KW als Sub-Label anzeigen
  const todayBtn = document.getElementById('tpToday');
  const todaySub = document.getElementById('tpTodaySub');
  if (todayBtn) {
    const isOnToday = kw === nowKw;
    todayBtn.disabled = isOnToday;
    todayBtn.style.opacity = isOnToday ? '0.4' : '1';
    if (todaySub) todaySub.textContent = isOnToday ? '' : `KW ${nowKw}`;
  }

  // Bearbeiten-Modus: nur für aktuelle und zukünftige Wochen erlaubt
  const isPast = kw < nowKw;
  const tpPage = document.querySelector('.page[data-page="trainingsplan"]');
  const tpModeEl = document.getElementById('tpMode');
  const addExBtn = document.getElementById('tpAddExercise');
  if (tpModeEl) {
    tpModeEl.style.display = (state.role === 'trainer' && !isPast) ? '' : 'none';
  }
  if (isPast && tpPage) {
    tpPage.classList.remove('tp-edit-active');
    state.tpEditMode = false;
    if (tpModeEl) document.querySelectorAll('#tpMode button').forEach(b => b.classList.toggle('active', b.dataset.mode === 'view'));
  }
  if (addExBtn) {
    addExBtn.style.display = (state.tpEditMode && !isPast) ? 'flex' : 'none';
  }

  // Block-Kontext für die aktive KW
  const period = _calcPeriodization(profile);
  const pEntry = period ? period[kw] : null;
  const blockBadge = document.querySelector('.tp-block-badge');
  const blockLabelEl = document.getElementById('tpBlockLabel');
  const planNameEl = document.getElementById('tpPlanName');

  if (blockBadge) {
    blockBadge.classList.remove('jp-block-gpp', 'jp-block-spp', 'jp-block-peak', 'jp-block-aux');
  }

  if (pEntry && pEntry.isRegen) {
    if (blockLabelEl) blockLabelEl.textContent = 'Erholungswoche';
    if (blockBadge) blockBadge.classList.add('jp-block-peak'); // honig als "warnung"
  } else if (pEntry && !pEntry.isPreStart) {
    if (blockLabelEl) blockLabelEl.textContent =
      `${pEntry.blockLabel} · W${pEntry.relativeWeek} · ${pEntry.blockFullLabel}`;
    if (blockBadge) blockBadge.classList.add(_blockClass(pEntry.blockIdx));
  } else {
    if (blockLabelEl) blockLabelEl.textContent = '—';
  }

  // Plan-Name + Trainingsort aus Profil
  const plan = (profile.plans || {})['w' + kw];
  const _locLabels = { studio: '◇ Studio', home: '⌂ Zuhause', outdoor: '✦ Outdoor' };
  const planLocLabel = plan?._location ? _locLabels[plan._location] || '' : '';
  if (planNameEl) planNameEl.textContent =
    (plan?.name || (pEntry?.isRegen ? 'Regeneration' : 'Kein Plan'))
    + (planLocLabel ? ' · ' + planLocLabel : '');

  // ─── Schritt 3+4: Tag-Tabs + Übungs-Karten mit Session-Matching ───
  const tabsEl = document.getElementById('tpDayTabs');
  const exEl   = document.getElementById('tpExercises');
  const isRegen = !!(pEntry && pEntry.isRegen);
  const hasPlan = !!(plan && plan.days && plan.days.length > 0);

  // Sessions der aktuellen KW nach dayIdx gruppieren (für Status-Dots + Exercise-Matching)
  const sessionsByDay = _getSessionsByDay(profile, kw, year);

  if (tabsEl) {
    if (isRegen || !hasPlan) {
      tabsEl.innerHTML = '';
      tabsEl.style.display = 'none';
    } else {
      if (state.tpViewDay >= plan.days.length) state.tpViewDay = 0;
      tabsEl.innerHTML = _renderTpTabs(plan, state.tpViewDay, sessionsByDay);
      tabsEl.style.display = '';
      tabsEl.querySelectorAll('.tp-day-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          state.tpViewDay = parseInt(tab.dataset.day || '0', 10);
          renderTrainingsplan(state.profile);
        });
      });
    }
  }

  if (exEl) {
    if (isRegen) {
      exEl.innerHTML = _renderTpRegenState(kw);
    } else if (!hasPlan) {
      exEl.innerHTML = _renderTpNoPlanState(kw);
      // "Erste Übung hinzufügen" delegiert an den regulären Add-Button
      const emptyAdd = document.getElementById('tpEmptyAddExercise');
      if (emptyAdd) emptyAdd.addEventListener('click', () => document.getElementById('tpAddExercise')?.click());
    } else {
      // Studio/Home-Toggle: Ausweichplan wenn vorhanden
      const hasFallback = plan._homeFallback || plan._studioFallback;
      const planLoc = plan._location || 'studio';
      let useFallback = false;
      let fallbackDays = null;
      let fallbackLabel = '';

      if (effectiveUseHome && plan._homeFallback) {
        useFallback = true;
        fallbackDays = plan._homeFallback;
        fallbackLabel = 'Home-Plan';
      } else if (!effectiveUseHome && plan._studioFallback) {
        useFallback = true;
        fallbackDays = plan._studioFallback;
        fallbackLabel = 'Studio-Plan';
      }

      const dayData = useFallback
        ? (fallbackDays[state.tpViewDay] || fallbackDays[0])
        : (plan.days[state.tpViewDay] || plan.days[0]);
      const session = sessionsByDay[state.tpViewDay] || null;
      exEl.innerHTML = _renderTpExercises(dayData, session);

      // Studio/Home-Toggle sichtbar wenn Fallback vorhanden
      const locBtn = document.getElementById('tpLocToggle');
      if (locBtn) {
        locBtn.style.display = hasFallback ? '' : 'none';
        locBtn.classList.toggle('home-active', !!effectiveUseHome);
        const locLabel = document.getElementById('tpLocLabel');
        if (locLabel) {
          if (useFallback) {
            locLabel.textContent = fallbackLabel;
          } else {
            locLabel.textContent = planLoc === 'home' ? 'Home-Plan' : 'Studio-Plan';
          }
        }
      }
    }
  }

  // ─── Session-Fortschrittsbar ──────────────────────
  const progEl       = document.getElementById('tpDayProgress');
  const progLabelEl  = document.getElementById('tpDayProgressLabel');
  const progPctEl    = document.getElementById('tpDayProgressPct');
  const progFillEl   = document.getElementById('tpDayProgressFill');
  if (progEl) {
    if (isRegen || !hasPlan) {
      progEl.style.display = 'none';
    } else {
      const day = plan.days[state.tpViewDay] || plan.days[0];
      const session = sessionsByDay[state.tpViewDay] || null;
      const stats = _computeDayProgress(day, session);
      progEl.style.display = '';
      progEl.classList.toggle('complete', stats.pct >= 100);
      progLabelEl.textContent =
        `${(day.label || '').toUpperCase()} · ` +
        `${stats.exDone} von ${stats.exTotal} Übungen · ` +
        `${stats.setsDone} von ${stats.setsTotal} Sätze`;
      progPctEl.textContent = stats.pct + ' %';
      progFillEl.style.width = stats.pct + '%';
    }
  }

  console.log('[Trainingsplan] gerendert', {
    kw, year, nowKw, hasPlan, isRegen,
    plan: plan?.name,
    day: plan?.days?.[state.tpViewDay]?.label,
    loggedDays: Object.keys(sessionsByDay).length,
    activeSession: !!sessionsByDay[state.tpViewDay]
  });
}

// Formatiert ein Date-Objekt als "DD.MM.YYYY"
function _formatDE(date) {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}.${m}.${y}`;
}

// Wochentags-Label (Mo/Di/…) → Offset vom Montag (0..6)
const _DAY_LABEL_TO_OFFSET = { 'Mo': 0, 'Di': 1, 'Mi': 2, 'Do': 3, 'Fr': 4, 'Sa': 5, 'So': 6 };
function _dayOffsetFromLabel(label) {
  return _DAY_LABEL_TO_OFFSET[label] ?? 0;
}

// ─── Einen Satz ins Profil loggen (Variante B: RAM-only, kein Persist) ───
// Findet oder erstellt Session + Exercise, hängt den neuen Satz an exercise.sets[] an
// Gibt die modifizierte Session zurück
function _logSet(profile, kw, year, dayIdx, dayLabel, planEx, setData) {
  if (!profile) return null;
  if (!profile.sessions) profile.sessions = [];

  // Existierende Session für diese KW+Tag+Jahr suchen
  let session = profile.sessions.find(s => {
    if (s.kw !== kw) return false;
    if ((s.dayIdx ?? 0) !== dayIdx) return false;
    const d = _parseDE(s.date);
    if (!d) return false;
    const iso = _isoWeek(d);
    return iso.year === year && iso.week === kw;
  });

  // Falls keine Session existiert: neu anlegen mit passendem Datum (Montag der KW + Tag-Offset)
  if (!session) {
    const monday = _isoWeekToMonday(year, kw);
    const sessionDate = new Date(monday);
    sessionDate.setUTCDate(sessionDate.getUTCDate() + _dayOffsetFromLabel(dayLabel));
    session = {
      id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      date: _formatDE(sessionDate),
      kw: kw,
      dayIdx: dayIdx,
      exercises: []
    };
    profile.sessions.push(session);
  }

  // Exercise in der Session finden oder neu anlegen
  let exercise = (session.exercises || []).find(e => e.name === planEx.name);
  if (!exercise) {
    exercise = {
      name: planEx.name,
      muscle: planEx.muscle || '',
      isometric: false,
      sets: []
    };
    if (!session.exercises) session.exercises = [];
    session.exercises.push(exercise);
  }

  // Neuen Satz anhängen
  const newSet = {
    wdh: Number(setData.wdh) || 0,
    gewicht: Number(setData.gewicht) || 0
  };
  if (setData.rpe != null && setData.rpe !== '') {
    newSet.rpe = Number(setData.rpe);
  }
  if (setData._bwZusatz !== undefined) {
    newSet._bwZusatz = Number(setData._bwZusatz) || 0;
  }
  if (!exercise.sets) exercise.sets = [];
  exercise.sets.push(newSet);
  _saveProfile();

  return session;
}

// ─── Fortschritt eines Tages berechnen ───
// Gibt Statistik zurück: exercises done/total, sets done/total, pct (basierend auf Sätzen)
function _computeDayProgress(day, session) {
  const result = { exDone: 0, exTotal: 0, setsDone: 0, setsTotal: 0, pct: 0 };
  if (!day || !day.exercises) return result;

  const sessionExByName = {};
  if (session) {
    (session.exercises || []).forEach(ex => { sessionExByName[ex.name] = ex; });
  }

  day.exercises.forEach(planEx => {
    result.exTotal++;
    const saetze     = Number(planEx.saetze) || 3;
    const sessionEx  = sessionExByName[planEx.name];
    const loggedSets = (sessionEx && sessionEx.sets) || [];
    const doneSets   = Math.min(loggedSets.length, Math.max(saetze, loggedSets.length));
    result.setsTotal += saetze;
    result.setsDone  += doneSets;
    if (loggedSets.length >= saetze) result.exDone++;
  });

  result.pct = result.setsTotal > 0
    ? Math.round((result.setsDone / result.setsTotal) * 100)
    : 0;
  // Clamp bei Übererfüllung (mehr Sätze geloggt als geplant)
  if (result.pct > 100) result.pct = 100;
  return result;
}

// ─── Sessions einer KW nach dayIdx gruppieren ───
// Jahr wird mit ISO-Week verifiziert, damit KW 1 aus verschiedenen Jahren nicht verschmelzen
function _getSessionsByDay(profile, kw, year) {
  const sessions = profile.sessions || [];
  const map = {};
  sessions.forEach(s => {
    if (s.kw !== kw) return;
    const d = _parseDE(s.date);
    if (!d) return;
    const iso = _isoWeek(d);
    if (iso.year !== year || iso.week !== kw) return;
    const dayIdx = s.dayIdx ?? 0;
    // Falls mehrere Sessions pro Tag existieren: die neueste nehmen
    const existing = map[dayIdx];
    if (!existing || _parseDE(existing.date) < d) {
      map[dayIdx] = s;
    }
  });
  return map;
}

// ─── Tag-Tabs aus plan.days generieren (mit Session-Status-Dots) ───
function _renderTpTabs(plan, activeDayIdx, sessionsByDay) {
  return plan.days.map((day, idx) => {
    const isActive = idx === activeDayIdx;
    const isDone   = !!(sessionsByDay && sessionsByDay[idx]);
    const exCount  = (day.exercises || []).length;
    const sub = `${exCount} Übung${exCount !== 1 ? 'en' : ''}`;
    return `
      <button class="tp-day-tab${isActive ? ' active' : ''}" data-day="${idx}">
        <span class="tp-day-status${isDone ? ' done' : ''}"></span>
        <div class="tp-day-label">${escapeHtml((day.label || '—').toUpperCase())}</div>
        <div class="tp-day-sub">${sub}</div>
      </button>`;
  }).join('');
}

// ─── Übungen eines Tages in Karten rendern (mit Session-Matching) ───
// session: Session-Objekt für diesen Tag oder null
function _renderTpExercises(day, session) {
  if (!day || !day.exercises || day.exercises.length === 0) {
    return `<div class="tp-empty-state">
      <div class="tp-empty-icon">◯</div>
      <div class="tp-empty-title">Keine Übungen</div>
      <div class="tp-empty-desc">Dieser Tag enthält keine Übungen.</div>
    </div>`;
  }

  // Session-Übungen nach Name indexieren für schnelles Lookup
  const sessionExByName = {};
  if (session) {
    (session.exercises || []).forEach(ex => {
      sessionExByName[ex.name] = ex;
    });
  }

  return day.exercises.map(planEx => {
    const sessionEx  = sessionExByName[planEx.name];
    const loggedSets = (sessionEx && sessionEx.sets) || [];

    const saetze  = Number(planEx.saetze) || 3;
    const wdh     = planEx.wdh != null && planEx.wdh !== '' ? Number(planEx.wdh) : null;
    const gewicht = planEx.gewicht != null && planEx.gewicht !== '' ? Number(planEx.gewicht) : null;

    const planPill = gewicht != null
      ? `${saetze} × ${wdh ?? '—'} @ ${gewicht} kg`
      : `${saetze} × ${wdh ?? '—'}`;

    // Anzahl gerenderter Zeilen = max(geplant, tatsächlich geloggt)
    const totalRows = Math.max(saetze, loggedSets.length);

    let setsHtml = '';
    for (let i = 0; i < totalRows; i++) {
      const logged = loggedSets[i] || null;
      const isEditing = !!(state.tpEditing
        && state.tpEditing.exerciseName === planEx.name
        && state.tpEditing.setIdx === i);
      setsHtml += _renderTpSetRow(i + 1, wdh, gewicht, logged, isEditing, planEx.name);
    }

    // Karten-Klassen: voll geloggt / teil geloggt / offen — für subtile Rahmen-Indikation
    let cardState = 'tp-ex-open';
    if (loggedSets.length > 0) {
      cardState = loggedSets.length >= saetze ? 'tp-ex-done' : 'tp-ex-partial';
    }

    const editBar = `
      <div class="tp-ex-edit-bar">
        <button class="tp-ex-edit-btn tp-ex-delete" data-ex-name="${escapeHtml(planEx.name)}" title="Übung entfernen">✕</button>
      </div>`;
    const paramsEdit = `
      <div class="tp-ex-params-edit">
        <div class="tp-ex-param">
          <label>Sätze</label>
          <input type="number" min="1" max="20" value="${saetze}" data-ex-name="${escapeHtml(planEx.name)}" data-field="saetze">
        </div>
        <div class="tp-ex-param">
          <label>Wdh</label>
          <input type="number" min="1" max="100" value="${wdh ?? ''}" data-ex-name="${escapeHtml(planEx.name)}" data-field="wdh">
        </div>
        <div class="tp-ex-param">
          <label>kg</label>
          <input type="number" min="0" max="500" step="0.5" value="${gewicht ?? ''}" data-ex-name="${escapeHtml(planEx.name)}" data-field="gewicht">
        </div>
      </div>`;

    return `
      <div class="tp-exercise ${cardState}">
        <div class="tp-ex-head">
          <div>
            <div class="tp-ex-name">${escapeHtml(planEx.name || '—')}</div>
            <div class="tp-ex-muscle">${escapeHtml(planEx.muscle || '')}</div>
          </div>
          <div class="tp-ex-plan">${planPill}</div>
          ${editBar}
        </div>
        ${paramsEdit}
        <div class="tp-sets">${setsHtml}</div>
      </div>`;
  }).join('');
}

// Letztes geloggtes Gewicht einer Übung aus den Sessions holen
function _lastLoggedWeight(exerciseName) {
  const sessions = state.profile?.sessions || [];
  for (let i = sessions.length - 1; i >= 0; i--) {
    const ex = (sessions[i].exercises || []).find(e => e.name === exerciseName);
    if (ex?.sets?.length) {
      const lastSet = ex.sets[ex.sets.length - 1];
      if (lastSet.gewicht != null) return { kg: lastSet.gewicht, bwZusatz: lastSet._bwZusatz };
    }
  }
  return null;
}

// ─── Einzelne Satz-Zeile (geloggt, offen, oder in Bearbeitung) ───
// loggedSet: { wdh, gewicht, rpe } wenn geloggt, sonst null
// isEditing: true wenn diese Zeile gerade bearbeitet wird → zeigt Input-Formular
function _renderTpSetRow(idx, plannedWdh, plannedGewicht, loggedSet, isEditing, exerciseName) {
  const num = String(idx).padStart(2, '0');
  const exAttr = `data-ex="${escapeHtml(exerciseName || '')}" data-set="${idx - 1}"`;
  const bwF = _getBwFactor(exerciseName);
  const bw = Number(state.profile?.gewicht) || 80;
  const bwBase = bwF ? Math.round(bw * bwF) : 0;
  const isBand = (exerciseName || '').toLowerCase().includes('widerstandsband') ||
                 (exerciseName || '').toLowerCase().includes('band');

  // Edit-Modus: Eingabefelder statt Werte
  if (isEditing) {
    const prefillWdh = loggedSet?.wdh ?? (plannedWdh ?? '');
    // BW-Übungen: Zusatzgewicht anzeigen (nicht Totalgewicht)
    const lastLogged = _lastLoggedWeight(exerciseName);
    const prefillKg  = bwF
      ? (loggedSet?._bwZusatz ?? lastLogged?._bwZusatz ?? 0)
      : (loggedSet?.gewicht ?? plannedGewicht ?? lastLogged?.kg ?? '');
    const prefillRpe = loggedSet?.rpe ?? '';
    const kgLabel = bwF ? 'Zusatz' : isBand ? 'Band' : 'kg';
    const kgPlaceholder = bwF ? '0' : isBand ? 'Stärke' : 'kg';
    const zusatz = Number(prefillKg) || 0;
    const total = bwBase + zusatz;
    const bwHint = bwF ? `<div class="tp-set-bw-hint">${bw} kg × ${bwF} = ${bwBase} kg${zusatz ? ' + ' + zusatz + ' kg Zusatz = ' + total + ' kg' : ''}</div>`
      : isBand ? `<div class="tp-set-bw-hint">Bandstärke: leicht≈5 · mittel≈10 · schwer≈20 kg</div>`
      : '';
    return `
      <div class="tp-set tp-set-editing" ${exAttr} ${bwF ? 'data-bw="1"' : ''}>
        <div class="tp-set-num">${num}</div>
        <div class="tp-set-field tp-set-field-edit">
          <input type="number" class="tp-set-input" data-field="wdh"
                 value="${prefillWdh}" placeholder="Wdh" min="0" inputmode="numeric">
          <span class="tp-set-unit">Wdh</span>
        </div>
        <div class="tp-set-field tp-set-field-edit">
          <input type="number" class="tp-set-input" data-field="gewicht"
                 value="${prefillKg}" placeholder="${kgPlaceholder}" step="0.5" min="0" inputmode="decimal">
          <span class="tp-set-unit">${kgLabel}</span>
        </div>
        <div class="tp-set-field tp-set-field-edit">
          <input type="number" class="tp-set-input" data-field="rpe"
                 value="${prefillRpe}" placeholder="RPE" step="0.5" min="1" max="10" inputmode="decimal">
          <span class="tp-set-unit">RPE</span>
        </div>
        ${bwHint}
        <div class="tp-set-edit-actions">
          <button class="tp-set-cancel" type="button">Abbrechen</button>
          <button class="tp-set-save" type="button">Speichern</button>
        </div>
      </div>`;
  }

  if (loggedSet) {
    const w   = loggedSet.wdh ?? '—';
    const kg  = loggedSet.gewicht != null ? _fmtKg(loggedSet.gewicht) : '—';
    const rpe = loggedSet.rpe ?? '—';
    // BW-Übungen: Berechnung anzeigen (z.B. "80kg × 0.65 = 52kg + 10kg")
    const bwTag = bwF
      ? ` <span class="tp-set-bw-tag">(${bw}kg × ${bwF}${loggedSet._bwZusatz ? ' + ' + loggedSet._bwZusatz : ''})</span>`
      : '';
    return `
      <div class="tp-set tp-set-done" ${exAttr}>
        <div class="tp-set-num">${num}</div>
        <div class="tp-set-field"><span class="tp-set-val">${w}</span><span class="tp-set-unit">Wdh</span></div>
        <div class="tp-set-field"><span class="tp-set-val">${kg}${bwTag}</span><span class="tp-set-unit">kg</span></div>
        <div class="tp-set-field"><span class="tp-set-val">${rpe}</span><span class="tp-set-unit">RPE</span></div>
        <div class="tp-set-check">✓</div>
      </div>`;
  }

  // Offen: planned values + Loggen-Button
  const pw  = plannedWdh != null ? plannedWdh : '—';
  // Gewicht: BW-Übungen → Zusatz zeigen, sonst geplant > letztes > —
  let pkg = '—';
  let kgHint = '';
  let kgUnit = 'kg';
  if (bwF) {
    // BW-Übung: letztes Zusatzgewicht oder 0
    const last = _lastLoggedWeight(exerciseName);
    const zusatz = last?._bwZusatz ?? 0;
    pkg = zusatz ? _fmtKg(zusatz) : '0';
    kgUnit = 'Zusatz';
    if (zusatz) kgHint = ' <span style="color:var(--text-3);font-size:10px">letztes</span>';
  } else if (isBand) {
    const last = _lastLoggedWeight(exerciseName);
    pkg = last?.kg != null ? _fmtKg(last.kg) : '—';
    kgUnit = 'Band';
    if (last) kgHint = ' <span style="color:var(--text-3);font-size:10px">letztes</span>';
  } else if (plannedGewicht != null) {
    pkg = _fmtKg(plannedGewicht);
  } else {
    const last = _lastLoggedWeight(exerciseName);
    if (last && last.kg != null) {
      pkg = _fmtKg(last.kg);
      kgHint = ' <span style="color:var(--text-3);font-size:10px">letztes</span>';
    }
  }
  const bwOpenHint = bwF ? `<div class="tp-set-bw-hint">${bw} kg × ${bwF} = ${bwBase} kg · nur Zusatzgewicht eingeben</div>`
    : isBand ? `<div class="tp-set-bw-hint">Bandstärke eintragen (leicht=5, mittel=10, schwer=20 kg)</div>`
    : '';
  return `
    <div class="tp-set tp-set-open" ${exAttr}>
      <div class="tp-set-num">${num}</div>
      <div class="tp-set-field"><span class="tp-set-planned">${pw}</span><span class="tp-set-unit">Wdh</span></div>
      <div class="tp-set-field"><span class="tp-set-planned">${pkg}${kgHint}</span><span class="tp-set-unit">${kgUnit}</span></div>
      <div class="tp-set-field"><span class="tp-set-planned">—</span><span class="tp-set-unit">RPE</span></div>
      <button class="tp-set-log-btn" type="button">+ Loggen</button>
      ${bwOpenHint}
    </div>`;
}

// ─── Empty States (Regen, Kein Plan) ───
function _renderTpRegenState(kw) {
  const tips = [
    'Leichte Bewegung: Spaziergang, Yoga, Mobility',
    'Schlaf priorisieren: 8+ Stunden, stabile Zeiten',
    'Ernährung: Protein hoch halten, keine Diät',
    'Mental: Training loslassen, keine Performance-Pressure'
  ];
  return `
    <div class="tp-empty-state tp-empty-regen">
      <div class="tp-empty-icon">◍</div>
      <div class="tp-empty-title">Regenerations-Woche · KW ${kw}</div>
      <div class="tp-empty-desc">
        Diese Woche ist im Block-Zyklus als Regeneration eingeplant — nach 12 Trainingswochen
        braucht das Nervensystem eine bewusste Pause, bevor der nächste Block startet.
      </div>
      <ul class="tp-regen-tips">
        ${tips.map(t => `<li>${t}</li>`).join('')}
      </ul>
    </div>`;
}
function _renderTpNoPlanState(kw) {
  const isTrainer = state.role === 'trainer';
  const inEdit = state.tpEditMode;
  return `
    <div class="tp-empty-state">
      <div class="tp-empty-icon">◇</div>
      <div class="tp-empty-title">Kein Plan für KW ${kw}</div>
      <div class="tp-empty-desc">
        Für diese Kalenderwoche ist noch kein Trainingsplan hinterlegt.${isTrainer ? (inEdit ? ' Füge die erste Übung hinzu um einen Plan zu erstellen.' : '') : ' Dein Trainer legt den Plan für diese Woche noch an.'}
      </div>
      ${isTrainer && inEdit ? `<button class="tp-empty-action" id="tpEmptyAddExercise">+ Erste Übung hinzufügen</button>` : ''}
      ${isTrainer && !inEdit ? `<button class="tp-empty-action" onclick="document.querySelector('#tpMode button[data-mode=\\'edit\\']')?.click()">Bearbeiten starten</button>` : ''}
    </div>`;
}


// ── Trainingsplan Bearbeiten-Modus (Trainer) ──
/* ═══════════════════════════════════════════════════════
   TRAININGSPLAN BEARBEITEN-MODUS (Trainer)
   ═══════════════════════════════════════════════════════ */
(function initTrainingsplanEditMode() {
  const tp = document.querySelector('.page[data-page="trainingsplan"]');
  if (!tp) return;

  // ── Studio/Home-Toggle (bidirektional, KW-spezifisch) ──
  // Globaler Default state.tpUseHome wird beim ersten Render aus
  // profile.trainingLocation[0] abgeleitet. Klick auf den Toggle
  // setzt einen KW-spezifischen Override in state.tpUseHomePerKw,
  // sodass nur die aktuell angezeigte KW umgeschaltet wird. Andere
  // Wochen behalten den Profil-Default oder ihren eigenen Override.
  state.tpUseHome = null;
  state.tpUseHomePerKw = {};
  const locToggleBtn = document.getElementById('tpLocToggle');
  if (locToggleBtn) {
    locToggleBtn.addEventListener('click', () => {
      const kw = state.tpViewKw;
      if (kw == null) return;
      const current = (state.tpUseHomePerKw[kw] !== undefined)
        ? state.tpUseHomePerKw[kw]
        : !!state.tpUseHome;
      state.tpUseHomePerKw[kw] = !current;
      if (state.profile) renderTrainingsplan(state.profile);
      toast(state.tpUseHomePerKw[kw]
        ? `KW ${kw}: Home-Ausweichplan aktiv`
        : `KW ${kw}: Studio-Plan aktiv`);
    });
  }

  // ── Toggle Ansicht / Bearbeiten ──
  document.querySelectorAll('#tpMode button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.role !== 'trainer') return;
      const mode = btn.dataset.mode;
      tp.classList.toggle('tp-edit-active', mode === 'edit');
      document.querySelectorAll('#tpMode button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.tpEditMode = mode === 'edit';
      if (state.profile) renderTrainingsplan(state.profile);
      toast(mode === 'edit' ? 'Bearbeiten-Modus aktiv' : 'Ansicht-Modus');
    });
  });

  // ── Übungspicker State ──
  let pickerCat = 'all';
  let pickerSearch = '';

  // Equipment-Set für den aktuellen Plan-Block ermitteln
  function _pickerAvailableEq() {
    const kw = state.tpViewKw;
    const plan = (state.profile?.plans || {})['w' + kw];
    const loc = plan?._location || 'studio';
    const eq = state.profile?.equipment;
    if (!eq || Array.isArray(eq)) return null; // altes Format → kein Filter
    const locEq = eq[loc];
    if (!locEq) return null;
    const avail = new Set(locEq.available || []);
    const excl  = new Set(locEq.excluded || []);
    avail.add('Bodyweight'); // Bodyweight immer verfügbar
    // Ausgeschlossene entfernen
    excl.forEach(e => avail.delete(e));
    return avail;
  }

  function renderPickerGrid() {
    const grid = document.getElementById('tpPickerGrid');
    if (!grid) return;
    const all = _lxAllExercises();
    const q = pickerSearch.toLowerCase();
    const availEq = _pickerAvailableEq();

    const filtered = all.filter(ex => {
      if (pickerCat !== 'all' && ex.catKey !== pickerCat) return false;
      if (q) {
        const hay = (ex.name + ' ' + ex.muscle).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // Equipment-Filter: ALLE Equipment-Items der Übung müssen verfügbar sein.
      // Wichtig für Kombi-Übungen wie ['Kurzhanteln', 'Hantelbank'] — hier
      // reichen Kurzhanteln allein nicht, ohne Bank ist die Übung nicht
      // sinnvoll ausführbar.
      if (availEq && ex.eq && ex.eq.length > 0) {
        if (!ex.eq.every(e => availEq.has(e))) return false;
      }
      return true;
    });
    grid.innerHTML = filtered.map(ex => `
      <div class="tp-picker-card" data-ex-name="${escapeHtml(ex.name)}" data-ex-muscle="${escapeHtml(ex.muscle)}">
        <div class="tp-picker-name">${escapeHtml(ex.name)}</div>
        <div class="tp-picker-muscle">${escapeHtml(ex.muscle)}</div>
      </div>`).join('') || '<div style="color:var(--text-3);padding:var(--s-4);">Keine Übungen gefunden.</div>';
  }

  function renderPickerCats() {
    const catsEl = document.getElementById('tpPickerCats');
    if (!catsEl) return;
    let html = `<button class="tp-picker-cat${pickerCat === 'all' ? ' active' : ''}" data-pcat="all">Alle</button>`;
    Object.entries(LX_CATEGORIES).forEach(([key, label]) => {
      html += `<button class="tp-picker-cat${pickerCat === key ? ' active' : ''}" data-pcat="${key}">${escapeHtml(label)}</button>`;
    });
    catsEl.innerHTML = html;
    catsEl.querySelectorAll('.tp-picker-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        pickerCat = btn.dataset.pcat;
        renderPickerCats();
        renderPickerGrid();
      });
    });
  }

  // ── Übung hinzufügen Button ──
  const addBtn = document.getElementById('tpAddExercise');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const kw = state.tpViewKw;
      const plan = (state.profile?.plans || {})['w' + kw];
      if (!plan || !plan.days) {
        // Kein Plan → neuen erstellen
        if (!state.profile.plans) state.profile.plans = {};
        state.profile.plans['w' + kw] = {
          name: 'Individuell KW ' + kw,
          goal: 'allgemein',
          _source: 'manual',
          days: [{ label: 'Mo', exercises: [] }]
        };
      }
      pickerCat = 'all';
      pickerSearch = '';
      const searchEl = document.getElementById('tpPickerSearch');
      if (searchEl) searchEl.value = '';
      renderPickerCats();
      renderPickerGrid();
      openModal('exercisePickerModal');
    });
  }

  // ── Picker Search ──
  const pickerSearchEl = document.getElementById('tpPickerSearch');
  if (pickerSearchEl) {
    pickerSearchEl.addEventListener('input', () => {
      pickerSearch = pickerSearchEl.value;
      renderPickerGrid();
    });
  }

  // ── Picker Grid Click → Übung zum Plan hinzufügen ──
  const pickerGrid = document.getElementById('tpPickerGrid');
  if (pickerGrid) {
    pickerGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.tp-picker-card');
      if (!card) return;
      const name = card.dataset.exName;
      const muscle = card.dataset.exMuscle;
      const kw = state.tpViewKw;
      const plan = (state.profile?.plans || {})['w' + kw];
      if (!plan || !plan.days) return;
      const dayIdx = state.tpViewDay;
      if (!plan.days[dayIdx]) return;
      // Prüfen ob Übung schon vorhanden
      const exists = plan.days[dayIdx].exercises.some(ex => ex.name === name);
      if (exists) {
        toast('Übung ist schon im Plan');
        return;
      }
      plan.days[dayIdx].exercises.push({
        name, muscle, saetze: 3, wdh: 10, gewicht: null
      });
      closeModal('exercisePickerModal');
      _saveProfile();
      renderTrainingsplan(state.profile);
      toast(name + ' hinzugefügt');
    });
  }

  // ── Delegierte Events im Übungs-Container ──
  const exContainer = document.getElementById('tpExercises');
  if (exContainer) {
    exContainer.addEventListener('click', (e) => {
      // Löschen
      const delBtn = e.target.closest('.tp-ex-delete');
      if (delBtn) {
        const exName = delBtn.dataset.exName;
        const kw = state.tpViewKw;
        const plan = (state.profile?.plans || {})['w' + kw];
        if (!plan || !plan.days) return;
        const day = plan.days[state.tpViewDay];
        if (!day) return;
        day.exercises = day.exercises.filter(ex => ex.name !== exName);
        _saveProfile();
        renderTrainingsplan(state.profile);
        toast('Übung entfernt');
        return;
      }
    });

    // Param-Änderungen (Sätze, Wdh, Gewicht)
    exContainer.addEventListener('change', (e) => {
      const input = e.target.closest('.tp-ex-param input');
      if (!input) return;
      const exName = input.dataset.exName;
      const field = input.dataset.field;
      const val = parseFloat(input.value) || 0;
      const kw = state.tpViewKw;
      const plan = (state.profile?.plans || {})['w' + kw];
      if (!plan || !plan.days) return;
      const day = plan.days[state.tpViewDay];
      if (!day) return;
      const ex = day.exercises.find(e => e.name === exName);
      if (!ex) return;
      ex[field] = val;
      _saveProfile();
      renderTrainingsplan(state.profile);
    });
  }
})();


// Window-Brücke für log-session.js (temporär)
