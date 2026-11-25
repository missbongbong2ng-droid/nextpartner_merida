/* 블로그 공통 스크립트 (SelB · 모리아AI)
   서비스별 설정은 SITES에 있고, 지금 보고 있는 블로그는 주소로 정해진다.
   - /selb/…      → SelB 블로그
   - /moriahai/…  → 모리아AI 블로그
   - 그 밖(/admin) → 관리자. 기본 서비스는 SelB */

const SITES = {
  selb: {
    id: 'selb',
    name: 'SelB BLOG',
    brandName: 'SelB',
    logoSuffix: 'BLOG',
    logoMark: 'P',
    logoMarkImg: '/assets/img/selb/logo-mark.png',  // 로고 마크 이미지 (없으면 logoMark 글자)
    favicon: '/assets/img/selb/favicon-32.png',      // 브라우저 탭 아이콘
    touchIcon: '/assets/img/selb/favicon-180.png',  // 휴대폰 홈 화면 아이콘
    base: '/selb/',
    color: '#2F46D6', colorDark: '#2338C4', colorSoft: '#EDF1FF',
    tagline: 'AI로 나를 발견하고, 나만의 브랜드를 만드는 이야기',
    introTitle: '나를 발견하고,<br>나만의 브랜드를 만드는 이야기',
    ctaText: 'AI 명함 만들기',
    ctaUrl: 'https://pbaas.vercel.app/',
    postCtaText: '지금 나만의 AI 명함을 만들어 보세요',
    postCtaSub: '대화 몇 번이면 프로필·소개 문구·명함까지 AI가 정리해 드려요.',
    avatar: 'P',
    navExtra: { label: '서비스 소개', href: 'service.html', page: 'service' },
    side: { eyebrow: 'AI SELF BRANDING', title: '대화 몇 번이면<br>나를 알리는 AI 명함 완성', text: '셀브와 이야기하며 내 강점을 찾고, 카톡·QR로 바로 건네세요.', btn: '서비스 소개 영상 보기', href: 'service.html' },
    author: { name: 'SelB 팀', bio: 'AI 셀프 브랜딩 · AI 명함 서비스' },
    copyright: 'ⓒ SelB. 이 글의 내용을 인용할 때는 출처(SelB BLOG)와 링크를 함께 남겨 주세요.',
    categories: [
      { id: 'news', label: '소식', desc: 'SelB 기능 소개, 업데이트, 서비스 공지와 안내' },
      { id: 'brand', label: '브랜드', desc: '나를 알리는 셀프 브랜딩 팁과 고객 이야기' },
      { id: 'event', label: '이벤트', desc: '진행 중인 이벤트와 혜택 소식' },
    ],
  },
  moriahai: {
    id: 'moriahai',
    name: '모리아AI 블로그',
    brandName: '모리아AI',
    logoImg: '/assets/img/moriahai/logo.png',
    base: '/moriahai/',
    color: '#3563F0', colorDark: '#2A4FD0', colorSoft: '#EEF2FF',
    tagline: '채용·행사 현장을 AI로 운영하는 이야기',
    introTitle: '현장에서 검증한<br>AI 운영 이야기',
    ctaText: '도입 문의',
    ctaUrl: 'https://moriahai.com/contact',
    postCtaText: '박람회·행사를 준비 중이시라면?',
    postCtaSub: 'AI 증명사진부터 손글씨 이력서 변환, 모의면접, 참여기업 안내까지. 행사 규모에 맞는 기능만 골라 현장 운영까지 함께합니다.',
    postCtaBtn: '도입 상담 받기',
    postCtaPoints: ['전국 박람회 28곳 운영', '개발 인력 없이 도입', '필요한 기능만 골라서'],
    postCtaClass: 'cta-moriah',
    avatar: 'M',
    navExtra: { label: '서비스 소개', href: 'service.html', page: 'service' },
    side: { eyebrow: 'MORIAH AI', title: '개발 인력 없이도<br>현장에 맞는 AI 솔루션', text: '박람회·기관 행사에 필요한 기능만 골라 맞춤 제작하고, 운영까지 함께합니다.', btn: '서비스 25종 보기', href: 'https://moriahai.com/services', external: true },
    author: { name: '모리아AI 팀', bio: '주식회사 모리아타운 · 현장 운영형 AI 솔루션' },
    copyright: 'ⓒ 주식회사 모리아타운. 이 글의 내용을 인용할 때는 출처(모리아AI 블로그)와 링크를 함께 남겨 주세요.',
    categories: [
      { id: 'news', label: '소식', desc: '모리아AI 서비스 소개, 기능 업데이트, 공지와 안내' },
      { id: 'brand', label: '브랜드', desc: '박람회·기관 현장 이야기와 채용·공공 현장의 AI 인사이트' },
      { id: 'event', label: '이벤트', desc: '진행 중인 이벤트와 혜택 소식' },
      // 현장 스케치: 홈페이지 도입사례를 가져온 사진 글 (worker/tools/sync_sketch.cjs)
      // grid: 목록을 사진 카드 격자로 / feed:false: '전체 글' 목록·추천글에는 섞지 않음
      { id: 'sketch', label: '현장 스케치', desc: '모리아AI가 함께한 박람회·기관 행사 현장 사진', layout: 'grid', feed: false },
      { id: 'guide', label: '도입 가이드', desc: '도입 절차, 준비물, 운영 방식, 자주 묻는 질문' },
    ],
    // 카테고리가 아닌 바깥 링크 (after: 이 카테고리 바로 뒤에 표시)
    navLinks: [],
  },
};
/* 독자 설문: 글 페이지에서 무작위로 한 문항 (assets/survey.js), 결과는 관리자 '설문' 탭
   chance: 글을 연 방문자 중 설문을 볼 비율 / weight: 문항이 뽑힐 상대 비중 */
