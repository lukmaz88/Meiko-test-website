/* ============================================================
   MEIKO — Privacy / cookie notice (vanilla, standalone)
   Uczciwy baner: strona NIE uzywa cookies ani sledzenia.
   Przechowuje lokalnie tylko jezyk (mk-lang) i wybor zgody (mk-consent).
   Dziala na stronie React i na stronie firmowej. Dwujezyczny (mk-lang),
   relabel na zywo przez event 'mk-langchange'.
   ============================================================ */
(function () {
  'use strict';
  var CONSENT_KEY = 'mk-consent';
  var LANG_KEY = 'mk-lang';

  function getLang() { try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'pl'; } catch (e) { return 'pl'; } }
  function hasConsent() { try { return !!localStorage.getItem(CONSENT_KEY); } catch (e) { return false; } }
  function saveConsent() { try { localStorage.setItem(CONSENT_KEY, 'ack-' + Date.now()); } catch (e) { /* ignore */ } }

  if (hasConsent()) return;

  var TXT = {
    pl: {
      title: 'Prywatność i pliki cookie',
      body: 'Ta strona nie używa plików cookie ani narzędzi śledzących — bez analityki i reklam. Zapamiętujemy lokalnie wyłącznie Twój wybór języka (dane niezbędne). Czcionki dostarcza Google Fonts.',
      accept: 'Akceptuję', settings: 'Ustawienia', save: 'Zapisz wybór', back: 'Wróć',
      panelTitle: 'Ustawienia prywatności',
      cats: [
        ['Niezbędne', 'Zapamiętanie języka i Twojego wyboru zgody. Zawsze aktywne.', true],
        ['Czcionki (Google Fonts)', 'Fonty ładowane z serwerów Google w celu wyświetlenia strony — bez plików cookie i śledzenia.', true],
        ['Analityka', 'Nie używamy narzędzi analitycznych.', false],
        ['Marketing', 'Nie używamy plików cookie marketingowych.', false]
      ],
      always: 'Zawsze aktywne', notUsed: 'Nieużywane'
    },
    en: {
      title: 'Privacy & cookies',
      body: 'This website uses no cookies and no tracking tools — no analytics, no ads. We only store your language choice locally (essential data). Fonts are provided by Google Fonts.',
      accept: 'Accept', settings: 'Settings', save: 'Save choice', back: 'Back',
      panelTitle: 'Privacy settings',
      cats: [
        ['Essential', 'Remembers your language and consent choice. Always on.', true],
        ['Fonts (Google Fonts)', 'Fonts loaded from Google servers to display the page — no cookies or tracking involved.', true],
        ['Analytics', 'We use no analytics tools.', false],
        ['Marketing', 'We use no marketing cookies.', false]
      ],
      always: 'Always on', notUsed: 'Not used'
    }
  };

  var STYLE =
    '#mk-consent{position:fixed;z-index:150;left:16px;right:16px;bottom:16px;max-width:640px;margin:0 auto;' +
    'padding:22px 24px;color:#eaf6fb;background:rgba(6,17,31,.97);border:1px solid rgba(61,212,255,.35);' +
    'border-radius:10px;box-shadow:0 24px 70px rgba(0,0,0,.45);backdrop-filter:blur(14px);' +
    "font-family:'DM Sans',system-ui,sans-serif;animation:mkc-in .5s cubic-bezier(.2,.8,.2,1) both}" +
    '@keyframes mkc-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}' +
    "#mk-consent h2{margin:0 0 8px;font:700 15px/1.3 'Manrope',sans-serif;letter-spacing:-.01em}" +
    '#mk-consent p{margin:0;color:#a9c2d1;font-size:13px;line-height:1.65}' +
    '#mk-consent .mkc-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}' +
    "#mk-consent button{font:700 11px/1 'Manrope',sans-serif;letter-spacing:.06em;padding:11px 18px;border-radius:99px;cursor:pointer;border:1px solid rgba(255,255,255,.28);background:transparent;color:#eaf6fb;transition:opacity .2s,background .2s,color .2s}" +
    '#mk-consent button:hover{opacity:.85}' +
    '#mk-consent button.mkc-primary{border-color:#3dd4ff;background:#3dd4ff;color:#06111f}' +
    '#mk-consent .mkc-cats{margin:16px 0 0;display:grid;gap:10px}' +
    '#mk-consent .mkc-cat{display:grid;grid-template-columns:1fr auto;gap:6px 14px;align-items:start;padding:13px 15px;border:1px solid rgba(255,255,255,.14);border-radius:8px}' +
    "#mk-consent .mkc-cat strong{font:700 12px 'Manrope',sans-serif}" +
    '#mk-consent .mkc-cat small{grid-column:1;color:#8fa6b5;font-size:12px;line-height:1.5}' +
    "#mk-consent .mkc-tag{align-self:center;font:700 9px 'Manrope',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#3dd4ff}" +
    '#mk-consent .mkc-tag.off{color:#6c7c8a}' +
    '@media(max-width:520px){#mk-consent{padding:18px}#mk-consent .mkc-actions button{flex:1 1 auto}}';

  var styleEl = document.createElement('style');
  styleEl.id = 'mk-consent-style';
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  var box = document.createElement('section');
  box.id = 'mk-consent';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-live', 'polite');
  document.body.appendChild(box);

  var showingSettings = false;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function render() {
    var t = TXT[getLang()];
    box.setAttribute('aria-label', t.title);
    if (!showingSettings) {
      box.innerHTML =
        '<h2>' + esc(t.title) + '</h2>' +
        '<p>' + esc(t.body) + '</p>' +
        '<div class="mkc-actions">' +
          '<button type="button" class="mkc-settings">' + esc(t.settings) + '</button>' +
          '<button type="button" class="mkc-primary mkc-accept">' + esc(t.accept) + '</button>' +
        '</div>';
      box.querySelector('.mkc-settings').addEventListener('click', function () { showingSettings = true; render(); });
      box.querySelector('.mkc-accept').addEventListener('click', close);
    } else {
      var cats = t.cats.map(function (c) {
        return '<div class="mkc-cat"><strong>' + esc(c[0]) + '</strong>' +
          '<span class="mkc-tag' + (c[2] ? '' : ' off') + '">' + esc(c[2] ? t.always : t.notUsed) + '</span>' +
          '<small>' + esc(c[1]) + '</small></div>';
      }).join('');
      box.innerHTML =
        '<h2>' + esc(t.panelTitle) + '</h2>' +
        '<div class="mkc-cats">' + cats + '</div>' +
        '<div class="mkc-actions">' +
          '<button type="button" class="mkc-back">' + esc(t.back) + '</button>' +
          '<button type="button" class="mkc-primary mkc-save">' + esc(t.save) + '</button>' +
        '</div>';
      box.querySelector('.mkc-back').addEventListener('click', function () { showingSettings = false; render(); });
      box.querySelector('.mkc-save').addEventListener('click', close);
    }
  }

  function close() {
    saveConsent();
    box.style.opacity = '0';
    box.style.transform = 'translateY(20px)';
    box.style.transition = 'opacity .35s, transform .35s';
    window.setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 380);
  }

  render();
  window.addEventListener('mk-langchange', render);
})();
