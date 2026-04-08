import { state, STORAGE_KEYS, _saveProfile, _clearSavedProfile } from '../state.js';
import { toast, _fmtKg } from '../utils.js';
import { switchTab } from '../tabs.js';

export { renderInfo, exportProfileJson, importProfileJson };

/* ═══════════════════════════════════════════════════════
   INFO & EINSTELLUNGEN (v2.7)
   ═══════════════════════════════════════════════════════ */

function renderInfo(profile) {
  if (!profile) return;

  // Profil-Hero
  const name = ((profile.name || '') + ' ' + (profile.nachname || '')).trim() || 'Unbekannt';
  document.getElementById('infoProfileName').textContent = name;

  // Sidebar-Name synchronisieren (wird sonst nie gesetzt)
  const roleNameEl = document.getElementById('roleName');
  if (roleNameEl) roleNameEl.textContent = name;

  const parts = [];
  if (profile.alter)    parts.push(profile.alter + ' Jahre');
  if (profile.gewicht)  parts.push(profile.gewicht + ' kg');
  if (profile.groesse)  parts.push(profile.groesse + ' cm');
  if (profile.hfmax)    parts.push('HF max ' + profile.hfmax);
  document.getElementById('infoProfileStats').textContent = parts.join(' · ') || '—';

  // Profil-Label folgt dem aktiven Rollen-Modus (nicht dem im Demo-JSON gebackenen Wert)
  const subEl = document.getElementById('infoProfileSub');
  if (subEl) {
    subEl.textContent = state.role === 'trainer' ? 'Trainer-Profil' : 'Athleten-Profil';
  }

  // Profil-Details-Rows
  const goalLabels = {
    hypertrophie:  'Hypertrophie (Muskelaufbau)',
    maximalkraft:  'Maximalkraft',
    kraftausdauer: 'Kraftausdauer',
    abnehmen:      'Abnehmen / Fettreduktion',
    allgemein:     'Allgemeine Fitness'
  };
  const goal = goalLabels[profile.goal] || profile.goal || '—';
  const tage = (profile.tage || []).join(' · ') || '—';
  const tageCount = (profile.tage || []).length;
  const equipment = _formatEquipment(profile.equipment);
  const sessions = (profile.sessions || []).length;
  const plans = Object.keys(profile.plans || {}).length;

  const rowsEl = document.getElementById('infoProfileRows');
  if (rowsEl) {
    rowsEl.innerHTML = `
      <div class="info-row">
        <div class="info-row-key">Trainingsziel</div>
        <div class="info-row-val">${escapeHtml(goal)}</div>
      </div>
      <div class="info-row">
        <div class="info-row-key">Trainingstage</div>
        <div class="info-row-val">${escapeHtml(tage)}${tageCount ? ' <span style="color:var(--text-3)">(' + tageCount + '×/Woche)</span>' : ''}</div>
      </div>
      <div class="info-row">
        <div class="info-row-key">Trainingsort</div>
        <div class="info-row-val">${escapeHtml(_formatLocations(profile.trainingLocation))}</div>
      </div>
      <div class="info-row">
        <div class="info-row-key">Ausrüstung</div>
        <div class="info-row-val">${equipment}</div>
      </div>
      <div class="info-row">
        <div class="info-row-key">Sessions (Historie)</div>
        <div class="info-row-val">${_fmtNum(sessions)} geloggte Einheiten</div>
      </div>
      <div class="info-row">
        <div class="info-row-key">Pläne</div>
        <div class="info-row-val">${_fmtNum(plans)} Wochenpläne hinterlegt</div>
      </div>
      <div class="info-row">
        <div class="info-row-key">Profil-ID</div>
        <div class="info-row-val"><code>${escapeHtml(profile.id || '—')}</code></div>
      </div>
    `;
  }

  // Theme-Namen im Einstellungen-Tab aktualisieren
  const themeNameEl = document.getElementById('infoThemeName');
  if (themeNameEl && typeof themeLabels !== 'undefined') {
    themeNameEl.textContent = themeLabels[state.theme] || state.theme || '—';
  }

  console.log('[Info] gerendert', { name, sessions, plans });
}

// Profil als JSON herunterladen
function exportProfileJson() {
  if (!state.profile) { toast('Kein Profil geladen'); return; }
  const blob = new Blob(
    [JSON.stringify(state.profile, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = ((state.profile.name || 'Profil') + '_' + (state.profile.nachname || ''))
    .replace(/[^\wäöüÄÖÜß-]/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `Trainingsplaner_${safeName}_${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Profil exportiert');
}

// Demo-Profil neu laden (verwirft alle RAM-Mutationen)
function importProfileJson() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const profile = JSON.parse(text);
      if (!profile.name) { toast('Ungültiges Profil — "name" fehlt'); return; }
      if (!profile.sessions) profile.sessions = [];
      if (!profile.plans) profile.plans = {};
      _applyProfile(profile, 'Import');
      _saveProfile();
    } catch (err) {
      toast('Import fehlgeschlagen: ' + err.message);
    }
  });
  input.click();
}

async function reloadDemoProfile() {
  _clearSavedProfile();
  toast('Demo zurückgesetzt …');
  await _loadDemoFromFetch();
}


