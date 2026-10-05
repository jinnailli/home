(() => {
  'use strict';
  const dialog = document.getElementById('gallery-dialog');
  const image = document.getElementById('gallery-image');
  const caption = document.getElementById('gallery-caption');
  const title = document.getElementById('gallery-title');
  const closeButton = document.getElementById('gallery-close');
  const groups = new Map();
  let language = 'en';
  let active = null;
  let returnFocus = null;
  let ownsEntry = false;
  let baseHash = '';

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!link.dataset.local && !link.dataset.policy && /^[a-z0-9-]+\.html(?:[?#].*)?$/i.test(href)) {
      link.dataset.local = href;
    }
  });

  document.querySelectorAll('.game-card').forEach(card => {
    const items = [...card.querySelectorAll('.gallery-track .shot-link')];
    if (!items.length) return;
    groups.set(card.id, {
      title: card.querySelector('h1, h2, h3'),
      items
    });
  });

  function localizedLabel(label) {
    const parts = label.split(' / ');
    return language === 'ko' ? (parts[1] || parts[0]) : parts[0];
  }

  function renderImage() {
    if (!active) return;
    const group = groups.get(active.group);
    const item = group.items[active.index];
    const name = group.title.dataset[language];
    const label = localizedLabel(item.dataset.caption);
    image.src = item.dataset.full;
    image.alt = `${name} — ${label}`;
    title.textContent = `${name} · ${language === 'ko' ? '스크린샷' : 'Screenshots'}`;
    caption.textContent = `${String(active.index + 1).padStart(2, '0')} / ${String(group.items.length).padStart(2, '0')} · ${label}`;
  }

  function setLanguage(value) {
    language = value === 'ko' ? 'ko' : 'en';
    document.documentElement.lang = language;
    document.querySelectorAll('[data-en][data-ko]').forEach(element => {
      if (element.tagName !== 'META') element.innerHTML = element.dataset[language];
    });
    document.querySelectorAll('[data-aria-en][data-aria-ko]').forEach(element => {
      element.setAttribute('aria-label', element.dataset[language === 'ko' ? 'ariaKo' : 'ariaEn']);
    });
    document.querySelectorAll('.langs button').forEach(button => {
      const selected = button.id === language;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-policy]').forEach(link => {
      link.href = `${link.dataset.policy}?lang=${language}`;
    });
    document.querySelectorAll('[data-local]').forEach(link => {
      const destination = new URL(link.dataset.local, location.href);
      destination.searchParams.set('lang', language);
      link.href = destination.pathname + destination.search + destination.hash;
    });
    const description = document.querySelector('meta[name="description"]');
    description.content = description.dataset[language] || (language === 'ko'
      ? '큐비루비의 JewelDoku, Pulse Block, FlickCube를 만나보세요. 퍼즐 게임, 스크린샷, 공식 스토어 링크를 소개합니다.'
      : 'Discover JewelDoku, Pulse Block, and FlickCube by QbRuby. Explore puzzle games, screenshots, and official store links.');
    try { localStorage.setItem('qbrubyLang', language); } catch (_) { /* 저장이 제한되어도 언어 전환은 작동합니다. */ }
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.set('lang', language);
      history.replaceState(history.state, '', url);
    }
    renderImage();
  }

  function initialLanguage() {
    const requested = new URLSearchParams(location.search).get('lang');
    if (requested === 'ko' || requested === 'en') return requested;
    try {
      const saved = localStorage.getItem('qbrubyLang');
      if (saved === 'ko' || saved === 'en') return saved;
    } catch (_) { /* 브라우저 설정을 기본값으로 사용합니다. */ }
    return (navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : 'en';
  }

  document.getElementById('en').addEventListener('click', () => setLanguage('en'));
  document.getElementById('ko').addEventListener('click', () => setLanguage('ko'));
  setLanguage(initialLanguage());

  document.querySelectorAll('.gallery-shell').forEach(shell => {
    const track = shell.querySelector('.gallery-track');
    const previous = shell.querySelector('[data-scroll="-1"]');
    const next = shell.querySelector('[data-scroll="1"]');
    const update = () => {
      previous.disabled = track.scrollLeft < 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    [previous, next].forEach(button => button.addEventListener('click', () => {
      track.scrollBy({left: Number(button.dataset.scroll) * track.clientWidth * 0.8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    }));
    track.addEventListener('scroll', update, {passive: true});
    track.querySelectorAll('img').forEach(img => img.addEventListener('load', update));
    if (typeof ResizeObserver === 'function') new ResizeObserver(update).observe(track);
    update();
  });

  function hideDialog() {
    active = null;
    if (dialog.open) dialog.close();
    document.body.classList.remove('modal-open');
    image.removeAttribute('src');
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({preventScroll: true});
    returnFocus = null;
  }

  function syncWithHash() {
    const match = location.hash.match(/^#gallery-([a-z0-9-]+)-(\d+)$/);
    if (match && match[1] === 'cube-project') match[1] = 'flickcube';
    if (match && !groups.has(match[1])) {
      const choice = document.getElementById(match[1]);
      if (choice && choice.classList.contains('game-choice')) {
        const destination = new URL(choice.href);
        destination.hash = location.hash;
        location.replace(destination);
        return;
      }
    }
    if (match && groups.has(match[1])) {
      const items = groups.get(match[1]).items;
      const index = Number(match[2]) - 1;
      if (index >= 0 && index < items.length) {
        active = {group: match[1], index};
        renderImage();
        if (!dialog.open) {
          dialog.showModal();
          document.body.classList.add('modal-open');
          closeButton.focus();
        }
        return;
      }
    }
    ownsEntry = false;
    hideDialog();
  }

  document.querySelectorAll('a[data-gallery]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      returnFocus = link;
      baseHash = location.hash;
      ownsEntry = true;
      history.pushState(history.state, '', `#gallery-${link.dataset.gallery}-${Number(link.dataset.index) + 1}`);
      syncWithHash();
    });
  });

  function move(delta) {
    if (!active) return;
    const length = groups.get(active.group).items.length;
    active.index = (active.index + delta + length) % length;
    history.replaceState(history.state, '', `#gallery-${active.group}-${active.index + 1}`);
    renderImage();
  }

  function requestClose() {
    if (ownsEntry) {
      history.back();
    } else {
      history.replaceState(history.state, '', location.pathname + location.search + baseHash);
      hideDialog();
    }
  }

  document.getElementById('gallery-prev').addEventListener('click', () => move(-1));
  document.getElementById('gallery-next').addEventListener('click', () => move(1));
  closeButton.addEventListener('click', requestClose);
  dialog.addEventListener('cancel', event => { event.preventDefault(); requestClose(); });
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) requestClose();
  });
  window.addEventListener('popstate', syncWithHash);
  window.addEventListener('hashchange', syncWithHash);
  if (typeof dialog.showModal === 'function') syncWithHash();
})();
