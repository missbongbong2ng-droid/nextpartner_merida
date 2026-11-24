/* 블로그 화면에서 바로 수정하기 (관리자로 로그인했을 때만 동작)
   - 오른쪽 아래 관리자 도구: 관리자 모드 표시, 글 관리 열기, (글 페이지) 이 글 수정
   - 목록 화면: 글 카드마다 '수정' 단추
   - 글 페이지: 제목·요약·본문(에디터)·썸네일·상태를 그 자리에서 고치고 저장
   방문자에게는 아무것도 보이지 않는다. */
(function () {
  if (!window.BLOG_ONLINE || !window.BLOG_ADMIN) return;

  const SE = 'https://cdn.jsdelivr.net/npm/suneditor@2.47.12/';
  const params = new URLSearchParams(location.search);
  const isPost = /\/post(\.html)?$/.test(location.pathname);
  const slug = params.get('slug');
  const posts = window.BLOG_POSTS || [];
  const post = isPost ? posts.find(p => p.slug === slug && (p.site || 'selb') === SITE.id) : null;

  /* ---------- 스타일 ---------- */
  const css = `
  .ie-dock { position: fixed; right: 18px; bottom: 18px; z-index: 900; display: flex; align-items: center; gap: 6px; padding: 6px 6px 6px 14px;
    background: #1B2033; color: #fff; border-radius: 14px; box-shadow: 0 12px 32px rgba(27,32,51,.28); font-size: 13px; }
  .ie-dock .ie-dot { width: 8px; height: 8px; border-radius: 50%; background: #3FD6A5; margin-right: 2px; }
  .ie-dock b { font-weight: 700; margin-right: 6px; white-space: nowrap; }
  .ie-dock a, .ie-dock button { height: 32px; padding: 0 12px; border-radius: 9px; border: 1px solid rgba(255,255,255,.25); background: transparent; color: #fff;
    font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; white-space: nowrap; text-decoration: none; }
  .ie-dock .ie-primary { background: #fff; color: #1B2033; border-color: #fff; }
  .ie-host { position: relative; }
  .ie-chip { position: absolute; top: 10px; right: 10px; z-index: 5; height: 28px; padding: 0 10px; border-radius: 8px; border: 0; background: #1B2033; color: #fff;
    font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; opacity: .9; }
  .ie-chip:hover { opacity: 1; }
  .ie-bar { position: sticky; top: 0; z-index: 950; background: #1B2033; color: #fff; }
  /* 수정 중에는 블로그 헤더가 화면 위에 붙어 따라오지 않게(편집 도구를 가림) */
  .ie-edit #site-header { position: static; }
  .ie-bar .wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 10px; padding-bottom: 10px; }
  .ie-bar .ie-state { margin-right: auto; font-size: 13px; opacity: .8; }
  .ie-bar select, .ie-bar button { height: 34px; border-radius: 9px; font: inherit; font-size: 13px; font-weight: 600; }
  .ie-bar select { padding: 0 8px; border: 1px solid rgba(255,255,255,.3); background: #2A3150; color: #fff; }
  .ie-bar button { padding: 0 14px; border: 1px solid rgba(255,255,255,.3); background: transparent; color: #fff; cursor: pointer; }
  .ie-bar .ie-save { background: #3FD6A5; border-color: #3FD6A5; color: #1B2033; }
  .ie-edit [contenteditable] { outline: 2px dashed #A9B6F5; outline-offset: 6px; border-radius: 4px; cursor: text; }
  .ie-edit [contenteditable]:focus { outline: 2px solid var(--brand); background: #fff; }
  .ie-edit .ie-ph:empty::before { content: attr(data-ph); color: #A0A6BD; }
  .ie-hero-tools { display: flex; gap: 8px; justify-content: center; margin: 10px 0 0; }
  .ie-hero-tools button { height: 32px; padding: 0 12px; border: 1px solid var(--line); border-radius: 8px; background: #fff; font: inherit; font-size: 13px; cursor: pointer; }
  .ie-editor { margin-top: 8px; }
  /* overflow: hidden이면 도구 막대가 화면이 아니라 이 상자 기준으로 붙어 위에 빈칸이 생김 → clip */
  .ie-editor .sun-editor { border-radius: 12px; overflow: clip; font-family: inherit; }
  .ie-editor .sun-editor .se-toolbar { position: sticky; top: var(--ie-bar-h, 54px); z-index: 6; outline: 0; }
  .ie-editor .sun-editor-editable { font-family: 'Pretendard', sans-serif; font-size: 17px; line-height: 1.85; color: #262B3F; padding: 24px 28px; }
  .ie-editor .sun-editor-editable h2 { font-size: 25px; margin: 40px 0 14px; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
  .ie-editor .sun-editor-editable blockquote { margin: 20px 0; padding: 16px 20px; background: var(--brand-soft); border: 0 !important; border-radius: 12px; }
  .ie-toast { position: fixed; left: 50%; bottom: 80px; transform: translateX(-50%); z-index: 990; background: #1B2033; color: #fff; padding: 10px 18px; border-radius: 10px; font-size: 14px; display: none; }
  .ie-bar .ie-short { display: none; }
  /* 휴대폰: 위 막대는 한 줄, 편집 도구도 한 줄로 옆으로 넘겨 쓰기 → 글을 덜 가리게 */
  @media (max-width: 640px) {
    .ie-dock { left: 12px; right: 12px; bottom: 12px; justify-content: flex-end; } .ie-dock b { margin-right: auto; }
    .ie-bar .wrap { flex-wrap: nowrap; gap: 6px; padding-top: 8px; padding-bottom: 8px; }
    .ie-bar .ie-state { min-width: 0; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ie-bar select, .ie-bar button { height: 32px; flex: none; }
    .ie-bar button { padding: 0 10px; }
    .ie-bar .ie-long { display: none; } .ie-bar .ie-short { display: inline; }
    .ie-editor .sun-editor { border-radius: 10px; }
    .ie-editor .sun-editor .se-toolbar { padding: 4px; }
    .ie-editor .sun-editor .se-toolbar .se-btn-tray { display: flex; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
    .ie-editor .sun-editor .se-toolbar .se-btn-tray::-webkit-scrollbar { display: none; }
    .ie-editor .sun-editor .se-toolbar .se-btn-module { flex: none; float: none; }
    .ie-editor .sun-editor-editable { padding: 18px 16px; }
    .ie-editor .sun-editor-editable h2 { font-size: 21px; margin-top: 32px; }
  }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const $ = s => document.querySelector(s);
  const toast = msg => {
    let t = $('.ie-toast'); if (!t) { t = document.createElement('div'); t.className = 'ie-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.style.display = 'block'; clearTimeout(toast._t); toast._t = setTimeout(() => t.style.display = 'none', 2200);
  };
  async function api(method, path, body, contentType) {
    const opt = { method, headers: {}, credentials: 'same-origin' };
    if (body !== undefined) { opt.headers['content-type'] = contentType || 'application/json'; opt.body = contentType ? body : JSON.stringify(body); }
    const r = await fetch('/api/' + path, opt);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || ('오류 ' + r.status));
    return data;
  }
  const adminUrl = id => '/admin' + (id ? '?edit=' + encodeURIComponent(id) : '');

  /* ---------- 오른쪽 아래 관리자 도구 ---------- */
  const dock = document.createElement('div');
  dock.className = 'ie-dock';
  dock.innerHTML = `<span class="ie-dot"></span><b>관리자 모드</b>
    ${post ? `<button class="ie-primary" id="ieEdit">이 글 수정</button><a href="${adminUrl(post.id)}">관리자에서 열기</a>` : `<a href="${adminUrl()}">글 관리</a>`}`;
  document.body.appendChild(dock);

  /* ---------- 목록 화면: 카드마다 수정 단추 ---------- */
  if (!isPost) {
    const addChips = () => {
      document.querySelectorAll('#main a[href*="post.html?slug="]').forEach(a => {
        if (a.querySelector('.ie-chip')) return;
        a.classList.add('ie-host');
        const b = document.createElement('button');
        b.className = 'ie-chip'; b.type = 'button'; b.textContent = '수정';
        b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); location.href = a.getAttribute('href') + '&edit=1'; });
        a.appendChild(b);
      });
    };
    addChips();
    new MutationObserver(addChips).observe(document.getElementById('main'), { childList: true, subtree: true });
    return;
  }
  if (!post) return;

  /* ---------- 글 페이지: 그 자리에서 수정 ---------- */
  let editor = null, dirty = false, saving = false, leaving = false;
  const loadCss = href => new Promise(r => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = r; l.onerror = r; document.head.appendChild(l); });
  const loadJs = src => new Promise((r, j) => { const s = document.createElement('script'); s.src = src; s.onload = r; s.onerror = j; document.head.appendChild(s); });
  async function loadEditor() {
    if (window.SUNEDITOR) return;
    await loadCss(SE + 'dist/css/suneditor.min.css');
    await loadJs(SE + 'dist/suneditor.min.js');
    await loadJs(SE + 'src/lang/ko.js');
  }
  function compress(file, maxW, q) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => { const im = new Image(); im.onload = () => {
        const sc = Math.min(1, maxW / im.width), c = document.createElement('canvas');
        c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        c.toBlob(resolve, 'image/jpeg', q);
      }; im.onerror = reject; im.src = fr.result; };
      fr.onerror = reject; fr.readAsDataURL(file);
    });
  }
  async function upload(file, kind) {
    if (kind === 'image') {
      if (file.type === 'image/gif') return (await api('POST', 'upload', file, 'image/gif')).url;
      return (await api('POST', 'upload', await compress(file, 1400, .82), 'image/jpeg')).url;
    }
    if (file.size > 95 * 1024 * 1024) throw new Error('영상은 95MB 이하만 올릴 수 있어요. 더 큰 영상은 유튜브 주소로 넣어 주세요.');
    toast('영상을 올리는 중…');
    return (await api('POST', 'upload', file, file.type || 'video/mp4')).url;
  }
  const hook = kind => (files, info, core, handler) => {
    Promise.all([...files].map(async f => ({ url: await upload(f, kind), name: f.name, size: f.size })))
      .then(result => handler({ result })).catch(e => handler(e.message || '올리지 못했어요'));
    return undefined;
  };
  const setDirty = v => { dirty = v; const s = $('.ie-state'); if (s) s.textContent = v ? '저장 안 됨' : '수정 중 · 저장하면 바로 반영돼요'; };

  async function startEdit() {
    if (document.body.classList.contains('ie-edit')) return;
    document.body.classList.add('ie-edit');
    dock.style.display = 'none';
    const art = $('.article');
    // 위쪽 편집 막대
    const bar = document.createElement('div');
    bar.className = 'ie-bar';
    bar.innerHTML = `<div class="wrap"><span class="ie-state">수정 중 · 저장하면 바로 반영돼요</span>
      <select id="ieStatus" aria-label="상태">${STATUSES.filter(s => s.id !== 'trash' || post.status === 'trash').map(s => `<option value="${s.id}" ${post.status === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}</select>
      <button id="ieAdmin" type="button"><span class="ie-long">관리자에서 자세히</span><span class="ie-short">관리자</span></button>
      <button id="ieCancel" type="button">취소</button>
      <button id="ieSave" class="ie-save" type="button">저장</button></div>`;
    document.body.insertBefore(bar, document.body.firstChild);
    // 편집 도구 막대가 위 막대 바로 아래에 붙도록 높이를 알려 준다
    const setBarH = () => document.documentElement.style.setProperty('--ie-bar-h', bar.offsetHeight + 'px');
    setBarH();
    if (window.ResizeObserver) new ResizeObserver(setBarH).observe(bar);

    // 제목·요약
    const h1 = art.querySelector('.article-head h1');
    h1.contentEditable = 'plaintext-only'; h1.classList.add('ie-ph'); h1.dataset.ph = '제목';
    let sum = art.querySelector('.article-summary');
    if (!sum) { sum = document.createElement('p'); sum.className = 'article-summary'; h1.after(sum); }
    sum.contentEditable = 'plaintext-only'; sum.classList.add('ie-ph'); sum.dataset.ph = '요약 (목록과 글 상단에 보이는 한두 문장)';
    [h1, sum].forEach(el => el.addEventListener('input', () => setDirty(true)));

    // 썸네일
    const hero = art.querySelector('.article-hero');
    const tools = document.createElement('div');
    tools.className = 'ie-hero-tools';
    let thumbnail = post.thumbnail || '';
    const renderThumbTools = () => {
      tools.innerHTML = `<button type="button" data-t="edit">${thumbnail ? '썸네일 편집 (자르기 · 대칭 · 회전 · 보정)' : '썸네일 넣기'}</button>${thumbnail ? '<button type="button" data-t="del">썸네일 빼기</button>' : ''}`;
    };
    renderThumbTools();
    hero.after(tools);
    tools.addEventListener('click', async e => {
      const t = e.target.closest('[data-t]'); if (!t) return;
      if (t.dataset.t === 'del') { thumbnail = ''; hero.innerHTML = thumbHTML(Object.assign({}, post, { thumbnail: '' })); renderThumbTools(); setDirty(true); return; }
      try {
        if (!window.ThumbEditor) await loadJs('/assets/thumb-editor.js');
        const blob = await ThumbEditor.open({ src: thumbnail });
        if (!blob) return;
        toast('사진을 올리는 중…');
        thumbnail = (await api('POST', 'upload', blob, 'image/jpeg')).url;
        hero.innerHTML = thumbHTML(Object.assign({}, post, { thumbnail }));
        renderThumbTools(); setDirty(true);
      } catch (err) { alert('썸네일을 바꾸지 못했어요.\n' + err.message); }
    });

    // 본문 에디터
    const prose = art.querySelector('.prose');
    prose.style.display = 'none';
    const box = document.createElement('div');
    box.className = 'ie-editor';
    box.innerHTML = '<textarea id="ieBody" hidden></textarea>';
    prose.after(box);
    try { await loadEditor(); }
    catch (e) { alert('에디터를 불러오지 못했어요. 관리자 페이지에서 수정해 주세요.'); location.href = adminUrl(post.id); return; }
    const html = post.format === 'html' ? (post.body || '') : ((post.body || '').trim() ? markdownToHTML(post) : '');
    editor = SUNEDITOR.create('ieBody', {
      lang: SUNEDITOR_LANG.ko, width: '100%', height: 'auto', minHeight: '420px', stickyToolbar: -1,
      defaultStyle: "font-family: 'Pretendard', sans-serif; font-size: 17px; line-height: 1.85; color: #262B3F;",
      buttonList: [['undo', 'redo'], ['formatBlock', 'fontSize'], ['bold', 'underline', 'italic', 'strike'], ['fontColor', 'hiliteColor', 'removeFormat'],
        ['align', 'list', 'lineHeight'], ['blockquote', 'horizontalRule', 'table', 'link'], ['image', 'video'], ['fullScreen', 'codeView']],
      formats: ['p', 'h2', 'h3', 'blockquote'], fontSize: [13, 14, 15, 16, 17, 18, 20, 24, 28, 32], fontSizeUnit: 'px',
      imageWidth: '100%', imageFileInput: true, imageUrlInput: true, videoWidth: '100%', videoRatio: 0.5625, videoFileInput: true, videoUrlInput: true,
      videoAccept: '.mp4,.webm,.mov', youtubeQuery: 'rel=0', linkTargetNewWindow: true,
      attributesWhitelist: { all: 'style|data-.+', iframe: 'allow|allowfullscreen|frameborder', video: 'controls|playsinline|preload|poster' },
    });
    editor.setContents(html);
    editor.onImageUploadBefore = hook('image');
    editor.onVideoUploadBefore = hook('video');
    editor.onImageUploadError = editor.onVideoUploadError = m => { alert(m); return false; };
    // 에디터가 처음 내용을 정리하며 생기는 변화는 수정으로 치지 않는다: 정리된 뒤의 내용과 비교
    let base = null;
    setTimeout(() => { base = editor.getContents(true); }, 400);
    editor.onChange = () => { if (base !== null && editor.getContents(true) !== base) setDirty(true); };
    // 본문 사진을 누르면 나오는 도구 막대에 '사진 편집' (자르기·대칭·회전·보정)
    try {
      if (!window.ThumbEditor) await loadJs('/assets/thumb-editor.js');
      ThumbEditor.attachToEditor(editor, {
        upload: async blob => { toast('사진을 올리는 중…'); return (await api('POST', 'upload', blob, 'image/jpeg')).url; },
        onChange: () => setDirty(true),
      });
    } catch (e) { /* 편집 도구를 못 불러와도 본문 수정은 계속 */ }

    $('#ieStatus').addEventListener('change', () => setDirty(true));
    $('#ieCancel').addEventListener('click', () => { if (!dirty || confirm('고친 내용을 버리고 나갈까요?')) { dirty = false; leaving = true; location.href = location.pathname + '?slug=' + encodeURIComponent(slug); } });
    $('#ieAdmin').addEventListener('click', () => { if (!dirty || confirm('저장하지 않은 내용은 사라져요. 관리자 페이지로 갈까요?')) { dirty = false; leaving = true; location.href = adminUrl(post.id); } });
    $('#ieSave').addEventListener('click', save);
    document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } });
    window.addEventListener('beforeunload', e => { if (dirty && !leaving) { e.preventDefault(); e.returnValue = ''; } });

    async function save() {
      if (saving) return;
      const title = h1.textContent.trim();
      if (!title) { alert('제목을 입력하세요.'); return; }
      const status = $('#ieStatus').value;
      if (status === 'published' && post.status !== 'published' && !confirm('이 글을 발행할까요? 블로그에 바로 공개돼요.')) return;
      if (status !== 'published' && post.status === 'published' && !confirm('발행을 취소할까요? 블로그에서 이 글이 내려가요.')) return;
      let body = editor.getContents(true);
      if (!/<(img|video|iframe|hr|table)/i.test(body) && !body.replace(/<[^>]*>/g, '').replace(/&nbsp;|​/g, '').trim()) body = '';
      const next = Object.assign({}, post, { title, summary: sum.textContent.trim(), body, format: 'html', images: {}, status, thumbnail });
      // 발행하는 순간이 발행일
      if (status === 'published' && post.status !== 'published') { next.date = todayStr(); next.publishedAt = Date.now(); }
      if (!next.created) next.created = post.created || post.date || todayStr();
      saving = true; $('#ieSave').textContent = '저장 중…';
      try {
        await api('PUT', 'posts/' + post.id, next);
        dirty = false; leaving = true;
        toast('저장했어요');
        setTimeout(() => location.href = location.pathname + '?slug=' + encodeURIComponent(slug), 400);
      } catch (err) {
        alert('저장하지 못했어요.\n' + err.message);
        saving = false; $('#ieSave').textContent = '저장';
      }
    }
  }
  $('#ieEdit').addEventListener('click', startEdit);
  if (params.get('edit') === '1') startEdit();
})();
