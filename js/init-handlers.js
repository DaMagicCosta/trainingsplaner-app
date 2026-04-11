/**
 * init-handlers.js — Event-Handler-Setup (IIFEs)
 * Zentrale Datei für alle DOM-Event-Bindings.
 * Wird nach allen Modulen geladen (app.js importiert als letztes).
 */
import { state, STORAGE_KEYS } from './state.js';
import { toast } from './utils.js';
import { switchTab } from './tabs.js';
import { renderFortschritt } from './pages/fortschritt.js';
import { renderInfo, exportProfileJson, importProfileJson } from './pages/info.js';
import { renderLexikon, openLexikonSheet, closeLexikonSheet } from './pages/lexikon.js';
import { reloadDemoProfile } from './demo-loader.js';
import { openProfileEditModal, saveProfileEdit } from './features/profile-edit.js';
import { revokeConsent } from './consent.js';
import { openAnamneseEditModal, saveAnamneseEdit, openAnamneseHistoryModal } from './features/anamnese-edit.js';

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
  if (anaUpdateBtn)    anaUpdateBtn.addEventListener('click',    openAnamneseEditModal);
  if (anaHistoryBtn)   anaHistoryBtn.addEventListener('click',   openAnamneseHistoryModal);

  // Anamnese-Edit-Modal: Conditions-Chips toggeln
  document.querySelectorAll('#aemConditionsChips .tp-chip').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('active'));
  });

  // Anamnese-Edit-Modal: Confirm-Checkbox steuert Save-Button
  const aemConfirm = document.getElementById('aemConfirm');
  const aemSaveBtn = document.getElementById('aemSaveBtn');
  if (aemConfirm && aemSaveBtn) {
    aemConfirm.addEventListener('change', () => {
      aemSaveBtn.disabled = !aemConfirm.checked;
    });
    aemSaveBtn.addEventListener('click', saveAnamneseEdit);
  }
  if (verReconfirmBtn) verReconfirmBtn.addEventListener('click', () => toast('Vereinbarung erneut bestätigt'));
  if (verRevokeBtn)    verRevokeBtn.addEventListener('click',    () => toast('Widerruf-Flow folgt in v2.8'));

  // DSGVO-Einwilligung widerrufen (Recht → Datenschutzerklärung Abschnitt 8)
  const consentRevokeBtn = document.getElementById('consentRevokeBtn');
  if (consentRevokeBtn) consentRevokeBtn.addEventListener('click', () => {
    const ok = confirm(
      'Einwilligung wirklich zurückziehen?\n\n' +
      'Beim nächsten Aufruf wird das Welcome-Modal erneut angezeigt.\n\n' +
      'Mit "OK" wirst du gleich gefragt, ob auch deine lokal gespeicherten ' +
      'Trainingsdaten gelöscht werden sollen.'
    );
    if (!ok) return;
    const alsoData = confirm(
      'Auch alle lokal gespeicherten Trainingsdaten löschen?\n\n' +
      '• OK = Ja, alles löschen (Profil, Sessions, Pläne, Einstellungen)\n' +
      '• Abbrechen = Nein, nur Einwilligung widerrufen, Daten behalten'
    );
    revokeConsent(alsoData);
  });

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
      if (state.profile) renderFortschritt(state.profile);
    });
  });

})();

