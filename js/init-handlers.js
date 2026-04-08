/**
 * init-handlers.js — Event-Handler-Setup (IIFEs)
 * Zentrale Datei für alle DOM-Event-Bindings.
 * Wird nach allen Modulen geladen (app.js importiert als letztes).
 */
import { state, STORAGE_KEYS, _saveProfile } from './state.js';
import { toast, _isoWeek, _fmtKg } from './utils.js';
import { switchTab } from './tabs.js';
import { renderCockpit } from './pages/cockpit.js';
import { renderJahresplan } from './pages/jahresplan.js';
import { renderTrainingsplan } from './pages/trainingsplan.js';
import { renderFortschritt } from './pages/fortschritt.js';
import { renderInfo, exportProfileJson, importProfileJson } from './pages/info.js';
import { renderLexikon } from './pages/lexikon.js';
import { reloadDemoProfile } from './demo-loader.js';
import { openProfileEditModal } from './features/profile-edit.js';

// ── Info-Tab Event-Handler ──
// Info & Einstellungen (v2.7): Export/Reload-Buttons + Sub-Navigation
(function initInfo() {
  const exportBtn = document.getElementById('infoExportBtn');
  const importBtn = document.getElementById('infoImportBtn');
  const reloadBtn = document.getElementById('infoReloadBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportProfileJson);
  if (importBtn) importBtn.addEventListener('click', importProfileJson);
  if (reloadBtn) reloadBtn.addEventListener('click', reloadDemoProfile);

  // Anamnese & Trainer-Vereinbarung Buttons (Platzhalter)
  const anaUpdateBtn    = document.getElementById('anamneseUpdateBtn');
  const anaHistoryBtn   = document.getElementById('anamneseHistoryBtn');
  const verReconfirmBtn = document.getElementById('vereinbarungReconfirmBtn');
  const verRevokeBtn    = document.getElementById('vereinbarungRevokeBtn');
  if (anaUpdateBtn)    anaUpdateBtn.addEventListener('click',    () => toast('Anamnese-Bearbeitung folgt in v2.8'));
  if (anaHistoryBtn)   anaHistoryBtn.addEventListener('click',   () => toast('Historie-Ansicht folgt'));
  if (verReconfirmBtn) verReconfirmBtn.addEventListener('click', () => toast('Vereinbarung erneut bestätigt'));
  if (verRevokeBtn)    verRevokeBtn.addEventListener('click',    () => toast('Widerruf-Flow folgt in v2.8'));

  // Sub-Navigation Handler
  const sections = document.querySelectorAll('.info-section');
  const buttons  = document.querySelectorAll('#infoSubnav button');

  function activateSection(name) {
    state.infoSection = name;
    localStorage.setItem('tpv2_info_section', name);
    buttons.forEach(b => b.classList.toggle('active', b.dataset.section === name));
    sections.forEach(s => s.classList.toggle('active', s.dataset.section === name));
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => activateSection(btn.dataset.section));
  });

  // Initial-Zustand aus state (bei Page-Load)
  activateSection(state.infoSection);
})();

// ── Profil-Edit Event-Handler ──
(function initProfileEdit() {
  // Chip-Toggle: Tage (2-Zustand)
  document.querySelectorAll('#pemTageChips .tp-chip').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('active'));
  });

  // Chip-Toggle: Trainingsort (2-Zustand) + Equipment-Gruppen ein-/ausblenden
  document.querySelectorAll('#pemLocationChips .tp-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      // Equipment-Gruppen synchronisieren
      const loc = chip.dataset.loc;
      const group = document.querySelector(`#pemEquipmentWrap .pem-eq-group[data-eqloc="${loc}"]`);
      if (group) group.classList.toggle('visible', chip.classList.contains('active'));
    });
  });

  // Chip-Toggle: Equipment (3-Zustand: off → active → excluded → off)
  document.querySelectorAll('#pemEquipmentWrap .tp-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (chip.classList.contains('excluded')) {
        // excluded → off
        chip.classList.remove('excluded');
      } else if (chip.classList.contains('active')) {
        // active → excluded
        chip.classList.remove('active');
        chip.classList.add('excluded');
      } else {
        // off → active
        chip.classList.add('active');
      }
    });
  });

  // Speichern-Button
  const saveBtn = document.getElementById('profileEditSaveBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveProfileEdit);

  // Einstiegspunkt 1: Button im Info-Tab Profil-Section
  const openBtn = document.getElementById('profileEditOpenBtn');
  if (openBtn) openBtn.addEventListener('click', openProfileEditModal);

  // Schnellzugriff: Anamnesebogen / Vereinbarung direkt aus der Profil-Section
  const anamneseBtn = document.getElementById('profileAnamneseBtn');
  if (anamneseBtn) anamneseBtn.addEventListener('click', () => {
    document.querySelectorAll('#infoSubnav button').forEach(b => b.classList.toggle('active', b.dataset.section === 'anamnese'));
    document.querySelectorAll('.info-section').forEach(s => s.classList.toggle('active', s.dataset.section === 'anamnese'));
    state.infoSection = 'anamnese';
    localStorage.setItem('tpv2_info_section', 'anamnese');
  });
  const vereinbarungBtn = document.getElementById('profileVereinbarungBtn');
  if (vereinbarungBtn) vereinbarungBtn.addEventListener('click', () => {
    document.querySelectorAll('#infoSubnav button').forEach(b => b.classList.toggle('active', b.dataset.section === 'vereinbarung'));
    document.querySelectorAll('.info-section').forEach(s => s.classList.toggle('active', s.dataset.section === 'vereinbarung'));
    state.infoSection = 'vereinbarung';
    localStorage.setItem('tpv2_info_section', 'vereinbarung');
  });

  // Einstiegspunkt 2: Sidebar-Dropdown "Profil bearbeiten"
  document.querySelectorAll('.role-dropdown .dropdown-item').forEach(item => {
    const txt = item.textContent.trim();
    if (txt === 'Profil bearbeiten') {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        // Dropdown schließen, falls offen
        const dd = document.getElementById('roleDropdown');
        if (dd) dd.classList.remove('open');
        openProfileEditModal();
      });
    }
  });

  // Athleten-Verwalten: Bearbeiten öffnet das gleiche Profil-Edit-Modal,
  // aber mit Julia als Target statt Alexander. Save-Logik weiß anhand state._editTarget,
  // wohin geschrieben wird.
  document.querySelectorAll('[data-athlete-edit]').forEach(btn => {
    btn.addEventListener('click', () => openProfileEditModal(btn.dataset.athleteEdit));
  });
  document.querySelectorAll('[data-athlete-remove]').forEach(btn => {
    btn.addEventListener('click', () => toast('Entfernen: folgt mit Multi-Profil-Persistenz'));
  });
  const addBtn = document.getElementById('athleteAddBtn');
  if (addBtn) addBtn.addEventListener('click', () => toast('Neuer Athlet: folgt mit Multi-Profil-Persistenz'));
})();

