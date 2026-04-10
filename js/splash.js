// ── Splash Screen (nur beim allerersten Besuch dieser Session) ──
// Skip-Bedingung: Wenn noch kein DSGVO-Consent vorliegt, übernimmt das
// Welcome-Modal die Begrüßung — Splash entfällt, sonst rivalisieren beide.
const _splash = document.getElementById('splash');
const _hasConsent = !!localStorage.getItem('tpv2_consent_v1');
if (_splash) {
  if (sessionStorage.getItem('tpv2_splash_seen') || !_hasConsent) {
    _splash.remove();
  } else {
    sessionStorage.setItem('tpv2_splash_seen', '1');
    const _portrait = document.getElementById('splashPortrait');
    let _splashDismissTimer;
    let _glowActive = false;

    function _dismissSplash() {
      if (_glowActive) return;
      _splash.classList.add('hide');
      setTimeout(() => _splash.remove(), 700);
    }

    // Portrait-Tap → Glow-Pulse toggle
    if (_portrait) {
      _portrait.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!_glowActive) {
          _glowActive = true;
          clearTimeout(_splashDismissTimer);
          _portrait.classList.add('glow-pulse');
        } else {
          _glowActive = false;
          _portrait.classList.remove('glow-pulse');
          _splashDismissTimer = setTimeout(_dismissSplash, 4000);
        }
      });
    }

    _splash.addEventListener('click', function() {
      if (_glowActive) {
        _glowActive = false;
        _portrait.classList.remove('glow-pulse');
        _splashDismissTimer = setTimeout(_dismissSplash, 4000);
      } else {
        _dismissSplash();
      }
    });
    _splashDismissTimer = setTimeout(_dismissSplash, 6000);
  }
}
