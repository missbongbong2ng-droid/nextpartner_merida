// 블로그 Worker (SelB · 모리아AI)
// - 정적 파일(html, assets)은 ASSETS 바인딩이 서비스
// - /selb/*, /moriahai/* : 같은 화면 파일을 서비스별 블로그로 내려줌 (글은 그 site만). 관리자는 /admin
// - 예전 SelB 주소(/, /post.html, /service.html …) → /selb/… 로 302
// - /posts.js  : DB의 글을 posts.js 형식으로 내려줌 (방문자는 그 블로그의 발행 글만, 관리자는 그 블로그 전체,
//                관리자 페이지는 ?all=1 로 모든 서비스의 글)
// - /api/*     : 로그인, 글 저장·삭제, 이미지 업로드
// - /img/*     : R2에 올린 이미지
// - 매일 06:00(한국 시간) 예약 작업: SelB 자동 초안 (worker/autodraft.js)

import { AUTODRAFT_CATS, getAutodraftConfig, getAutodraftLog, makeDraft, runDaily } from './autodraft.js';

const COOKIE = 'selb_admin';
const SESSION_DAYS = 30;

export default {
  // 예약 작업 (wrangler.jsonc triggers.crons)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDaily(env));
  },
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    try {
      if (p === '/posts.js') return await postsJs(req, env, 'selb', url);
      const sm = p.match(SITE_PATH);
      if (sm) return await siteRoute(req, env, url, sm[1], sm[2] || '');
      // 예전 SelB 주소(맨 앞 /, /post.html …)는 /selb/ 아래 같은 화면으로 보낸다.
      // 공유된 링크가 많아 302(임시)로: 301은 브라우저가 오래 기억해서 나중에 되돌리기 어렵다
      if (LEGACY_SELB.test(p)) return new Response(null, { status: 302, headers: { location: url.origin + '/selb' + (p === '/' ? '/' : p) + url.search, 'cache-control': 'no-store' } });
      // 예전 글 관리 주소 → 새 주소
      if (p === '/write' || p === '/write.html') return Response.redirect(url.origin + '/admin', 301);
      // 서비스별 페이지 원본은 그 블로그 주소로만 연다 (예: /sites/moriahai-service → /moriahai/service)
      const sp = p.match(/^\/sites\/([a-z]+)-service(\.html)?$/);
      if (sp) return Response.redirect(url.origin + '/' + sp[1] + '/service', 302);
      if (p.startsWith('/img/')) return await getImage(p.slice(5), env, req);
      if (p.startsWith('/api/')) return await api(req, env, url);
    } catch (e) {
      return json({ error: '서버 오류: ' + (e && e.message) }, 500);
    }
    return env.ASSETS.fetch(req);
  },
};

/* ---------- 공통 ---------- */
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}
const enc = new TextEncoder();
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c]));
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function getCookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}
async function isAdmin(req, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const v = getCookie(req, COOKIE);
  if (!v) return false;
  const [exp, sig] = v.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(env.ADMIN_PASSWORD, 'admin:' + exp));
}

// 한국 시간 기준 날짜 (offset일 전후)
function kstDay(offset) {
  return new Date(Date.now() + 9 * 3600e3 + offset * 864e5).toISOString().slice(0, 10);
}

/* ---------- 글 ---------- */
function rowToPost(r) {
  const d = JSON.parse(r.data);
  d.id = r.id;
  return d;
}
async function allPosts(env) {
  const { results } = await env.DB.prepare('SELECT id, data FROM posts ORDER BY date DESC, updated_at DESC').all();
  return results.map(rowToPost);
}
function upsertStmt(env, post) {
  return env.DB.prepare(
    `INSERT INTO posts (id, slug, status, category, date, featured, data, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
     ON CONFLICT(id) DO UPDATE SET slug=?2, status=?3, category=?4, date=?5, featured=?6, data=?7, updated_at=?8`
  ).bind(post.id, post.slug || '', post.status || 'idea', post.category || '', post.date || '',
    post.featured ? 1 : 0, JSON.stringify(post), Date.now());
}
function cleanPost(p) {
  if (!p || typeof p !== 'object' || typeof p.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(p.id)) return null;
  return p;
}

