/* ═══════════════════════════════════════════════════════
   BUG-REPORT (v2.8) — mailto + Clipboard, kein Backend
   ═══════════════════════════════════════════════════════ */
(function initBugReport() {
  const MAIL_TO = 'Alexander.daCostaAmaral@outlook.at';

  const modal    = document.getElementById('bugReportModal');
  const descEl   = document.getElementById('brDescription');
  const contextEl= document.getElementById('brContext');
  const copyBtn  = document.getElementById('brCopyBtn');
  const mailBtn  = document.getElementById('brMailBtn');
  const floater  = document.getElementById('bugFloaterBtn');
  const openFromInfo = document.getElementById('bugReportOpenBtn');
  if (!modal) return;

  const tabLabels = {
    cockpit: 'Cockpit',
    jahresplan: 'Jahresplan',
    trainingsplan: 'Trainingsplan',
    fortschritt: 'Fortschritt',
    lexikon: 'Lexikon',
    info: 'Info & Einstellungen'
  };

  function collectContext() {
    return {
      tab: tabLabels[state.activeTab] || state.activeTab || '—',
      rolle: state.role === 'trainer' ? 'Trainer' : 'Athlet',
      theme: state.theme || '—',
      viewport: window.innerWidth + '×' + window.innerHeight,
      browser: navigator.userAgent,
      zeitpunkt: new Date().toLocaleString('de-DE'),
      url: location.href
    };
  }

  function renderContext() {
    const c = collectContext();
    const rows = [
      ['Tab',       c.tab],
      ['Rolle',     c.rolle],
      ['Theme',     c.theme],
      ['Viewport',  c.viewport],
      ['Zeitpunkt', c.zeitpunkt],
      ['Browser',   c.browser],
      ['URL',       c.url]
    ];
    contextEl.innerHTML = rows.map(([k, v]) =>
      '<div class="br-context-key">' + escapeHtml(k) + '</div>' +
      '<div class="br-context-val">' + escapeHtml(v) + '</div>'
    ).join('');
  }

  function buildReportText() {
    const c = collectContext();
    const desc = (descEl.value || '').trim() || '(keine Beschreibung angegeben)';
    return (
      '[Trainingsplaner v2 Bug]\n\n' +
      'BESCHREIBUNG:\n' + desc + '\n\n' +
      '--- KONTEXT ---\n' +
      'Tab:        ' + c.tab       + '\n' +
      'Rolle:      ' + c.rolle     + '\n' +
      'Theme:      ' + c.theme     + '\n' +
      'Viewport:   ' + c.viewport  + '\n' +
      'Zeitpunkt:  ' + c.zeitpunkt + '\n' +
      'Browser:    ' + c.browser   + '\n' +
      'URL:        ' + c.url       + '\n'
    );
  }

  function buildSubject() {
    const desc = (descEl.value || '').trim();
    const first = desc.split(/\s+/).slice(0, 6).join(' ');
    return '[Trainingsplaner v2 Bug] ' + (first || 'ohne Beschreibung');
  }

  function openBugReport() {
    descEl.value = '';
    renderContext();
    openModal('bugReportModal');
    // Auto-Focus NUR am Desktop, damit am Handy nicht sofort die Tastatur kommt
    if (window.innerWidth > 720) {
      setTimeout(() => descEl.focus(), 100);
    }
  }

  function sendMail() {
    const subject = buildSubject();
    const body = buildReportText();
    const href = 'mailto:' + MAIL_TO +
                 '?subject=' + encodeURIComponent(subject) +
                 '&body=' + encodeURIComponent(body);
    location.href = href;
    // Modal offen lassen — falls kein Mail-Client, kann der Nutzer noch kopieren
    toast('Mail-Client wird geöffnet …');
  }

  async function copyText() {
    const text = buildReportText();
    try {
      await navigator.clipboard.writeText(text);
      toast('Bug-Report in die Zwischenablage kopiert');
      closeModal('bugReportModal');
    } catch (err) {
      // Fallback für Browser ohne Clipboard API oder http/file-Kontext ohne Permission
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        toast('Bug-Report kopiert (Fallback)');
        closeModal('bugReportModal');
      } catch (e2) {
        toast('Kopieren fehlgeschlagen — bitte Mail-Button nutzen');
      }
      document.body.removeChild(ta);
    }
  }

  if (floater)      floater.addEventListener('click', openBugReport);
  if (openFromInfo) openFromInfo.addEventListener('click', openBugReport);
  if (copyBtn)      copyBtn.addEventListener('click', copyText);
  if (mailBtn)      mailBtn.addEventListener('click', sendMail);
})();