const SURVEY = { chance: 0.3, answeredDays: 30, closedDays: 7 };
const SCALE5 = ['1', '2', '3', '4', '5'];
// 응답 후 묻는 응답자 정보 (값은 서버 worker/index.js의 SURVEY_GENDERS·SURVEY_AGES와 같아야 한다)
const SURVEY_PROFILE = {
  genders: [{ id: 'female', label: '여성' }, { id: 'male', label: '남성' }, { id: 'none', label: '응답 안 함' }],
  ages: [{ id: '10s', label: '10대' }, { id: '20s', label: '20대' }, { id: '30s', label: '30대' }, { id: '40s', label: '40대' }, { id: '50s', label: '50대' }, { id: '60s', label: '60대 이상' }, { id: 'none', label: '응답 안 함' }],
};
const profileLabel = (kind, id) => ((SURVEY_PROFILE[kind].find(x => x.id === id) || {}).label) || '';
const SURVEYS = {
  selb: [
    { id: 'helpful', topic: '글 품질', q: '이 글이 도움이 되었나요?', type: 'scale', options: SCALE5, labels: ['전혀', '별로', '보통', '도움됨', '아주 많이'], weight: 4 },
    { id: 'length', topic: '글 품질', q: '글 길이는 어땠나요?', options: ['짧아요', '적당해요', '길어요'], weight: 1 },
    { id: 'want', topic: '블로그 운영', q: '어떤 글을 더 보고 싶으세요?', options: ['기능 사용법', '셀프 브랜딩 팁', '고객 이야기', '이벤트 소식'], weight: 2 },
    { id: 'found', topic: '블로그 운영', q: '이 블로그를 어떻게 알게 되셨나요?', options: ['검색', 'SNS', '지인 소개', 'SelB 서비스 안에서', '기타'], weight: 1 },
    { id: 'used', topic: '서비스', q: 'SelB AI 명함을 써 보셨나요?', options: ['지금 쓰고 있어요', '써 본 적 있어요', '아직이요, 관심 있어요', '잘 모르겠어요'], weight: 2 },
    { id: 'need', topic: '서비스', q: 'AI 명함이 가장 필요할 것 같은 때는?', options: ['고객·거래처 미팅', '행사·모임', 'SNS·온라인 소개', '이직·새 출발'], weight: 1 },
  ],
  moriahai: [
    { id: 'helpful', topic: '글 품질', q: '이 글이 도움이 되었나요?', type: 'scale', options: SCALE5, labels: ['전혀', '별로', '보통', '도움됨', '아주 많이'], weight: 4 },
    { id: 'length', topic: '글 품질', q: '글 길이는 어땠나요?', options: ['짧아요', '적당해요', '길어요'], weight: 1 },
    { id: 'want', topic: '블로그 운영', q: '어떤 글을 더 보고 싶으세요?', options: ['현장 이야기', '서비스 기능 소개', '도입 방법·절차', 'AI 활용 인사이트'], weight: 2 },
    { id: 'found', topic: '블로그 운영', q: '이 블로그를 어떻게 알게 되셨나요?', options: ['검색', 'SNS', '지인 소개', '모리아AI 홈페이지', '기타'], weight: 1 },
    { id: 'org', topic: '서비스', q: '어떤 곳에서 일하고 계신가요?', options: ['공공기관·지자체', '기업', '교육기관', '행사·박람회 운영', '기타'], weight: 2 },
    { id: 'plan', topic: '서비스', q: '모리아AI 도입을 검토 중이신가요?', options: ['검토 중이에요', '관심 있어요', '아직은 아니에요'], weight: 1 },
  ],
};

