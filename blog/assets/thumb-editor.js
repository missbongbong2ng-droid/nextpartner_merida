/* 썸네일 편집 창 (블로그 화면 '이 글 수정'과 관리자 페이지에서 함께 사용)
   ThumbEditor.open({ src }) → Promise<Blob|null>
   - 자르기(16:9 고정 / 자유), 좌우·상하 대칭, 90도 회전, 확대·축소, 밝기·대비·채도, 처음으로
   - 저장하면 가로 1200px JPG(16:9면 1200×675) Blob을 돌려준다. 취소하면 null. */
(function () {
  const CR = 'https://cdn.jsdelivr.net/npm/cropperjs@1.6.2/dist/';
  let loading = null;
  function loadCropper() {
    if (window.Cropper) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((res, rej) => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = CR + 'cropper.min.css'; document.head.appendChild(l);
      const s = document.createElement('script'); s.src = CR + 'cropper.min.js'; s.onload = res; s.onerror = () => { loading = null; rej(new Error('편집 도구를 불러오지 못했어요')); }; document.head.appendChild(s);
    });
    return loading;
  }

  const css = `
  .te-back { position: fixed; inset: 0; z-index: 2000; background: rgba(14,19,44,.6); display: flex; align-items: center; justify-content: center; padding: 16px; }
  .te-box { width: min(980px, 100%); max-height: 100%; background: #fff; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; font-family: 'Pretendard', sans-serif; color: #1B2033; }
  .te-head { display: flex; align-items: center; gap: 8px; padding: 14px 18px; border-bottom: 1px solid #E4E7F0; }
  .te-head h3 { margin: 0 auto 0 0; font-size: 16px; }
  .te-stage { position: relative; background: #1B2033; height: min(56vh, 520px); }
  .te-stage img { display: block; max-width: 100%; }
  .te-stage .cropper-canvas img, .te-stage .cropper-view-box img { filter: var(--te-filter, none); }
  .te-empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: rgba(255,255,255,.8); font-size: 14px; }
  .te-tools { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 12px 18px; border-bottom: 1px solid #E4E7F0; }
  .te-tools .sep { width: 1px; height: 22px; background: #E4E7F0; margin: 0 4px; }
  .te-btn { height: 34px; padding: 0 12px; border: 1px solid #E4E7F0; border-radius: 9px; background: #fff; font: inherit; font-size: 13px; font-weight: 600; color: #1B2033; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
  .te-btn:hover { border-color: #C9D0E6; }
  .te-btn.on { background: #1B2033; color: #fff; border-color: #1B2033; }
  .te-btn.primary { background: #2F46D6; border-color: #2F46D6; color: #fff; }
  .te-btn:disabled { opacity: .4; cursor: default; }
  .te-adj { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 18px; padding: 12px 18px; }
  .te-adj label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #4A5170; }
  .te-adj input[type=range] { flex: 1; accent-color: #2F46D6; }
  .te-adj output { width: 38px; text-align: right; font-variant-numeric: tabular-nums; color: #8B90A6; font-weight: 500; }
  .te-foot { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-top: 1px solid #E4E7F0; }
  .te-foot .te-info { margin-right: auto; font-size: 12px; color: #8B90A6; }
  @media (max-width: 640px) { .te-adj { grid-template-columns: 1fr; } .te-stage { height: 44vh; } .te-tools .sep { display: none; } }
  `;

  function open(opts) {
    opts = opts || {};
    // mode 'thumb'(기본): 16:9, 1200×675 고정 / mode 'body': 자유 비율, 원래 크기(가로 최대 1400px)
    const body = opts.mode === 'body';
    const MAXW = body ? 1400 : 1200;
    const INFO_16 = body ? '16:9로 자르면 블로그 썸네일과 같은 비율이 돼요. 사진을 끌어 위치를, 휠로 크기를 조절하세요.' : '16:9로 자르면 1200×675 크기로 저장돼요. 사진을 끌어 위치를, 휠로 크기를 조절하세요.';
    const INFO_FREE = body ? '자유 비율 · 원래 크기를 유지하고 가로 1400px까지만 줄여 저장해요.' : '자유 비율은 가로 1200px 기준으로 저장돼요. 블로그 썸네일은 16:9 칸에 맞춰 보여요.';
    return loadCropper().then(() => new Promise(resolve => {
      if (!document.getElementById('te-style')) { const st = document.createElement('style'); st.id = 'te-style'; st.textContent = css; document.head.appendChild(st); }
      const back = document.createElement('div');
      back.className = 'te-back';
      back.innerHTML = `<div class="te-box" role="dialog" aria-label="썸네일 편집">
        <div class="te-head"><h3>${body ? '사진 편집' : '썸네일 편집'}</h3>
          <button class="te-btn" data-a="pick">다른 사진 고르기</button><input type="file" accept="image/*" hidden></div>
        <div class="te-stage"><img alt=""><div class="te-empty"><span>편집할 사진을 골라 주세요</span><button class="te-btn primary" data-a="pick">사진 고르기</button></div></div>
        <div class="te-tools">
          <button class="te-btn ${body ? '' : 'on'}" data-a="ratio" data-v="1.7777778">16:9</button>
          <button class="te-btn ${body ? 'on' : ''}" data-a="ratio" data-v="NaN">자유 비율</button>
          <span class="sep"></span>
          <button class="te-btn" data-a="flipX" title="좌우 대칭">⇋ 좌우 대칭</button>
          <button class="te-btn" data-a="flipY" title="상하 대칭">⇵ 상하 대칭</button>
          <button class="te-btn" data-a="rotL" title="왼쪽으로 90도">⟲ 90°</button>
          <button class="te-btn" data-a="rotR" title="오른쪽으로 90도">⟳ 90°</button>
          <span class="sep"></span>
          <button class="te-btn" data-a="zoomIn" title="확대">＋ 확대</button>
          <button class="te-btn" data-a="zoomOut" title="축소">－ 축소</button>
          <span class="sep"></span>
          <button class="te-btn" data-a="reset">처음으로</button>
        </div>
        <div class="te-adj">
          <label>밝기 <input type="range" min="50" max="150" value="100" data-f="brightness"><output>100</output></label>
          <label>대비 <input type="range" min="50" max="150" value="100" data-f="contrast"><output>100</output></label>
          <label>채도 <input type="range" min="0" max="200" value="100" data-f="saturate"><output>100</output></label>
        </div>
        <div class="te-foot"><span class="te-info">${body ? INFO_FREE : INFO_16}</span>
          <button class="te-btn" data-a="cancel">취소</button>
          <button class="te-btn primary" data-a="save" disabled>적용</button></div>
      </div>`;
      document.body.appendChild(back);
      const $ = s => back.querySelector(s);
      const img = $('.te-stage img');
      const file = $('input[type=file]');
      let cropper = null, sx = 1, sy = 1, ratio = body ? NaN : 16 / 9, objUrl = null;
      const f = { brightness: 100, contrast: 100, saturate: 100 };
      const filterStr = () => `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%)`;
      const applyFilter = () => $('.te-stage').style.setProperty('--te-filter', filterStr());

      function load(src) {
        if (cropper) { cropper.destroy(); cropper = null; }
        $('.te-empty').style.display = 'none';
        $('[data-a="save"]').disabled = true;
        if (!/^(blob:|data:|\/)/.test(src) && !src.startsWith(location.origin)) img.crossOrigin = 'anonymous'; else img.removeAttribute('crossorigin');
        img.onload = () => {
          sx = sy = 1;
          cropper = new Cropper(img, {
            viewMode: 1, aspectRatio: ratio, autoCropArea: 1, dragMode: 'move', background: false, responsive: true,
            toggleDragModeOnDblclick: false, ready() { $('[data-a="save"]').disabled = false; applyFilter(); },
          });
        };
        img.onerror = () => { $('.te-empty').style.display = ''; $('.te-empty span').textContent = '사진을 불러오지 못했어요. 다른 사진을 골라 주세요.'; };
        img.src = src;
      }
      if (opts.src) load(opts.src);

      file.addEventListener('change', () => {
        const fl = file.files[0]; file.value = ''; if (!fl) return;
        if (objUrl) URL.revokeObjectURL(objUrl);
        objUrl = URL.createObjectURL(fl); load(objUrl);
      });
      back.querySelectorAll('input[type=range]').forEach(r => r.addEventListener('input', () => {
        f[r.dataset.f] = +r.value; r.nextElementSibling.textContent = r.value; applyFilter();
      }));

      function close(result) {
        if (cropper) cropper.destroy();
        if (objUrl) URL.revokeObjectURL(objUrl);
        document.removeEventListener('keydown', onKey, true);
        back.remove();
        resolve(result);
      }
      // 관리자 페이지의 Esc(편집 창 닫기)보다 먼저 받아서 이 창만 닫는다
      const onKey = e => { if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close(null); } };
      document.addEventListener('keydown', onKey, true);
      back.addEventListener('click', e => {
        if (e.target === back) return close(null);
        const b = e.target.closest('[data-a]'); if (!b) return;
        const a = b.dataset.a;
        if (a === 'pick') return file.click();
        if (a === 'cancel') return close(null);
        if (!cropper) return;
        if (a === 'ratio') {
          ratio = +b.dataset.v; cropper.setAspectRatio(ratio);
          back.querySelectorAll('[data-a="ratio"]').forEach(x => x.classList.toggle('on', x === b));
          $('.te-info').textContent = isNaN(ratio) ? INFO_FREE : INFO_16;
        }
        else if (a === 'flipX') { sx = -sx; cropper.scaleX(sx); }
        else if (a === 'flipY') { sy = -sy; cropper.scaleY(sy); }
        else if (a === 'rotL') cropper.rotate(-90);
        else if (a === 'rotR') cropper.rotate(90);
        else if (a === 'zoomIn') cropper.zoom(0.1);
        else if (a === 'zoomOut') cropper.zoom(-0.1);
        else if (a === 'reset') {
          cropper.reset(); sx = sy = 1;
          Object.keys(f).forEach(k => f[k] = 100);
          back.querySelectorAll('input[type=range]').forEach(r => { r.value = 100; r.nextElementSibling.textContent = 100; });
          applyFilter();
        }
        else if (a === 'save') {
          // 썸네일: 1200px 고정 / 본문 사진: 원래 크기 유지(가로 최대 1400px, 작은 사진은 키우지 않음)
          const W = MAXW;
          const fixed = !body;
          const src = fixed
            ? cropper.getCroppedCanvas({ width: W, height: isNaN(ratio) ? undefined : Math.round(W / ratio), maxWidth: 4096, maxHeight: 4096, fillColor: '#fff', imageSmoothingQuality: 'high' })
            : cropper.getCroppedCanvas({ maxWidth: W, maxHeight: 4096, fillColor: '#fff', imageSmoothingQuality: 'high' });
          if (!src) { alert('사진을 자르지 못했어요.'); return; }
          // 밝기·대비·채도 적용
          const out = document.createElement('canvas');
          out.width = src.width; out.height = src.height;
          const ctx = out.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, out.width, out.height);
          ctx.drawImage(src, 0, 0);
          // 밝기 → 대비 → 채도 순서로 직접 계산 (CSS filter와 같은 식, 모든 브라우저에서 같은 결과)
          if (f.brightness !== 100 || f.contrast !== 100 || f.saturate !== 100) {
            try {
              const d = ctx.getImageData(0, 0, out.width, out.height), px = d.data;
              const B = f.brightness / 100, Cn = f.contrast / 100, s = f.saturate / 100;
              const m = [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
                         0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
                         0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s];
              for (let i = 0; i < px.length; i += 4) {
                let r = px[i] * B, g = px[i + 1] * B, b2 = px[i + 2] * B;
                r = (r - 127.5) * Cn + 127.5; g = (g - 127.5) * Cn + 127.5; b2 = (b2 - 127.5) * Cn + 127.5;
                px[i] = m[0] * r + m[1] * g + m[2] * b2;
                px[i + 1] = m[3] * r + m[4] * g + m[5] * b2;
                px[i + 2] = m[6] * r + m[7] * g + m[8] * b2;
              }
              ctx.putImageData(d, 0, 0);
            } catch (err) { /* 다른 사이트 사진이면 보정 없이 저장 시도 */ }
          }
          try { out.toBlob(bl => close(bl), 'image/jpeg', 0.86); }
          catch (err) { alert('이 사진은 편집 후 저장할 수 없어요(다른 사이트의 사진). 사진을 내려받아 다시 골라 주세요.'); }
        }
      });
    }));
  }
  /* 본문 에디터(SunEditor) 연결: 사진을 누르면 나오는 도구 막대에 '사진 편집' 단추를 붙인다
     upload(blob) → 주소, onChange() → 저장 표시 갱신 */
  function attachToEditor(editor, o) {
    const root = editor.core.context.element.topArea;
    const ctrl = root.querySelector('.se-controller-resizing');
    if (!ctrl || ctrl.querySelector('.te-edit-btn')) return;
    if (!document.getElementById('te-btn-style')) {
      const st = document.createElement('style'); st.id = 'te-btn-style';
      st.textContent = '.se-controller-resizing .te-edit-btn{width:auto!important;padding:0 10px!important;font-size:12px;font-weight:700;color:#2F46D6!important;white-space:nowrap}.se-controller-resizing.te-video .te-edit-grp{display:none!important}';
      document.head.appendChild(st);
    }
    const grp = document.createElement('div');
    grp.className = 'se-btn-group te-edit-grp';
    grp.style.paddingTop = '0';
    grp.innerHTML = '<button type="button" class="se-btn te-edit-btn" title="자르기 · 대칭 · 회전 · 밝기 보정">✎ 사진 편집 (자르기·보정)</button>';
    ctrl.appendChild(grp);
    // 영상이 선택됐을 때는 단추를 숨긴다
    new MutationObserver(() => {
      const el = editor.core.context.image && editor.core.context.image._element;
      const isImg = editor.core.context.resizing && editor.core.context.resizing._resize_plugin === 'image' && el && el.tagName === 'IMG';
      ctrl.classList.toggle('te-video', !isImg);
    }).observe(ctrl, { attributes: true, attributeFilter: ['style'] });
    const btn = grp.querySelector('button');
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', async () => {
      const img = editor.core.context.image && editor.core.context.image._element;
      if (!img || img.tagName !== 'IMG' || (editor.core.context.resizing && editor.core.context.resizing._resize_plugin !== 'image')) return;
      editor.core.controllersOff();
      try {
        const blob = await open({ src: img.getAttribute('src'), mode: 'body' });
        if (!blob) return;
        const url = await o.upload(blob);
        img.setAttribute('src', url);
        // 에디터 자체 회전·반전(화면 표시용)은 편집 결과에 이미 반영했으니 지운다
        img.style.transform = ''; img.style.transformOrigin = '';
        ['data-rotate', 'data-rotatex', 'data-rotatey', 'data-rotate-x', 'data-rotate-y'].forEach(a => img.removeAttribute(a));
        img.removeAttribute('data-origin');
        try { editor.core.history.push(false); } catch (e) {}
        if (o.onChange) o.onChange();
      } catch (err) { alert('사진을 편집하지 못했어요.\n' + err.message); }
    });
  }
  window.ThumbEditor = { open, attachToEditor };
})();
