/* 독자 설문 카드 (글 페이지)
   - 설정(관리자 '설정' 탭, 없으면 common.js 기본값)에 따라: 방문자 중 chance 비율에게,
     글을 minRead 이상 읽었거나 delaySec초가 지나면 오른쪽 아래(모바일은 아래)에 한 문항
   - 답한 사람은 answeredDays일, 닫은 사람은 closedDays일 동안 다시 묻지 않는다
   - 관리자에게는 보이지 않는다. 단 ?survey=1(&q=문항ID)이면 저장되지 않는 미리보기로 띄운다 */
(function () {
  if (!window.BLOG_ONLINE || typeof surveyConfig !== 'function') return;
  const params = new URLSearchParams(location.search);
  const preview = !!window.BLOG_ADMIN;
  if (preview && params.get('survey') !== '1') return;
  const CFG = surveyConfig(SITE.id);
  if (!preview && !CFG.enabled) return;
  const qs = CFG.questions || []; if (!qs.length) return;
  const post = (window.BLOG_POSTS || []).find(p => p.slug === params.get('slug'));
  if (!post || post.status !== 'published') return;
  const KEY = 'blog_survey_until';
  const DAY = 864e5;
  const force = params.get('survey') === '1'; // 확인용: ?survey=1 이면 바로 띄움
  try {
    if (!force && Number(localStorage.getItem(KEY) || 0) > Date.now()) return;
  } catch (e) { return; }
  if (!force && Math.random() > CFG.chance) return;
  const snooze = days => { try { localStorage.setItem(KEY, String(Date.now() + days * DAY)); } catch (e) {} };

  // 문항 고르기 (비중대로)
  const total = qs.reduce((s, q) => s + (q.weight || 1), 0);
  let r = Math.random() * total, Q = qs[0];
  for (const q of qs) { r -= (q.weight || 1); if (r <= 0) { Q = q; break; } }
  if (params.get('q')) Q = qs.find(q => q.id === params.get('q')) || Q;

  const css = `
  .sv-card { position: fixed; right: 20px; bottom: 20px; z-index: 800; width: 360px; background: #fff; border-radius: 18px; overflow: hidden;
    box-shadow: 0 18px 48px rgba(27,32,51,.28), 0 0 0 1px rgba(27,32,51,.06); font-size: 14px; transform: translateY(40px) scale(.96); opacity: 0; }
  .sv-card.in { animation: svIn .55s cubic-bezier(.2,1.3,.4,1) forwards, svPulse 1.6s .7s 2; }
  .sv-card.nudge { animation: svNudge .6s ease-in-out; transform: none; opacity: 1; }
  @keyframes svIn { to { transform: none; opacity: 1; } }
  @keyframes svPulse {
    0%   { box-shadow: 0 18px 48px rgba(27,32,51,.28), 0 0 0 0 color-mix(in srgb, var(--brand) 55%, transparent); }
    70%  { box-shadow: 0 18px 48px rgba(27,32,51,.28), 0 0 0 16px color-mix(in srgb, var(--brand) 0%, transparent); }
    100% { box-shadow: 0 18px 48px rgba(27,32,51,.28), 0 0 0 0 transparent; }
  }
  @keyframes svNudge { 0%, 100% { transform: none; } 20% { transform: rotate(-2deg); } 40% { transform: rotate(2deg); } 60% { transform: rotate(-1.5deg); } 80% { transform: rotate(1deg); } }
  @media (prefers-reduced-motion: reduce) { .sv-card.in, .sv-card.nudge { animation: none; transform: none; opacity: 1; } }
  .sv-card .sv-top { display: flex; align-items: center; gap: 10px; padding: 14px 14px 14px 18px; color: #fff;
    background: linear-gradient(135deg, var(--brand) 0%, color-mix(in srgb, var(--brand) 55%, #8B5CF6) 100%); }
  .sv-card .sv-ico { width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,.2); display: grid; place-items: center; font-size: 18px; flex: none; }
  .sv-card .sv-hi b { display: block; font-size: 15px; letter-spacing: -.02em; }
  .sv-card .sv-hi span { font-size: 12px; opacity: .85; }
  .sv-card .sv-x { margin-left: auto; width: 30px; height: 30px; border: 0; background: rgba(255,255,255,.15); color: #fff; font-size: 18px; line-height: 1; cursor: pointer; border-radius: 9px; flex: none; }
  .sv-card .sv-x:hover { background: rgba(255,255,255,.3); }
  .sv-card .sv-body { padding: 16px 18px 18px; background: linear-gradient(180deg, var(--brand-soft) 0%, #fff 70%); }
  .sv-card .sv-tag { display: inline-block; font-size: 11px; font-weight: 700; color: var(--brand); background: #fff; border: 1px solid color-mix(in srgb, var(--brand) 25%, transparent); border-radius: 999px; padding: 2px 8px; margin-bottom: 8px; }
  .sv-card h4 { margin: 0 0 12px; font-size: 17px; letter-spacing: -.02em; line-height: 1.4; color: var(--ink); }
  .sv-opts { display: flex; flex-direction: column; gap: 7px; }
  .sv-opts.scale { flex-direction: row; gap: 6px; }
  .sv-opt { min-height: 42px; padding: 8px 14px; border: 1.5px solid color-mix(in srgb, var(--brand) 22%, var(--line)); border-radius: 12px; background: #fff; font: inherit; font-size: 14px; font-weight: 600; color: var(--ink); cursor: pointer; text-align: left; transition: background .15s, color .15s, border-color .15s, transform .15s; }
  .sv-opt:hover, .sv-opt:focus-visible { border-color: var(--brand); background: var(--brand); color: #fff; transform: translateY(-1px); }
  .sv-opt:hover small, .sv-opt:focus-visible small { color: rgba(255,255,255,.85) !important; }
  .sv-opts.scale .sv-opt { flex: 1; text-align: center; padding: 8px 0; display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 16px; font-weight: 800; }
  .sv-opts.scale .sv-opt small { font-size: 10px; color: var(--muted); font-weight: 500; white-space: nowrap; }
  .sv-card textarea { width: 100%; min-height: 76px; border: 1.5px solid var(--line); border-radius: 12px; padding: 10px 12px; font: inherit; font-size: 14px; resize: vertical; box-sizing: border-box; background: #fff; }
  .sv-card textarea:focus { outline: none; border-color: var(--brand); }
  .sv-card .sv-row { display: flex; gap: 6px; justify-content: flex-end; margin-top: 10px; }
  .sv-pf { margin-bottom: 12px; }
  .sv-pf .lb { font-size: 13px; font-weight: 700; color: var(--ink-2); margin-bottom: 6px; }
  .sv-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .sv-chips button { height: 34px; padding: 0 12px; border: 1.5px solid color-mix(in srgb, var(--brand) 22%, var(--line)); border-radius: 999px; background: #fff; font: inherit; font-size: 13px; font-weight: 600; color: var(--ink); cursor: pointer; }
  .sv-chips button:hover { border-color: var(--brand); }
  .sv-chips button.on { background: var(--brand); border-color: var(--brand); color: #fff; }
  .sv-card .sv-row .btn:disabled { opacity: .45; cursor: default; }
  .sv-card .sv-thanks { padding: 22px 18px; text-align: center; color: var(--ink); line-height: 1.6; font-weight: 600; background: var(--brand-soft); }
  .sv-card .sv-thanks .big { font-size: 30px; display: block; margin-bottom: 4px; }
  @media (max-width: 640px) { .sv-card { left: 12px; right: 12px; bottom: 12px; width: auto; } }
  `;
  let shown = false;
  function show() {
    if (shown) return; shown = true;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const card = document.createElement('div');
    card.className = 'sv-card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', '짧은 설문');
    const scale = Q.type === 'scale';
    card.innerHTML = `<div class="sv-top"><span class="sv-ico">🙌</span>
        <div class="sv-hi"><b>잠깐, 10초만 도와주세요</b><span>1문항 · 누르기만 하면 끝나요</span></div>
        <button class="sv-x" aria-label="닫기">×</button></div>
      <div class="sv-body"><span class="sv-tag">${preview ? '미리보기 · 저장 안 됨' : esc(Q.topic)}</span>
        <h4>${esc(Q.q)}</h4>
        <div class="sv-opts ${scale ? 'scale' : ''}">${Q.options.map((o, i) => `<button class="sv-opt" data-v="${esc(o)}">${esc(o)}${scale && Q.labels ? `<small>${esc(Q.labels[i])}</small>` : ''}</button>`).join('')}</div></div>`;
    document.body.appendChild(card);
    requestAnimationFrame(() => card.classList.add('in'));
    // 10초 동안 아무 반응이 없으면 한 번만 살짝 흔들어 눈길을 끈다
    let touched = false;
    card.addEventListener('pointerenter', () => { touched = true; }, { once: true });
    setTimeout(() => {
      if (touched || !card.isConnected || !card.querySelector('.sv-opts')) return;
      card.classList.remove('in'); card.style.opacity = '1'; void card.offsetWidth; card.classList.add('nudge');
    }, 10000);
    const close = () => { card.style.transition = 'transform .3s, opacity .3s'; card.style.opacity = '0'; card.style.transform = 'translateY(30px)'; setTimeout(() => card.remove(), 300); };
    card.querySelector('.sv-x').addEventListener('click', () => { if (!preview) snooze(CFG.closedDays); close(); });
    let saved = null;
    const send = body => preview ? Promise.resolve({}) : fetch('/api/survey', { method: 'POST', body: JSON.stringify(body) }).then(r => r.json()).catch(() => ({}));
    card.querySelector('.sv-opts').addEventListener('click', async e => {
      const b = e.target.closest('.sv-opt'); if (!b) return;
      const answer = b.dataset.v;
      if (!preview) snooze(CFG.answeredDays);
      card.querySelector('.sv-opts').remove();
      card.querySelector('.sv-hi b').textContent = '고마워요! 🎉';
      card.querySelector('.sv-hi span').textContent = '한마디만 더 남겨 주시면 큰 힘이 돼요 (선택)';
      card.querySelector('h4').textContent = '더 하고 싶은 말이 있나요?';
      card.querySelector('.sv-body').insertAdjacentHTML('beforeend', `<textarea maxlength="500" placeholder="예: 이런 주제도 다뤄 주세요"></textarea>
        <div class="sv-row"><button class="btn btn-sm" data-c="skip">괜찮아요</button><button class="btn btn-sm btn-primary" data-c="send">보내기</button></div>`);
      // 저장은 기다리지 않고 바로 다음 단계를 보여 준다. 덧붙일 때만 저장 결과(rid)를 기다린다
      const savedP = send({ site: SITE.id, postId: post.id, qid: Q.id, answer }).then(r => (saved = r));
      const base = { site: SITE.id, postId: post.id, qid: Q.id, answer };
      const thanks = () => {
        card.innerHTML = '<div class="sv-thanks"><span class="big">💙</span>소중한 의견 고마워요.<br>더 좋은 글로 찾아올게요!</div>';
        setTimeout(close, 1800);
      };
      card.querySelector('.sv-row').addEventListener('click', async ev => {
        const c = ev.target.closest('[data-c]'); if (!c) return;
        ev.stopPropagation(); // 이 클릭이 다음 단계(성별·나이대) 화면의 단추로 이어지지 않게
        const comment = card.querySelector('textarea').value.trim();
        if (c.dataset.c === 'send' && comment) await savedP;
        if (c.dataset.c === 'send' && comment && saved && saved.rid) await send(Object.assign({ comment, rid: saved.rid, token: saved.token }, base));
        if (CFG.askProfile !== false) askProfile(); else thanks();
      });
      // 마지막 단계: 성별·나이대 (선택, 건너뛸 수 있음)
      function askProfile() {
        const pick = { gender: '', age: '' };
        card.querySelector('.sv-hi b').textContent = '마지막으로 하나만! 🙏';
        card.querySelector('.sv-hi span').textContent = '어떤 분들이 읽는지 알면 더 맞춤한 글을 쓸 수 있어요 (선택)';
        card.querySelector('.sv-body').innerHTML = `
          <div class="sv-pf"><div class="lb">성별</div><div class="sv-chips" data-k="gender">${SURVEY_PROFILE.genders.map(g => `<button type="button" data-v="${g.id}">${g.label}</button>`).join('')}</div></div>
          <div class="sv-pf"><div class="lb">나이대</div><div class="sv-chips" data-k="age">${SURVEY_PROFILE.ages.map(g => `<button type="button" data-v="${g.id}">${g.label}</button>`).join('')}</div></div>
          <div class="sv-row"><button class="btn btn-sm" data-c="skip">건너뛰기</button><button class="btn btn-sm btn-primary" data-c="done" disabled>완료</button></div>`;
        const done = card.querySelector('[data-c="done"]');
        card.querySelector('.sv-body').addEventListener('click', async ev2 => {
          const chip = ev2.target.closest('.sv-chips button');
          if (chip) {
            const k = chip.parentElement.dataset.k;
            pick[k] = chip.dataset.v;
            chip.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === chip));
            done.disabled = !(pick.gender || pick.age);
            return;
          }
          const c2 = ev2.target.closest('[data-c]'); if (!c2) return;
          if (c2.dataset.c === 'done') await savedP;
          if (c2.dataset.c === 'done' && saved && saved.rid) {
            const body = Object.assign({ rid: saved.rid, token: saved.token }, base);
            if (pick.gender) body.gender = pick.gender;
            if (pick.age) body.age = pick.age;
            await send(body);
          }
          thanks();
        });
      }
    });
  }

  // 언제 띄울지: 글을 minRead 이상 읽었거나 delaySec초 뒤 (확인용 ?survey=1 은 2초 뒤)
  const art = document.querySelector('.article');
  const onScroll = () => {
    if (!art) return;
    const r = art.getBoundingClientRect();
    if ((innerHeight - r.top) / r.height >= CFG.minRead) { removeEventListener('scroll', onScroll); show(); }
  };
  addEventListener('scroll', onScroll, { passive: true });
  setTimeout(show, force ? 2000 : CFG.delaySec * 1000);
})();
