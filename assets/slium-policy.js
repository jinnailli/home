(() => {
  'use strict';
  const codes = ['ko', 'en', 'jp'];
  const normalize = value => value === 'ja' ? 'jp' : value;
  function select(code) {
    code = codes.includes(normalize(code)) ? normalize(code) : 'en';
    document.documentElement.lang = code === 'jp' ? 'ja' : code;
    document.querySelectorAll('[data-en][data-ko]').forEach(element => {
      const value = element.dataset[code] || element.dataset.en;
      if (element.tagName === 'META') element.content = value;
      else element.innerHTML = value;
    });
    document.querySelectorAll('[data-language]').forEach(element => {
      element.hidden = element.dataset.language !== code;
    });
    document.querySelectorAll('[data-aria-en][data-aria-ko]').forEach(element => {
      element.setAttribute('aria-label', element.dataset[code === 'jp' ? 'ariaJp' : code === 'ko' ? 'ariaKo' : 'ariaEn'] || element.dataset.ariaEn);
    });
    codes.forEach(value => {
      const button = document.getElementById(value);
      button.classList.toggle('active', value === code);
      button.setAttribute('aria-pressed', String(value === code));
    });
    // Other site pages currently offer Korean and English. Do not imply a Japanese translation there.
    document.querySelectorAll('[data-local], [data-policy]').forEach(link => {
      const destination = new URL(link.dataset.policy || link.dataset.local, location.href);
      const policy = destination.pathname.endsWith('/privacy/slium.html');
      destination.searchParams.set('lang', policy ? code : code === 'jp' ? 'en' : code);
      link.href = destination.pathname + destination.search + destination.hash;
    });
    const url = new URL(location.href);
    url.searchParams.set('lang', code);
    if (/^#(?:ko|en|jp)-\d+$/.test(url.hash)) url.hash = url.hash.replace(/^#(?:ko|en|jp)-/, '#' + code + '-');
    history.replaceState(history.state, '', url);
    // Reuse the existing site preference only for its supported languages; add no new storage key.
    if (code !== 'jp') try { localStorage.setItem('qbrubyLang', code); } catch (_) {}
  }
  const requested = normalize(new URLSearchParams(location.search).get('lang'));
  let initial = requested;
  if (!codes.includes(initial)) {
    try { initial = localStorage.getItem('qbrubyLang'); } catch (_) {}
    if (!codes.includes(initial)) {
      const locale = (navigator.language || '').toLowerCase();
      initial = locale.startsWith('ja') ? 'jp' : locale.startsWith('ko') ? 'ko' : 'en';
    }
  }
  codes.forEach(code => document.getElementById(code).addEventListener('click', () => select(code)));
  select(initial);
})();