// ── Lexikon Event-Handler ──
(function initLexikon() {
  // Initial-Render (unabhängig vom Profil, weil Daten in der App eingebettet sind)
  renderLexikon();

  // Live-Suche mit kleinem Debounce
  const searchEl = document.getElementById('lxSearch');
  if (searchEl) {
    let t;
    searchEl.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.lxSearch = searchEl.value;
        renderLexikon();
      }, 120);
    });
  }

  // Kategorie-Pills
  document.querySelectorAll('#lxCategories button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.lxCategory = btn.dataset.cat;
      document.querySelectorAll('#lxCategories button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLexikon();
    });
  });

  // Location-Pills (Trainingsort-Filter)
  document.querySelectorAll('#lxLocations button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.lxLocation = btn.dataset.loc;
      document.querySelectorAll('#lxLocations button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLexikon();
    });
  });

  // Klick auf Karte → Sheet öffnen (Event-Delegation)
  const grid = document.getElementById('lxGrid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.lx-card');
      if (!card || !grid._filtered) return;
      const idx = parseInt(card.dataset.idx || '0', 10);
      const exercise = grid._filtered[idx];
      if (exercise) openLexikonSheet(exercise);
    });
  }

  // Sheet schließen: Close-Button, Backdrop-Klick, Escape
  document.getElementById('lxSheetClose')?.addEventListener('click', closeLexikonSheet);
  document.getElementById('lxSheetBackdrop')?.addEventListener('click', closeLexikonSheet);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const sheet = document.getElementById('lxSheet');
      if (sheet?.classList.contains('open')) closeLexikonSheet();
    }
  });
})();

// ── Fortschritt Event-Handler ──
(function initFortschritt() {
  // Initial aktiven Button anhand state setzen
  document.querySelectorAll('#fpRange button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.range === state.fpRange);
    btn.addEventListener('click', () => {
      state.fpRange = btn.dataset.range;
      localStorage.setItem(STORAGE_KEYS.fpRange, state.fpRange);
      document.querySelectorAll('#fpRange button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (state.profile) renderFortschritt(state.profile);
    });
  });

  const select = document.getElementById('fpExerciseSelect');
  if (select) {
    select.addEventListener('change', () => {
      state.fpExercise = select.value;
      localStorage.setItem(STORAGE_KEYS.fpExercise, state.fpExercise);
      if (state.profile) renderFortschritt(state.profile);
    });
  }

  // Klick auf Top-Listen-Zeile → Übung im Hauptchart setzen + dorthin scrollen
  const topList = document.getElementById('fpTopList');
  if (topList) {
    topList.addEventListener('click', (e) => {
      const item = e.target.closest('.fp-top-item[data-exercise]');
      if (!item) return;
      const exName = item.dataset.exercise;
      if (!exName) return;
      state.fpExercise = exName;
      localStorage.setItem(STORAGE_KEYS.fpExercise, exName);
      if (state.profile) renderFortschritt(state.profile);
      document.getElementById('fpChartCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();

// Fortschritt: Zeitvergleich + Standards
(function initFortschrittViews() {
  // ── Compare-Mode Toggle (Jahre/Quartale) ──
  document.querySelectorAll('#fpCompareMode button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#fpCompareMode button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCompare();
    });
  });

})();

// ── Cockpit Next-Action ──
(function initCpNextAction() {
  const btn = document.getElementById('cpNextAction');
  if (!btn) return;
  btn.addEventListener('click', startNextEinheit);
})();

// ── Trainingsplan Log-Flow ──
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

// ── Trainingsplan KW-Navigation ──
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

// ── Jahresplan Mode-Toggle ──
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
