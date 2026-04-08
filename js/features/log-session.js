import { state } from '../state.js';
import { toast, _isoWeek } from '../utils.js';
import { switchTab } from '../tabs.js';
import { renderCockpit } from '../pages/cockpit.js';
import { renderJahresplan } from '../pages/jahresplan.js';
import { renderTrainingsplan, _logSet, _getSessionsByDay } from '../pages/trainingsplan.js';
import { _getBwFactor, _effectiveWeight } from './muscle-balance.js';

export { startNextEinheit };

function startNextEinheit() {
  const btn = document.getElementById('cpNextAction');
  // Primaerquelle: das Cockpit hat beim Rendern die naechste Einheit im dataset.
  let targetKw  = btn ? parseInt(btn.dataset.targetKw  || '0', 10) : 0;
  let targetDay = btn ? parseInt(btn.dataset.targetDay || '0', 10) : 0;
  if (!targetKw) { toast('Keine naechste Einheit geplant'); return; }
  state.tpViewKw  = targetKw;
  state.tpViewDay = targetDay;
  state.tpEditing = null;
  if (state.profile) renderTrainingsplan(state.profile);
  switchTab('trainingsplan');
}

// Cockpit "Einheit starten"-Button: Deep-Link zum Trainingsplan
(function initCpNextAction() {
  const btn = document.getElementById('cpNextAction');
  if (!btn) return;
  btn.addEventListener('click', startNextEinheit);
})();

// Trainingsplan Log-Flow (Schritt 5): delegierter Handler am Exercises-Container
(function initTpLogFlow() {
  const container = document.getElementById('tpExercises');
  if (!container) return;

  function findEditingRow() {
    return container.querySelector('.tp-set-editing');
  }

  function readEditingValues(row) {
    const inputs = row.querySelectorAll('.tp-set-input');
    const values = {};
    inputs.forEach(inp => { values[inp.dataset.field] = inp.value.trim(); });
    return values;
  }

  function getActiveContext() {
    if (!state.profile) return null;
    const kw = state.tpViewKw;
    const plan = (state.profile.plans || {})['w' + kw];
    if (!plan) return null;
    const day = plan.days?.[state.tpViewDay];
    if (!day) return null;
    const year = _isoWeek(new Date()).year;
    return { kw, year, dayIdx: state.tpViewDay, dayLabel: day.label, day };
  }

  function cancelEdit() {
    state.tpEditing = null;
    if (state.profile) renderTrainingsplan(state.profile);
  }

  function saveEdit(row) {
    const ctx = getActiveContext();
    if (!ctx) return;
    const exerciseName = row.dataset.ex;
    if (!exerciseName) return;

    // Plan-Exercise für muscle/Metadaten finden
    const planEx = (ctx.day.exercises || []).find(e => e.name === exerciseName);
    if (!planEx) return;

    const vals = readEditingValues(row);
    // Minimale Validierung
    const wdh = parseFloat(vals.wdh);
    const kg  = parseFloat(vals.gewicht);
    if (!wdh || wdh < 1) { toast('Wdh muss mindestens 1 sein'); return; }

    // BW-Übungen: Effektivgewicht berechnen (Eingabe = Zusatzgewicht)
    const bwF = _getBwFactor(exerciseName);
    let effectiveKg, bwZusatz;
    if (bwF) {
      bwZusatz = Number(vals.gewicht) || 0;
      effectiveKg = _effectiveWeight(exerciseName, bwZusatz, state.profile);
    } else {
      if (isNaN(kg)) { toast('Gewicht fehlt'); return; }
      effectiveKg = vals.gewicht;
    }

    const setData = { wdh: vals.wdh, gewicht: effectiveKg, rpe: vals.rpe };
    if (bwF) setData._bwZusatz = bwZusatz;

    _logSet(state.profile, ctx.kw, ctx.year, ctx.dayIdx, ctx.dayLabel, planEx, setData);

    // Nächsten offenen Satz DERSELBEN Übung suchen → Auto-Fokus (Power-User-Tempo)
    // Sessions neu laden, weil _logSet grade mutiert hat
    const freshSession = _getSessionsByDay(state.profile, ctx.kw, ctx.year)[ctx.dayIdx];
    const freshEx = freshSession?.exercises?.find(e => e.name === exerciseName);
    const loggedCount = (freshEx?.sets || []).length;
    const plannedSets = Number(planEx.saetze) || 3;

    if (loggedCount < plannedSets) {
      // Es gibt noch offene Sätze → Edit-Modus auf den nächsten setzen
      state.tpEditing = { exerciseName, setIdx: loggedCount };
    } else {
      state.tpEditing = null;
    }

    // Alle drei Views aktualisieren — gleicher state.profile, alle spiegeln die neue Session
    renderTrainingsplan(state.profile);
    renderCockpit(state.profile);
    renderJahresplan(state.profile);
    toast('Satz geloggt');

    // Fokus auf den nächsten offenen Satz (wenn Auto-Advance aktiv)
    if (state.tpEditing) {
      setTimeout(() => {
        const editRow = container.querySelector('.tp-set-editing');
        if (editRow) {
          // Bei Auto-Advance: Fokus auf RPE-Feld (Wdh/Gewicht sind ja vorbefüllt)
          const rpeInput = editRow.querySelector('.tp-set-input[data-field="rpe"]');
          (rpeInput || editRow.querySelector('.tp-set-input'))?.focus();
          (rpeInput || editRow.querySelector('.tp-set-input'))?.select();
        }
      }, 60);
    }
  }

  // Click-Delegation auf dem Container
  container.addEventListener('click', (e) => {
    // + Loggen → Edit-Modus öffnen
    const logBtn = e.target.closest('.tp-set-log-btn');
    if (logBtn) {
      const row = logBtn.closest('.tp-set');
      if (row && row.dataset.ex) {
        state.tpEditing = {
          exerciseName: row.dataset.ex,
          setIdx: parseInt(row.dataset.set || '0', 10)
        };
        if (state.profile) renderTrainingsplan(state.profile);
        // Focus auf erstes leeres Feld setzen
        setTimeout(() => {
          const editRow = findEditingRow();
          if (editRow) {
            const firstEmpty = Array.from(editRow.querySelectorAll('.tp-set-input'))
              .find(i => !i.value) || editRow.querySelector('.tp-set-input');
            firstEmpty?.focus();
            firstEmpty?.select();
          }
        }, 50);
      }
      return;
    }
    // Speichern
    if (e.target.closest('.tp-set-save')) {
      const row = e.target.closest('.tp-set-editing');
      if (row) saveEdit(row);
      return;
    }
    // Abbrechen
    if (e.target.closest('.tp-set-cancel')) {
      cancelEdit();
      return;
    }
  });

  // Keyboard: Enter = speichern, Escape = abbrechen (nur innerhalb Edit-Zeile)
  container.addEventListener('keydown', (e) => {
    if (!e.target.classList.contains('tp-set-input')) return;
    const row = e.target.closest('.tp-set-editing');
    if (!row) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(row);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  });
})();