/* 지금 쓰는 설문 설정: 관리자 '설정'에서 저장한 값(서버가 window.BLOG_SURVEY로 내려줌)이 있으면 그것, 없으면 위 기본값 */
function surveyDefaults(site) {
  return { enabled: true, chance: SURVEY.chance, minRead: 0.6, delaySec: 40, answeredDays: SURVEY.answeredDays, closedDays: SURVEY.closedDays, askProfile: true, questions: JSON.parse(JSON.stringify(SURVEYS[site] || [])) };
}
function surveyConfig(site) {
  const saved = window.BLOG_SURVEY && window.BLOG_SURVEY[site];
  return saved ? Object.assign(surveyDefaults(site), saved) : surveyDefaults(site);
}

function detectSite() {
  if (window.BLOG_SITE && SITES[window.BLOG_SITE]) return window.BLOG_SITE;
  return /^\/moriahai(\/|$)/.test(location.pathname) ? 'moriahai' : 'selb';
}
const SITE = SITES[detectSite()];
const CATEGORIES = SITE.categories;
const ALL_CATEGORIES = Object.values(SITES).flatMap(s => s.categories.map(c => Object.assign({ site: s.id }, c)));
function siteOf(p) { return (p && SITES[p.site]) ? p.site : 'selb'; }
// 브랜드 색 적용
(function () {
  const r = document.documentElement.style;
  r.setProperty('--brand', SITE.color); r.setProperty('--brand-dark', SITE.colorDark); r.setProperty('--brand-soft', SITE.colorSoft);
  // 브라우저 탭 아이콘 (서비스별)
  if (SITE.favicon && !document.querySelector('link[rel="icon"]')) {
    [['icon', 'image/png', SITE.favicon], ['apple-touch-icon', '', SITE.touchIcon || SITE.favicon]].forEach(([rel, type, href]) => {
      const l = document.createElement('link'); l.rel = rel; l.href = href; if (type) l.type = type; document.head.appendChild(l);
    });
  }
})();

/* 조회수: 눈 아이콘 + 숫자 (서버가 window.BLOG_VIEWS로 글별 전체 조회수를 내려줌) */
const EYE_ICON = '<svg class="eye" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
function viewsHTML(p) {
  const n = (window.BLOG_VIEWS && window.BLOG_VIEWS[p.id]) || 0;
  return `<span class="views" title="조회수">${EYE_ICON}${Number(n).toLocaleString('ko-KR')}</span>`;
}
// 예전 카테고리로 저장된 글을 새 카테고리로 옮김
const CATEGORY_MIGRATE = { branding: 'brand', card: 'news', stories: 'brand', product: 'news' };