/* ---------- 서비스별 블로그 ---------- */
const SITE_META = {
  moriahai: { title: '모리아AI 블로그 - 채용·행사 현장을 AI로 운영하는 이야기', desc: '모리아AI 현장 스케치, 서비스 소개, 도입 가이드, 채용·공공 현장의 AI 활용 인사이트' },
};
// 블로그는 서비스별로 나란히: /selb/…, /moriahai/… (관리자는 /admin 하나)
const SITE_PATH = /^\/(selb|moriahai)(\/.*)?$/;
const LEGACY_SELB = /^\/(index(\.html)?|post(\.html)?|service(\.html)?)?$/;
const siteOf = p => p.site || 'selb';
async function siteRoute(req, env, url, site, rest) {
  if (!rest) return Response.redirect(url.origin + '/' + site + '/' + url.search, 302);
  if (rest === '/posts.js') return postsJs(req, env, site, url);
  if (rest.startsWith('/img/')) return getImage(rest.slice(5), env, req);
  let path = rest.replace(/\.html$/, '');
  if (path === '/index') path = '/';
  if (path === '/admin') return Response.redirect(url.origin + '/admin', 302);
  if (path === '/service') path = '/sites/' + site + '-service'; // 서비스별 서비스 소개 페이지
  const res = await env.ASSETS.fetch(new Request(url.origin + path + url.search, req));
  const meta = SITE_META[site];
  // 서비스별 전용 페이지(/sites/…)는 자기 제목을 그대로 쓴다
  if (!meta || path.startsWith('/sites/') || !(res.headers.get('content-type') || '').includes('text/html')) return res;
  return new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(meta.title); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', meta.desc); } })
    .transform(res);
}

/* ---------- 관리자 설정 ---------- */
const SITE_IDS = { selb: 1, moriahai: 1 };
// 설문 응답자 정보 선택지 (화면 common.js의 SURVEY_PROFILE과 같아야 한다)
const SURVEY_GENDERS = ['female', 'male', 'none'];
const SURVEY_AGES = ['10s', '20s', '30s', '40s', '50s', '60s', 'none'];
async function getSetting(env, key) {
  try {
    const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?1').bind(key).first();
    return row ? JSON.parse(row.value) : null;
  } catch (e) { return null; } // 설정 표가 아직 없을 때
}
const clampNum = (v, lo, hi, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
const cleanText = (v, n) => String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, n);
// 설문 설정 검사·정리 (잘못된 값은 고치거나 거절)
function cleanSurvey(b) {
  if (!b || typeof b !== 'object' || !Array.isArray(b.questions)) return null;
  const ids = new Set();
  const questions = b.questions.slice(0, 20).map(q => {
    let id = /^[a-z0-9_]{1,20}$/.test(q.id || '') ? q.id : 'q' + Math.random().toString(36).slice(2, 8);
    while (ids.has(id)) id = 'q' + Math.random().toString(36).slice(2, 8);
    ids.add(id);
    const type = q.type === 'scale' ? 'scale' : 'choice';
    const options = type === 'scale' ? ['1', '2', '3', '4', '5']
      : (Array.isArray(q.options) ? q.options : []).map(o => cleanText(o, 40)).filter(Boolean).slice(0, 8);
    const out = { id, topic: cleanText(q.topic, 20) || '기타', q: cleanText(q.q, 80), type, options, weight: clampNum(q.weight, 1, 5, 1) };
    if (type === 'scale') out.labels = (Array.isArray(q.labels) ? q.labels : []).slice(0, 5).map(l => cleanText(l, 10));
    return out;
  }).filter(q => q.q && (q.type === 'scale' || q.options.length >= 2));
  return {
    enabled: b.enabled !== false,
    chance: clampNum(b.chance, 0, 1, 0.3),
    minRead: clampNum(b.minRead, 0.1, 1, 0.6),
    delaySec: clampNum(b.delaySec, 5, 600, 40),
    answeredDays: clampNum(b.answeredDays, 0, 365, 30),
    closedDays: clampNum(b.closedDays, 0, 365, 7),
    askProfile: b.askProfile !== false,
    questions,
  };
}

