/* 서비스 소개 페이지: 처음 들어온 방문 표시 + 히어로 효과 뒤 영상 섹션으로 자동 이동 (PC만)
   - 히어로 반전 효과(.sv-hero-inv)는 0.35초 뒤 시작해 3.2초 동안 진행된다 → 끝나고 3초 뒤 #film으로
   - 모바일·터치 화면, 움직임 줄이기 설정, 그 사이 직접 스크롤한 경우에는 이동하지 않는다 */
(function () {
  try { sessionStorage.setItem('blog_entered', '1'); } catch (e) {}
  const film = document.getElementById('film');
  if (!film) return;
  const header = document.getElementById('site-header');
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const topOf = el => el.getBoundingClientRect().top + scrollY - (header ? header.offsetHeight : 0);
  const goTo = el => scrollTo({ top: Math.max(0, topOf(el)), behavior: reduceMotion() ? 'auto' : 'smooth' });
  const goFilm = () => goTo(film);
  // 히어로 아래 화살꺽쇠: 누르면 영상으로
  document.querySelectorAll('a.sv-down').forEach(el => el.addEventListener('click', e => { e.preventDefault(); goFilm(); }));

  /* 아래로 한 번 스크롤(휠·터치·키) → 다음 섹션으로 바로 이동. 위로 올리는 건 그대로 둔다.
     - 히어로 → 영상 섹션
     - 영상 섹션 → 그다음 섹션 (영상 섹션이 화면보다 길면 끝까지 본 뒤에 이동)
     - 그 아래부터는 평소 스크롤 */
  const afterFilm = film.nextElementSibling;
  const nextTarget = () => {
    if (scrollY < topOf(film) - 4) return film;
    if (afterFilm && scrollY < topOf(afterFilm) - 4 && film.getBoundingClientRect().bottom <= innerHeight + 4) return afterFilm;
    return null;
  };
  let snapping = false, lockUntil = 0;
  const snap = el => {
    if (snapping) return;
    snapping = true;
    goTo(el);
    const done = () => { if (!snapping) return; snapping = false; lockUntil = Date.now() + 450; removeEventListener('scrollend', done); };
    addEventListener('scrollend', done);
    setTimeout(done, 1200);
  };
  // 이동 중·도착 직후에는 아래 방향 입력을 삼켜서(트랙패드 관성 포함) 목적지를 지나치지 않게
  const busy = () => snapping || Date.now() < lockUntil;
  addEventListener('wheel', e => {
    if (e.ctrlKey || e.deltaY <= 0) return;
    if (busy()) { e.preventDefault(); if (!snapping) lockUntil = Date.now() + 200; return; }
    const t = nextTarget();
    if (t) { e.preventDefault(); snap(t); }
  }, { passive: false });
  let touchY = null;
  addEventListener('touchstart', e => { touchY = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
  addEventListener('touchmove', e => {
    if (touchY === null) return;
    const dy = touchY - e.touches[0].clientY;   // 양수 = 손가락을 위로 = 아래로 스크롤
    if (busy() && dy > 0) { e.preventDefault(); return; }
    if (dy <= 12) return;
    const t = nextTarget();
    if (t) { e.preventDefault(); touchY = null; snap(t); }
  }, { passive: false });
  addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const el = e.target;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|VIDEO)$/.test(el.tagName))) return;
    const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
    if (!down) return;
    if (busy()) { e.preventDefault(); return; }
    const t = nextTarget();
    if (t) { e.preventDefault(); snap(t); }
  });

  const desktop = matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)').matches;
  if (!desktop || reduceMotion() || location.hash) return;
  let cancelled = false;
  const cancel = () => { cancelled = true; };
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => addEventListener(ev, cancel, { once: true, passive: true }));
  addEventListener('scroll', () => { if (scrollY > 40) cancel(); }, { passive: true });
  const HERO_END = 350 + 3200, WAIT = 3000;
  setTimeout(() => {
    if (cancelled || scrollY > 40) return;
    goFilm();
  }, HERO_END + WAIT);
})();
