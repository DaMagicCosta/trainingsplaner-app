import { state } from './state.js';
import { toast, escapeHtml } from './utils.js';
import { LEXIKON_DATA, LX_CATEGORIES, LX_LOCATIONS, _lxCatClass, _lxAllExercises } from './data/lexikon-data.js';

export { renderLexikon, openLexikonSheet, closeLexikonSheet };

/* ═══════════════════════════════════════════════════════
   LEXIKON (v2.6) — Übungs-Datenbank + Filter + Detail-Sheet
   Daten portiert aus Original-App (allExercises + caliExercises, 71 Übungen, 6 Gruppen, 3 Trainingsorte)
   ═══════════════════════════════════════════════════════ */


// Lexikon rendern
function renderLexikon() {
  const grid = document.getElementById('lxGrid');
  const empty = document.getElementById('lxEmpty');
  const count = document.getElementById('lxCount');
  if (!grid) return;

  const search = (state.lxSearch || '').trim().toLowerCase();
  const cat = state.lxCategory || 'all';
  const loc = state.lxLocation || 'all';

  const all = _lxAllExercises();
  const filtered = all.filter(ex => {
    if (cat !== 'all' && ex.catKey !== cat) return false;
    if (loc !== 'all' && ex.location !== loc) return false;
    if (!search) return true;
    const hay = (ex.name + ' ' + ex.muscle + ' ' + ex.desc).toLowerCase();
    return hay.includes(search);
  });

  if (count) count.textContent = `${filtered.length} von ${all.length} Übungen`;

  if (filtered.length === 0) {
    grid.style.display = 'none';
    if (empty) empty.style.display = '';
    return;
  }
  grid.style.display = '';
  if (empty) empty.style.display = 'none';

  const locIcons = { studio: '◇', home: '⌂', outdoor: '✦' };
  const locLabels = { studio: 'Studio', home: 'Zuhause', outdoor: 'Outdoor' };

  grid.innerHTML = filtered.map((ex, i) => {
    const catLabel = LX_CATEGORIES[ex.catKey] || '—';
    const catCls   = _lxCatClass(ex.catKey);
    const locIcon  = locIcons[ex.location] || '◇';
    const locLabel = locLabels[ex.location] || 'Studio';
    return `
      <button class="lx-card ${catCls}" data-cat="${ex.catKey}" data-idx="${i}">
        <div class="lx-card-chips">
          <div class="lx-card-cat">${catLabel}</div>
          <div class="lx-card-loc loc-${ex.location}">${locIcon} ${locLabel}</div>
        </div>
        <div class="lx-card-name">${escapeHtml(ex.name)}</div>
        <div class="lx-card-muscle">${escapeHtml(ex.muscle)}</div>
        <div class="lx-card-desc">${escapeHtml(ex.desc)}</div>
      </button>`;
  }).join('');

  // Stash für Klick-Handler (filtered[idx] → Übung)
  grid._filtered = filtered;
}

// Detail-Sheet öffnen
function openLexikonSheet(exercise) {
  const sheet = document.getElementById('lxSheet');
  const content = document.getElementById('lxSheetContent');
  if (!sheet || !content) return;

  const catLabel = LX_CATEGORIES[exercise.catKey] || '—';
  const catCls   = _lxCatClass(exercise.catKey);
  content.innerHTML = `
    <div class="lx-sheet-cat ${catCls}">${catLabel}</div>
    <h2 class="lx-sheet-name">${escapeHtml(exercise.name)}</h2>

    <div class="lx-sheet-section">
      <div class="lx-sheet-label"><span class="lx-sheet-label-dot primary"></span>Primäre Muskeln</div>
      <div class="lx-sheet-text">${escapeHtml(exercise.muscle)}</div>
    </div>

    <div class="lx-sheet-section">
      <div class="lx-sheet-label"><span class="lx-sheet-label-dot secondary"></span>Sekundäre Muskeln</div>
      <div class="lx-sheet-text muted">${escapeHtml(exercise.secondary || '—')}</div>
    </div>

    <div class="lx-sheet-section">
      <div class="lx-sheet-label"><span class="lx-sheet-label-dot antagonist"></span>Antagonisten</div>
      <div class="lx-sheet-text muted">${escapeHtml(exercise.antagonist || '—')}</div>
    </div>

    <div class="lx-sheet-section">
      <div class="lx-sheet-label"><span class="lx-sheet-label-dot desc"></span>Ausführung &amp; Technik</div>
      <div class="lx-sheet-text desc-text">${escapeHtml(exercise.desc)}</div>
    </div>
  `;

  sheet.classList.add('open');
}

function closeLexikonSheet() {
  const sheet = document.getElementById('lxSheet');
  if (sheet) sheet.classList.remove('open');
}

/* ═══════════════════════════════════════════════════════
