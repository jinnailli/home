(() => {
  'use strict';
  const dialog = document.getElementById('gallery-dialog');
  const image = document.getElementById('gallery-image');
  const title = document.getElementById('gallery-title');
  const caption = document.getElementById('gallery-caption');
  const close = document.getElementById('gallery-close');
  const groups = {
    'jeweldoku': {name:'JewelDoku', images:[
      ['JewelDoku1.jpeg','Main menu','메인 메뉴'], ['JewelDoku2.jpeg','Puzzle board','퍼즐 보드'],
      ['JewelDoku3.jpeg','Jewels found','보석 발견'], ['JewelDoku4.jpeg','Puzzle regions','퍼즐 영역'],
      ['JewelDoku5.jpeg','Stage complete','스테이지 완료'], ['JewelDoku6.jpeg','Jewel catalog','보석 도감']]},
    'pulse-block': {name:'Pulse Block', images:[
      ['PulseBlock1.jpeg','Title screen','시작 화면'], ['PulseBlock2.jpeg','Puzzle board','퍼즐 보드'],
      ['PulseBlock3.jpeg','Line clear','라인 클리어'], ['PulseBlock4.jpeg','Combo','콤보'], ['PulseBlock5.jpeg','Results','결과']]},
    'flickcube': {name:'FlickCube', images:[
      ['cube_01-main-menu.jpeg','Main menu','메인 메뉴'], ['cube_02-cube-play.jpeg','Cube play','큐브 플레이'],
      ['cube_03-challenges.jpeg','Challenges','도전 과제'], ['cube_04-cube-shop.jpeg','Cube shop','큐브 상점'],
      ['cube_05-learn-to-solve.jpeg','Learn to solve','해법 배우기']]}
  };
  let language = 'en';
  let active = null;
  let returnFocus = null;
  let ownsEntry = false;
  let baseHash = '';

  document.querySelectorAll('a[href]').forEach(link => {
    const raw = link.getAttribute('href');
    if (!link.dataset.policy && /^(?:[a-z0-9-]+\.html)(?:[?#].*)?$/i.test(raw)) link.dataset.local = raw;
  });

  function renderImage() {
    if (!active) return;
    const group = groups[active.group];
    const item = group.images[active.index];
    const label = item[language === 'ko' ? 2 : 1];
    image.src = `images/originals/${item[0]}`;
    image.alt = `${group.name} — ${label}`;
    title.textContent = `${group.name} · ${language === 'ko' ? '스크린샷' : 'Screenshots'}`;
    caption.textContent = `${String(active.index + 1).padStart(2,'0')} / ${String(group.images.length).padStart(2,'0')} · ${label}`;
  }

  function setLanguage(value) {
    language = value === 'ko' ? 'ko' : 'en';
    document.documentElement.lang = language;
    document.querySelectorAll('[data-en][data-ko]').forEach(element => {
      if (element.tagName === 'META') element.content = element.dataset[language];
      else element.innerHTML = element.dataset[language];
    });
    document.querySelectorAll('[data-aria-en][data-aria-ko]').forEach(element => {
      element.setAttribute('aria-label',element.dataset[language === 'ko' ? 'ariaKo' : 'ariaEn']);
    });
    document.querySelectorAll('[data-alt-en][data-alt-ko]').forEach(element => {
      element.alt = element.dataset[language === 'ko' ? 'altKo' : 'altEn'];
    });
    document.querySelectorAll('.langs button').forEach(button => {
      const selected = button.id === language;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    document.querySelectorAll('[data-policy]').forEach(link => {
      const destination = new URL(link.dataset.policy,location.href);
      destination.searchParams.set('lang',language);
      link.href = destination.pathname + destination.search + destination.hash;
    });
    document.querySelectorAll('[data-local]').forEach(link => {
      const destination = new URL(link.dataset.local,location.href);
      destination.searchParams.set('lang',language);
      link.href = destination.pathname + destination.search + destination.hash;
    });
    try {localStorage.setItem('qbrubyLang',language);} catch (_) { /* URL selection works when storage is restricted. */ }
    const url = new URL(location.href);
    url.searchParams.set('lang',language);
    history.replaceState(history.state,'',url);
    renderImage();
  }

  function initialLanguage() {
    const requested = new URLSearchParams(location.search).get('lang');
    if (requested !== null) return requested === 'ko' ? 'ko' : 'en';
    try {
      const saved = localStorage.getItem('qbrubyLang');
      if (saved === 'ko' || saved === 'en') return saved;
    } catch (_) { /* Use browser language without local storage. */ }
    return (navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : 'en';
  }
  document.getElementById('ko').addEventListener('click',() => setLanguage('ko'));
  document.getElementById('en').addEventListener('click',() => setLanguage('en'));
  setLanguage(initialLanguage());

  document.querySelectorAll('.gallery-shell').forEach(shell => {
    const track = shell.querySelector('.gallery-track');
    const previous = shell.querySelector('[data-scroll="-1"]');
    const next = shell.querySelector('[data-scroll="1"]');
    const update = () => {
      previous.disabled = track.scrollLeft < 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    [previous,next].forEach(button => button.addEventListener('click',() => {
      track.scrollBy({left:Number(button.dataset.scroll)*track.clientWidth*.8,
        behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    }));
    track.addEventListener('scroll',update,{passive:true});
    track.querySelectorAll('img').forEach(img => img.addEventListener('load',update));
    if (typeof ResizeObserver === 'function') new ResizeObserver(update).observe(track);
    update();
  });

  function hideDialog() {
    active = null;
    if (dialog.open) dialog.close();
    document.body.classList.remove('modal-open');
    image.removeAttribute('src');
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({preventScroll:true});
    returnFocus = null;
  }

  function syncWithHash() {
    const match = location.hash.match(/^#gallery-([a-z0-9-]+)-(\d+)$/);
    if (match && match[1] === 'cube-project') match[1] = 'flickcube';
    if (match && groups[match[1]]) {
      const index = Number(match[2])-1;
      if (index >= 0 && index < groups[match[1]].images.length) {
        active = {group:match[1],index};
        renderImage();
        if (!dialog.open) {
          dialog.showModal();
          document.body.classList.add('modal-open');
          close.focus();
        }
        return;
      }
    }
    ownsEntry = false;
    hideDialog();
  }

  document.querySelectorAll('a[data-gallery]').forEach(link => {
    link.addEventListener('click',event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      returnFocus = link;
      baseHash = location.hash;
      ownsEntry = true;
      history.pushState(history.state,'',`#gallery-${link.dataset.gallery}-${Number(link.dataset.index)+1}`);
      syncWithHash();
    });
  });

  function move(delta) {
    if (!active) return;
    active.index = (active.index + delta + groups[active.group].images.length) % groups[active.group].images.length;
    history.replaceState(history.state,'',`#gallery-${active.group}-${active.index+1}`);
    renderImage();
  }

  function requestClose() {
    if (ownsEntry) history.back();
    else {
      history.replaceState(history.state,'',location.pathname+location.search+baseHash);
      hideDialog();
    }
  }
  document.getElementById('gallery-prev').addEventListener('click',() => move(-1));
  document.getElementById('gallery-next').addEventListener('click',() => move(1));
  close.addEventListener('click',requestClose);
  dialog.addEventListener('cancel',event => {event.preventDefault();requestClose();});
  dialog.addEventListener('keydown',event => {
    if (event.key === 'Tab') {
      const buttons = [...dialog.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0];
      const last = buttons[buttons.length-1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();first.focus();
      }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft') {event.preventDefault();move(-1);}
    if (event.key === 'ArrowRight') {event.preventDefault();move(1);}
  });
  dialog.addEventListener('click',event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)) requestClose();
  });
  window.addEventListener('popstate',syncWithHash);
  window.addEventListener('hashchange',syncWithHash);
  if (typeof dialog.showModal === 'function') syncWithHash();
})();