async function postsJs(req, env, site, url) {
  const admin = await isAdmin(req, env);
  let posts = await allPosts(env);
  // 관리자 페이지(?all=1)만 모든 서비스의 글, 나머지는 그 블로그 글만
  if (!(admin && url.searchParams.get('all') === '1')) posts = posts.filter(p => siteOf(p) === site);
  if (!admin) {
    // 방문자에게는 발행 글만, 비공개 메모는 빼고
    posts = posts.filter(p => p.status === 'published').map(({ memo, ...rest }) => rest);
  }
  // 관리자 설정(설문): 저장된 값이 있는 서비스만. 없으면 화면 쪽 기본값을 쓴다
  const sites = admin && url.searchParams.get('all') === '1' ? Object.keys(SITE_IDS) : [site];
  const survey = {};
  for (const s of sites) { const v = await getSetting(env, 'survey:' + s); if (v) survey[s] = v; }
  // 글별 전체 조회수 (목록·글 상단에 눈 아이콘과 함께 표시)
  const views = {};
  try {
    const ids = new Set(posts.map(p => p.id));
    const { results: vr } = await env.DB.prepare('SELECT post_id, SUM(n) total FROM post_views GROUP BY post_id').all();
    vr.forEach(r => { if (ids.has(r.post_id)) views[r.post_id] = r.total; });
  } catch (e) {}
  const body = 'window.BLOG_ONLINE = true;\nwindow.BLOG_ADMIN = ' + admin + ';\nwindow.BLOG_SURVEY = ' + JSON.stringify(survey) + ';\nwindow.BLOG_VIEWS = ' + JSON.stringify(views) + ';\nwindow.BLOG_POSTS = ' + JSON.stringify(posts) + ';\n';
  return new Response(body, {
    headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/* ---------- 이미지 ---------- */
// 이미지·영상 내려주기. 영상은 브라우저가 구간(Range)으로 요청하므로 206 응답을 지원한다
async function getImage(key, env, req) {
  key = decodeURIComponent(key);
  if (!key || key.includes('..')) return new Response('Not found', { status: 404 });
  const range = req.headers.get('range');
  const obj = await env.IMAGES.get(key, range ? { range: req.headers } : undefined);
  if (!obj) return new Response('Not found', { status: 404 });
  const h = new Headers();
  obj.writeHttpMetadata(h);
  h.set('etag', obj.httpEtag);
  h.set('accept-ranges', 'bytes');
  h.set('cache-control', 'public, max-age=31536000, immutable');
  if (range && obj.range) {
    const r = obj.range;
    const start = r.offset !== undefined ? r.offset : obj.size - r.suffix;
    const len = r.length !== undefined ? r.length : obj.size - start;
    h.set('content-range', `bytes ${start}-${start + len - 1}/${obj.size}`);
    h.set('content-length', String(len));
    return new Response(obj.body, { status: 206, headers: h });
  }
  h.set('content-length', String(obj.size));
  return new Response(obj.body, { headers: h });
}

/* ---------- API ---------- */
async function api(req, env, url) {
  const p = url.pathname.slice(5);
  const m = req.method;

  if (p === 'login' && m === 'POST') {
    if (!env.ADMIN_PASSWORD) return json({ error: '관리자 비밀번호가 설정되지 않았습니다.' }, 500);
    const { password } = await req.json().catch(() => ({}));
    // 터미널에서 비밀번호를 넣을 때 앞뒤 공백·줄바꿈이 같이 저장되는 경우가 있어 양쪽 모두 정리해서 비교
    if (typeof password !== 'string' || !safeEqual(password.trim(), env.ADMIN_PASSWORD.trim())) {
      await new Promise(r => setTimeout(r, 800)); // 연속 시도를 느리게
      return json({ error: '비밀번호가 맞지 않습니다.' }, 401);
    }
    const exp = Date.now() + SESSION_DAYS * 864e5;
    const token = exp + '.' + await hmac(env.ADMIN_PASSWORD, 'admin:' + exp);
    return json({ ok: true }, 200, {
      'set-cookie': `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Strict`,
    });
  }
  if (p === 'logout' && m === 'POST') {
    return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict` });
  }
  if (p === 'me') return json({ admin: await isAdmin(req, env) });

  // 독자 설문 응답 저장 (방문자용). 답한 뒤 의견을 덧붙이면 같은 응답을 고친다(rid + token)
  if (p === 'survey' && m === 'POST') {
    let b = {};
    try { b = JSON.parse(await req.text()) || {}; } catch (e) {}
    const site = /^[a-z]{1,20}$/.test(b.site || '') ? b.site : 'selb';
    const postId = /^[A-Za-z0-9_-]{0,64}$/.test(b.postId || '') ? (b.postId || '') : '';
    const qid = /^[a-z0-9_]{1,20}$/.test(b.qid || '') ? b.qid : '';
    const answer = String(b.answer || '').slice(0, 100).trim();
    const comment = String(b.comment || '').slice(0, 500).trim();
    if (!qid || !answer) return json({ error: '잘못된 요청입니다.' }, 400);
    if (b.rid && b.token) {
      // 의견·성별·나이대 덧붙이기: 저장할 때 준 token이 맞아야 고칠 수 있다. 보낸 항목만 고친다
      const ok = await hmac(env.ADMIN_PASSWORD || 'survey', 'survey:' + b.rid) === b.token;
      if (!ok) return json({ error: '잘못된 요청입니다.' }, 400);
      const sets = [], vals = [];
      if ('comment' in b) { sets.push('comment = ?'); vals.push(comment); }
      if ('gender' in b) { sets.push('gender = ?'); vals.push(SURVEY_GENDERS.includes(b.gender) ? b.gender : ''); }
      if ('age' in b) { sets.push('age = ?'); vals.push(SURVEY_AGES.includes(b.age) ? b.age : ''); }
      if (sets.length) await env.DB.prepare('UPDATE survey_responses SET ' + sets.join(', ') + ' WHERE id = ?').bind(...vals, Number(b.rid)).run();
      return json({ ok: true });
    }
    const r = await env.DB.prepare('INSERT INTO survey_responses (site, post_id, qid, answer, comment, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
      .bind(site, postId, qid, answer, comment, Date.now()).run();
    const rid = r.meta && r.meta.last_row_id;
    return json({ ok: true, rid, token: rid ? await hmac(env.ADMIN_PASSWORD || 'survey', 'survey:' + rid) : '' });
  }

  // 조회수 기록 (방문자용, 로그인 불필요). 관리자 조회·검색 로봇은 세지 않는다
  if (p === 'view' && m === 'POST') {
    const ua = req.headers.get('user-agent') || '';
    if (/bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i.test(ua) || await isAdmin(req, env)) return json({ ok: true, counted: false });
    let id = '';
    try { id = (JSON.parse(await req.text()) || {}).id || ''; } catch (e) {}
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return json({ error: '잘못된 요청입니다.' }, 400);
    const row = await env.DB.prepare("SELECT 1 FROM posts WHERE id = ?1 AND status = 'published'").bind(id).first();
    if (!row) return json({ ok: true, counted: false });
    const day = kstDay(0);
    await env.DB.prepare('INSERT INTO post_views (post_id, day, n) VALUES (?1, ?2, 1) ON CONFLICT(post_id, day) DO UPDATE SET n = n + 1').bind(id, day).run();
    return json({ ok: true, counted: true });
  }

  // 여기부터 관리자만
  if (!(await isAdmin(req, env))) return json({ error: '로그인이 필요합니다.' }, 401);
  // 다른 사이트에서 보낸 요청 차단
  const origin = req.headers.get('origin');
  if (m !== 'GET' && origin && origin !== url.origin) return json({ error: '허용되지 않은 요청입니다.' }, 403);

  if (p === 'posts' && m === 'GET') return json(await allPosts(env));

  // 자동 초안 (관리자): 설정·기록 보기, 설정 저장, 지금 한 편 만들기
  if (p === 'autodraft' && m === 'GET') {
    return json({ config: await getAutodraftConfig(env), log: await getAutodraftLog(env), hasKey: !!env.ANTHROPIC_API_KEY, categories: AUTODRAFT_CATS });
  }
  if (p === 'autodraft' && m === 'PUT') {
    const b = await req.json().catch(() => ({}));
    const v = { enabled: b.enabled !== false, categories: (Array.isArray(b.categories) ? b.categories : []).filter(c => AUTODRAFT_CATS[c]) };
    await env.DB.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = ?3')
      .bind('autodraft:selb', JSON.stringify(v), Date.now()).run();
    return json(v);
  }
  if (p === 'autodraft/run' && m === 'POST') {
    const b = await req.json().catch(() => ({}));
    return json(await makeDraft(env, b.category, 'manual'));
  }

  // 설문 설정 (관리자): 읽기 · 저장 · 기본값으로 되돌리기(삭제)
  const sm = p.match(/^settings\/survey\/([a-z]{1,20})$/);
  if (sm && SITE_IDS[sm[1]]) {
    const key = 'survey:' + sm[1];
    if (m === 'GET') return json(await getSetting(env, key));
    if (m === 'PUT') {
      const v = cleanSurvey(await req.json().catch(() => null));
      if (!v) return json({ error: '설정 형식이 잘못되었습니다.' }, 400);
      if (!v.questions.length) return json({ error: '질문이 하나 이상 있어야 해요.' }, 400);
      await env.DB.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = ?3')
        .bind(key, JSON.stringify(v), Date.now()).run();
      return json(v);
    }
    if (m === 'DELETE') { await env.DB.prepare('DELETE FROM settings WHERE key = ?1').bind(key).run(); return json({ ok: true }); }
  }

  // 설문 응답 목록 (관리자): 기간(from ≤ created_at < to, 밀리초)으로 걸러 최대 50000건
  if (p === 'survey' && m === 'GET') {
    const site = url.searchParams.get('site') || 'selb';
    const from = Number(url.searchParams.get('from')) || 0;
    const to = Number(url.searchParams.get('to')) || 8.64e15;
    const { results } = await env.DB.prepare(
      'SELECT id, post_id, qid, answer, comment, gender, age, created_at FROM survey_responses WHERE site = ?1 AND created_at >= ?2 AND created_at < ?3 ORDER BY created_at DESC LIMIT 50000'
    ).bind(site, from, to).all();
    return json(results);
  }

  // 글별 조회수: { 글ID: { total, d7, today } }
  if (p === 'views' && m === 'GET') {
    const { results } = await env.DB.prepare(
      `SELECT post_id, SUM(n) total, SUM(CASE WHEN day >= ?1 THEN n ELSE 0 END) d7, SUM(CASE WHEN day = ?2 THEN n ELSE 0 END) today
       FROM post_views GROUP BY post_id`).bind(kstDay(-6), kstDay(0)).all();
    const out = {};
    results.forEach(r => out[r.post_id] = { total: r.total, d7: r.d7, today: r.today });
    return json(out);
  }

  // 전체 바꾸기 (파일에서 가져오기)
  if (p === 'posts' && m === 'PUT') {
    const list = await req.json();
    if (!Array.isArray(list)) return json({ error: '목록 형식이 아닙니다.' }, 400);
    const posts = list.map(cleanPost);
    if (posts.some(x => !x)) return json({ error: 'id가 없거나 잘못된 글이 있습니다.' }, 400);
    const stmts = [env.DB.prepare('DELETE FROM posts'), ...posts.map(x => upsertStmt(env, x))];
    await env.DB.batch(stmts);
    return json({ ok: true, count: posts.length });
  }

  const pm = p.match(/^posts\/([A-Za-z0-9_-]{1,64})$/);
  if (pm && m === 'PUT') {
    const post = cleanPost(await req.json());
    if (!post || post.id !== pm[1]) return json({ error: '글 형식이 잘못되었습니다.' }, 400);
    await upsertStmt(env, post).run();
    return json({ ok: true });
  }
  if (pm && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM posts WHERE id = ?1').bind(pm[1]).run();
    return json({ ok: true });
  }

  if (p === 'upload' && m === 'POST') {
    const type = (req.headers.get('content-type') || '').split(';')[0];
    const ext = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
      'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
    }[type];
    if (!ext) return json({ error: '이미지(JPG·PNG·WEBP·GIF) 또는 영상(MP4·WEBM·MOV) 파일만 올릴 수 있습니다.' }, 400);
    const isVideo = type.startsWith('video/');
    const max = isVideo ? 95 * 1024 * 1024 : 10 * 1024 * 1024;
    const size = Number(req.headers.get('content-length') || 0);
    if (!size) return json({ error: '파일 크기를 알 수 없습니다.' }, 411);
    if (size > max) return json({ error: isVideo ? '영상은 95MB 이하만 올릴 수 있어요. 더 큰 영상은 유튜브에 올린 뒤 주소로 넣어 주세요.' : '10MB 이하 이미지만 올릴 수 있습니다.' }, 413);
    const d = new Date();
    const key = `uploads/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.${ext}`;
    // 영상은 메모리에 다 올리지 않고 그대로 흘려 저장
    let data;
    if (isVideo) {
      const { readable, writable } = new FixedLengthStream(size);
      req.body.pipeTo(writable).catch(() => {});
      data = readable;
    } else data = await req.arrayBuffer();
    await env.IMAGES.put(key, data, { httpMetadata: { contentType: type } });
    return json({ url: '/img/' + key });
  }

  return json({ error: '없는 요청입니다.' }, 404);
}
