(() => {
  'use strict';
  const codes = ['ko', 'en', 'jp', 'zh-CN', 'zh-TW', 'es', 'pt-BR', 'de', 'fr'];
  const docLang = {jp:'ja','zh-CN':'zh-Hans','zh-TW':'zh-Hant'};
  const normalize = value => {
    const v = String(value || '').replaceAll('_','-').toLowerCase();
    if (v === 'ja' || v === 'jp') return 'jp';
    if (v.startsWith('zh')) return /hant|tw|hk|mo/.test(v) ? 'zh-TW' : 'zh-CN';
    if (v === 'pt' || v.startsWith('pt-')) return 'pt-BR';
    return codes.find(code => code.toLowerCase() === v) || codes.find(code => code === v.split('-')[0]) || '';
  };
  const picker = document.getElementById('policy-language');
  const locales = window.sliumPolicyLocales || {};
  function select(value) {
    const code = normalize(value) || 'en';
    document.documentElement.lang = docLang[code] || code;
    document.querySelectorAll('[data-en][data-ko]').forEach(element => {
      const translation = locales[code]?.ui[element.dataset.en];
      const content = translation || element.getAttribute('data-' + code) || element.dataset.en;
      if (element.tagName === 'META') element.content = content;
      else element.innerHTML = content;
    });
    document.querySelectorAll('[data-language]').forEach(element => {
      element.hidden = element.dataset.language !== code;
    });
    document.querySelectorAll('[data-aria-en][data-aria-ko]').forEach(element => {
      element.setAttribute('aria-label',element.getAttribute('data-aria-' + code) || element.dataset.ariaEn);
    });
    if (locales[code]) {
      document.title = locales[code].title + ' — QbRuby';
      document.querySelector('meta[name="description"]').content = locales[code].intro;
    }
    picker.value = code;
    picker.setAttribute('aria-label',locales[code]?.ui.Language || (code === 'ko' ? '언어' : code === 'jp' ? '言語' : 'Language'));
    // The rest of the site offers Korean and English; translated labels identify that fallback.
    document.querySelectorAll('[data-local], [data-policy]').forEach(link => {
      const destination = new URL(link.dataset.policy || link.dataset.local, location.href);
      const policy = destination.pathname.endsWith('/privacy/slium.html');
      destination.searchParams.set('lang', policy ? code : code === 'ko' ? 'ko' : 'en');
      link.href = destination.pathname + destination.search + destination.hash;
    });
    const url = new URL(location.href);
    url.searchParams.set('lang',code);
    const section = url.hash.match(/^#(?:ko|en|jp|zh-CN|zh-TW|es|pt-BR|de|fr)-(\d+)$/);
    if (section) url.hash = '#' + code + '-' + section[1];
    history.replaceState(history.state,'',url);
    if (code === 'ko' || code === 'en') try { localStorage.setItem('qbrubyLang',code); } catch (_) {}
  }
  let initial = normalize(new URLSearchParams(location.search).get('lang'));
  if (!initial) {
    try { initial = normalize(localStorage.getItem('qbrubyLang')); } catch (_) {}
    if (!initial) initial = normalize(navigator.language) || 'en';
  }
  picker.addEventListener('change', () => select(picker.value));
  select(initial);
})();