// Trainingsplan KW-Navigation (Schritt 2): Pfeile + Heute-Button
(function initTpNav() {
  const prevBtn  = document.getElementById('tpPrev');
  const nextBtn  = document.getElementById('tpNext');
  const todayBtn = document.getElementById('tpToday');
  if (!prevBtn || !nextBtn || !todayBtn) return;

  function stepKw(delta) {
    if (!state.profile) return;
    let kw = (state.tpViewKw || 1) + delta;
    if (kw < 1) kw = 52;
    if (kw > 52) kw = 1;
    state.tpViewKw = kw;
    state.tpViewDay = 0; // beim KW-Wechsel auf ersten Tag
    renderTrainingsplan(state.profile);
  }

  function jumpToday() {
    if (!state.profile) return;
    state.tpViewKw = _isoWeek(new Date()).week;
    state.tpViewDay = 0;
    renderTrainingsplan(state.profile);
    toast('Zurück zur aktuellen Woche');
  }

  prevBtn.addEventListener('click', () => stepKw(-1));
  nextBtn.addEventListener('click', () => stepKw(1));
  todayBtn.addEventListener('click', jumpToday);

  // Keyboard-Shortcut: Pfeil links/rechts wenn der Trainingsplan-Tab aktiv ist
  document.addEventListener('keydown', (e) => {
    if (state.activeTab !== 'trainingsplan') return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); stepKw(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); stepKw(1);  }
  });
})();

// Jahresplan-Modus-Toggle (Ansicht / Bearbeiten) verdrahten
(function initJahresplanMode() {
  const jp = document.querySelector('.page[data-page="jahresplan"]');
  if (!jp) return;
  // Initial Ansicht-Modus
  jp.classList.add('mode-view');
  document.querySelectorAll('#jpMode button').forEach(btn => {
    btn.addEventListener('click', () => {
      // Athleten dürfen nicht wechseln
      if (state.role !== 'trainer') return;
      const mode = btn.dataset.mode;
      jp.classList.toggle('mode-edit', mode === 'edit');
      jp.classList.toggle('mode-view', mode === 'view');
      document.querySelectorAll('#jpMode button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      toast(mode === 'edit' ? 'Bearbeiten-Modus aktiv' : 'Ansicht-Modus');
    });
  });
  // + Neuer Plan Button → Toast-Hinweis auf Plan-Arsenal (kommt mit Persistenz)
  const newBtn = document.getElementById('jpNewBtn');
  if (newBtn) newBtn.addEventListener('click', () => {
    toast('Plan-Vorlagen & Arsenal — kommt mit der Persistenz-Etappe. Nutze den Generator im Bearbeiten-Modus.');
    // Aktiviere Edit-Modus und scrolle zum Generator
    if (!jp.classList.contains('mode-edit')) {
      document.querySelector('#jpMode button[data-mode="edit"]')?.click();
    }
    setTimeout(() => {
      const gen = document.querySelector('.jp-edit-content');
      if (gen) gen.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  });
})();