const STATUSES = [
  { id: 'idea', label: '글감' },
  { id: 'draft', label: '초안' },
  { id: 'published', label: '발행' },
  { id: 'hold', label: '보류' },
  { id: 'trash', label: '휴지통' },
];
// 보드의 기본 세 칸 (보류·휴지통은 '보관함' 칸에서 따로 본다)
const BOARD_STATUSES = STATUSES.slice(0, 3);
/* 글의 기준 날짜: 발행 글은 발행일, 휴지통은 지운 날, 나머지(글감·초안·보류)는 작성일 */
function postDay(p) {
  if (p.status === 'published') return p.date || '';
  if (p.status === 'trash' && p.trashedAt) return localDay(p.trashedAt);
  return p.created || p.date || '';
}
function postDayLabel(p) {
  return p.status === 'published' ? '발행' : p.status === 'trash' ? '삭제' : '작성';
}
/* 같은 날짜 안에서도 최근 것이 먼저 오도록 시각까지 붙인 정렬 값 */
function postStamp(p) {
  const t = p.status === 'published' ? p.publishedAt : p.status === 'trash' ? p.trashedAt : p.createdAt;
  return postDay(p) + '|' + String(t || 0).padStart(15, '0');
}
function localDay(ms) {
  const d = new Date(ms), z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

const STORE_KEY = 'selb_blog_posts_v1';

/* ---------- 데이터 ---------- */
/* 서버(클라우드플레어)에서 열면 posts.js가 DB 내용이고 BLOG_ONLINE이 true. 이때는 브라우저 저장소를 쓰지 않는다 */
const ONLINE = !!window.BLOG_ONLINE;
function hasLocalPosts() {
  if (ONLINE) return false;
  try { return localStorage.getItem(STORE_KEY) !== null; } catch (e) { return false; }
}
function loadAll() {
  if (ONLINE) return migrate(JSON.parse(JSON.stringify(window.BLOG_POSTS || [])));
  try {
    const s = localStorage.getItem(STORE_KEY);
    if (s) return migrate(JSON.parse(s));
  } catch (e) { /* 저장소를 못 쓰면 posts.js 사용 */ }
  return migrate(JSON.parse(JSON.stringify(window.BLOG_POSTS || [])));
}
function migrate(posts) {
  posts.forEach(p => {
    if (CATEGORY_MIGRATE[p.category]) p.category = CATEGORY_MIGRATE[p.category];
    if (!p.site || !SITES[p.site]) p.site = 'selb';
  });
  return posts;
}
function saveAll(posts) {
  localStorage.setItem(STORE_KEY, JSON.stringify(posts));
}
function clearLocal() {
  try { localStorage.removeItem(STORE_KEY); } catch (e) {}
}
function byDateDesc(a, b) {
  return (b.date || '').localeCompare(a.date || '');
}
/* 지금 보고 있는 블로그의 글만 */
function sitePosts() {
  return loadAll().filter(p => siteOf(p) === SITE.id);
}
function publishedPosts() {
  return sitePosts().filter(p => p.status === 'published').sort(byDateDesc);
}

/* ---------- 유틸 ---------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function catLabel(id) {
  const c = CATEGORIES.find(c => c.id === id) || ALL_CATEGORIES.find(c => c.id === id);
  return c ? c.label : '기타';
}
function statusLabel(id) {
  const s = STATUSES.find(s => s.id === id);
  return s ? s.label : id;
}
function fmtDate(d) {
  return d ? d.replace(/-/g, '.') : '';
}
// 글에 보일 날짜 (현장 스케치처럼 달만 있는 글은 '2026.11')
function postDate(p) { return p.period || fmtDate(p.date); }
// '전체 글' 목록·추천글·함께 읽을 글에 넣을 글인가 (feed:false 카테고리는 빠짐)
function inFeed(p) { const c = CATEGORIES.find(c => c.id === p.category); return !(c && c.feed === false); }
function catOf(id) { return CATEGORIES.find(c => c.id === id) || null; }

/* 현장 스케치 카드 (격자 목록·홈 미리보기 공용) */
function sketchCard(p) {
  return `<a class="sk-card" href="${postUrl(p)}">
    <div class="sk-img">${p.thumbnail ? `<img src="${esc(p.thumbnail)}" alt="" loading="lazy">` : ''}
      ${p.photoCount ? `<span class="sk-count">사진 ${p.photoCount}</span>` : ''}</div>
    <div class="sk-body">
      <span class="sk-date">${esc(postDate(p))}</span>
      <h3>${esc(p.title)}</h3>
      ${(p.tags || []).length ? `<div class="sk-tags">${p.tags.slice(0, 3).map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
    </div>
  </a>`;
}
function readMinutes(body) {
  const len = (body || '').replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\s+/g, '').length;
  return Math.max(1, Math.round(len / 500));
}
function todayStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function makeSlug(title) {
  const base = (title || '').trim().toLowerCase()
    .replace(/[^0-9a-z가-힣\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
  return base || 'post-' + Date.now().toString(36);
}
function postUrl(p) {
  return 'post.html?slug=' + encodeURIComponent(p.slug);
}

/* 썸네일: 이미지가 없으면 카테고리 색 배경에 제목을 얹은 대체 이미지 */
function thumbHTML(p, extraClass) {
  const cls = 'thumb ' + (extraClass || '');
  if (p.thumbnail) {
    return `<div class="${cls}"><img src="${esc(p.thumbnail)}" alt="" loading="lazy"></div>`;
  }
  return `<div class="${cls} thumb-ph cat-${esc(p.category)}">
    <span class="ph-cat">${esc(catLabel(p.category))}</span>
    <span class="ph-title">${esc(p.title)}</span>
  </div>`;
}

/* 본문 렌더
   - format 'html': 글 관리의 에디터로 쓴 글. 위험한 내용을 걸러서 그대로 보여준다
   - 그 밖: 예전 마크다운 글 (img:아이디 치환) */
const EMBED_OK = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com|tv\.naver\.com)\//i;
function sanitizeHTML(html) {
  if (!window.DOMPurify) return '<p>' + esc(html.replace(/<[^>]*>/g, ' ')) + '</p>';
  if (!sanitizeHTML.hooked) {
    // 허용한 영상 사이트가 아닌 iframe은 지운다
    window.DOMPurify.addHook('uponSanitizeElement', (node, data) => {
      if (data.tagName === 'iframe' && !EMBED_OK.test(node.getAttribute('src') || '') && node.parentNode) node.parentNode.removeChild(node);
    });
    // 바깥 링크는 새 창으로
    window.DOMPurify.addHook('afterSanitizeAttributes', node => {
      const href = node.tagName === 'A' ? node.getAttribute('href') || '' : '';
      if (/^https?:/i.test(href) && !href.startsWith(location.origin)) { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener'); }
    });
    sanitizeHTML.hooked = true;
  }
  return window.DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target', 'controls', 'playsinline', 'preload'],
  });
}
function markdownToHTML(p) {
  const imgs = p.images || {};
  const md = (p.body || '').replace(/\]\(img:([a-z0-9]+)\)/gi, (m, id) => '](' + (imgs[id] || '') + ')');
  if (window.marked) return window.marked.parse(md, { breaks: true });
  return '<p>' + esc(md).replace(/\n/g, '<br>') + '</p>';
}
function renderBody(p) {
  if (p.format === 'html') return sanitizeHTML(p.body || '');
  return markdownToHTML(p);
}

/* ---------- 헤더 / 푸터 ---------- */
function logoHTML(s) {
  s = s || SITE;
  const markEl = s.logoMarkImg ? `<img class="logo-mark-img" src="${s.logoMarkImg}" alt="">` : `<span class="logo-mark">${s.logoMark}</span>`;
  const mark = s.logoImg ? `<img class="logo-img" src="${s.logoImg}" alt="${esc(s.brandName)}">` : `${markEl}${esc(s.brandName)} `;
  return `${mark}<b>${esc(s.logoSuffix || '블로그')}</b>`;
}
function linkAttrs(x) { return x.external ? ' target="_blank" rel="noopener"' : ''; }
function renderHeader(activeCat, activePage) {
  const el = document.getElementById('site-header');
  if (!el) return;
  const ex = SITE.navExtra;
  el.innerHTML = `
    <div class="wrap header-inner">
      <a class="logo" href="index.html">${logoHTML()}</a>
      <nav class="nav" aria-label="카테고리">
        ${ex ? `<a href="${ex.href}"${linkAttrs(ex)} class="${ex.page && activePage === ex.page ? 'active' : ''}">${ex.label}</a>
        <span class="nav-sep"></span>` : ''}
        <a href="index.html" class="${activePage === 'home' && !activeCat ? 'active' : ''}">전체 글</a>
        ${CATEGORIES.map(c => `<a href="index.html?cat=${c.id}" class="${c.id === activeCat ? 'active' : ''}">${c.label}</a>`
          + (SITE.navLinks || []).filter(l => l.after === c.id).map(l => `<a href="${l.href}"${linkAttrs(l)}>${l.label}</a>`).join('')).join('')}
      </nav>
      <a class="btn btn-primary header-cta" href="${esc(SITE.ctaUrl)}" target="_blank" rel="noopener">${esc(SITE.ctaText)}</a>
    </div>`;
}

function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `
    <div class="wrap footer-inner">
      <div>
        <div class="logo">${logoHTML()}</div>
        <p class="footer-tag">${esc(SITE.tagline)}</p>
      </div>
    </div>`;
}

function localNotice() {
  if (!hasLocalPosts()) return '';
  return `<div class="local-notice wrap">이 브라우저에 저장된 글로 보고 있습니다. 실제 사이트에 반영하려면 글 관리 페이지에서 <b>posts.js 내보내기</b>를 하세요.</div>`;
}

/* 편집기(SunEditor) 도구 막대를 휴대폰에서 옆으로 넘겨 쓸 때, 펼침 메뉴(문단 형식·크기·색 등)가
   넘긴 거리만큼 어긋나 열리는 것을 단추 바로 아래로 맞춘다 */
document.addEventListener('click', e => {
  const btn = e.target.closest && e.target.closest('.se-toolbar .se-btn-tray button');
  if (!btn) return;
  const tray = btn.closest('.se-btn-tray');
  if (!tray.scrollLeft) return;
  setTimeout(() => {
    const tb = btn.closest('.se-toolbar');
    tb.querySelectorAll('.se-list-layer').forEach(l => {
      if (l.style.display !== 'block') return;
      const box = l.offsetParent || tb;
      const left = btn.getBoundingClientRect().left - box.getBoundingClientRect().left;
      const max = box.clientWidth - l.offsetWidth;
      l.style.left = Math.max(0, Math.min(left, max)) + 'px';
    });
  }, 0);
}, true);
