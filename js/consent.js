/**
 * consent.js — DSGVO-Einwilligung
 *
 * Beim ersten Aufruf (kein tpv2_consent_v1) wird das Welcome-Modal angezeigt
 * und blockiert die App, bis der Nutzer ausdrücklich akzeptiert.
 *
 * Die Einwilligung wird mit Timestamp und Versions-Hash der Rechtstexte
 * gespeichert, sodass bei einer späteren Änderung der DSE/AGB ein erneutes
 * Akzeptieren erzwungen werden kann.
 *
 * Belegspur: Notizen/2026-04-10_rechtsaudit-umsetzung.md (Nachtrag)
 */

const STORAGE_KEY = 'tpv2_consent_v1';

// Versions-Hashes der Rechtstexte. Bei inhaltlicher Änderung erhöhen,
// dann wird beim nächsten Reload der Consent erneut abgefragt.
// 2026-04-11: DSE Abschnitt 2 um Hinweis zu v1-Legacy-Cleanup ergänzt.
export const DSE_VERSION = '2026-04-11';
export const AGB_VERSION = '2026-04-10';

/**
 * Liest den gespeicherten Consent-Eintrag.
 * @returns {{acceptedAt: string, dseVersion: string, agbVersion: string} | null}
 */
export function getConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[Consent] Lesen fehlgeschlagen:', e.message);
    return null;
  }
}

/**
 * Prüft, ob ein gültiger Consent existiert.
 * Gültig = vorhanden UND beide Versionen stimmen mit den aktuellen überein.
 * Ändert sich eine Version, gilt der Consent als veraltet → Modal erneut.
 */
export function hasValidConsent() {
  const c = getConsent();
  if (!c) return false;
  return c.dseVersion === DSE_VERSION && c.agbVersion === AGB_VERSION;
}

/**
 * Schreibt einen neuen Consent-Eintrag mit aktuellem Timestamp.
 */
export function setConsent() {
  const entry = {
    acceptedAt: new Date().toISOString(),
    dseVersion: DSE_VERSION,
    agbVersion: AGB_VERSION
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    console.log('[Consent] Einwilligung gespeichert ·', entry.acceptedAt);
  } catch (e) {
    console.warn('[Consent] Speichern fehlgeschlagen:', e.message);
  }
  return entry;
}

/**
 * Löscht den Consent-Eintrag (für Widerruf).
 */
export function clearConsent() {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[Consent] Einwilligung widerrufen');
}

/**
 * Zeigt das Welcome-Modal und sperrt den Body.
 * Resolved sobald der Nutzer akzeptiert hat.
 */
export function showWelcomeModal() {
  return new Promise(resolve => {
    const modal = document.getElementById('welcomeModal');
    const checkbox = document.getElementById('welcomeAccept');
    const button = document.getElementById('welcomeAcceptBtn');

    if (!modal || !checkbox || !button) {
      console.error('[Consent] Welcome-Modal-Elemente fehlen im DOM');
      resolve(null);
      return;
    }

    // Reset state
    checkbox.checked = false;
    button.disabled = true;
    modal.style.display = 'flex';
    document.body.classList.add('welcome-active');

    // Esc, Click-Outside und Tab-Trap explizit blockieren
    const blockEsc = (e) => { if (e.key === 'Escape') e.preventDefault(); };
    document.addEventListener('keydown', blockEsc, true);

    // Checkbox aktiviert/deaktiviert Button
    const onCheckboxChange = () => { button.disabled = !checkbox.checked; };
    checkbox.addEventListener('change', onCheckboxChange);

    // Akzeptieren
    const onAccept = () => {
      if (!checkbox.checked) return;
      const entry = setConsent();
      modal.style.display = 'none';
      document.body.classList.remove('welcome-active');
      checkbox.removeEventListener('change', onCheckboxChange);
      button.removeEventListener('click', onAccept);
      document.removeEventListener('keydown', blockEsc, true);
      resolve(entry);
    };
    button.addEventListener('click', onAccept);
  });
}

/**
 * Init-Funktion: prüft Consent-Stand. Wenn kein gültiger Consent existiert,
 * zeigt das Modal und wartet auf Akzeptanz.
 *
 * @returns {Promise<boolean>} true wenn (jetzt oder bereits) Consent vorliegt.
 */
export async function initConsent() {
  if (hasValidConsent()) {
    return true;
  }
  await showWelcomeModal();
  return true;
}

/**
 * Formatiert das acceptedAt-Datum für die Anzeige in der DSE-Sektion.
 */
export function formatConsentDate() {
  const c = getConsent();
  if (!c || !c.acceptedAt) return '—';
  try {
    const d = new Date(c.acceptedAt);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} um ${hh}:${min} Uhr`;
  } catch (e) {
    return c.acceptedAt;
  }
}

/**
 * Befüllt die Consent-Anzeige in Info → Recht → Datenschutzerklärung Abschnitt 8.
 * Wird nach Akzeptanz und nach Init aufgerufen.
 */
export function renderConsentInfo() {
  const c = getConsent();
  const dateEl = document.getElementById('consentDate');
  const dseEl = document.getElementById('consentDseVersion');
  const agbEl = document.getElementById('consentAgbVersion');
  if (dateEl) dateEl.textContent = formatConsentDate();
  if (dseEl)  dseEl.textContent  = c?.dseVersion || '—';
  if (agbEl)  agbEl.textContent  = c?.agbVersion || '—';
}

/**
 * Widerruf der Einwilligung. Optional auch alle Trainingsdaten löschen.
 * Lädt die Seite anschließend neu, damit das Welcome-Modal wieder erscheint.
 *
 * @param {boolean} alsoDeleteData — wenn true, werden auch tpv2_profile_data
 *        und alle anderen tpv2_*-Schlüssel gelöscht.
 */
export function revokeConsent(alsoDeleteData = false) {
  clearConsent();
  if (alsoDeleteData) {
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('tpv2_')) keysToDelete.push(k);
    }
    keysToDelete.forEach(k => localStorage.removeItem(k));
    console.log('[Consent] Widerruf inkl. Datenlöschung —', keysToDelete.length, 'Schlüssel entfernt');
  }
  // sessionStorage ebenfalls leeren, damit Splash und Demo-Banner neu erscheinen
  try {
    sessionStorage.removeItem('tpv2_splash_seen');
    sessionStorage.removeItem('tpv2_demo_banner_dismissed');
  } catch (e) { /* ignore */ }
  // Reload, damit initConsent erneut greift
  window.location.reload();
}
