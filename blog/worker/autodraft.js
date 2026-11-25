// 매일 자동 초안: SelB 소식·브랜드 카테고리에 Claude가 글을 써서 '초안'으로 저장한다
// - 이벤트, 고객 인터뷰·고객 이야기·후기(실제 인물 사례처럼 보이는 글)는 만들지 않는다
// - 홈페이지에 있는 사실만 쓰게 하고, 저장 전에 제목·이미지 주소를 다시 검사한다
// - 비밀값 ANTHROPIC_API_KEY 필요 (npx wrangler secret put ANTHROPIC_API_KEY)
import Anthropic from '@anthropic-ai/sdk';

export const AUTODRAFT_SITE = 'selb';
export const AUTODRAFT_CATS = {
  news: { label: '소식', desc: 'SelB 기능 소개, 활용 가이드, 사용 팁, 서비스 안내 (공지·업데이트 내역처럼 실제 일정·변경 사항이 필요한 글은 제외)' },
  brand: { label: '브랜드', desc: '셀프 브랜딩 노하우, 자기소개·홍보·네트워킹 팁, 일하는 사람을 위한 실용 가이드 (고객 사례·인터뷰·후기는 제외)' },
};
const DEFAULT_CONFIG = { enabled: true, categories: ['news', 'brand'] };
const BANNED_TITLE = /이벤트|경품|당첨|추첨|인터뷰|고객\s*이야기|고객\s*사례|후기|체험기|\[고객|사연/;

// SelB 홈페이지(pbaas.vercel.app)에서 확인한 사실 — 이 범위 밖의 기능·숫자·혜택은 쓰지 않는다
const FACTS = `
- SelB: AI 셀프 브랜딩 · AI 명함 서비스. 슬로건 "세상에 하나뿐인 나, 브랜드가 되다" (영문 "One and Only You. Become Your Brand.") / "나를 발견하고, 나만의 브랜드를 만들고, 세상에 알려요"
- 다섯 단계: Discover(나를 발견하기, 셀브와 대화) → Profile(나를 기록하기, 경험과 활동 정리) → AI Branding(나를 표현하기, 강점을 한 줄 소개로) → AI Business Card(나를 알리기, 명함과 개인 페이지) → Connect(사람과 잇기, 카톡·QR)
- AI '셀브'와 대화로 AI 명함을 만든다. 하는 일·일하는 곳부터 하나씩 물어본다. 대화 내용이 경력·활동·대표 성과·키워드로 프로필에 정리된다.
- 한 줄 소개는 셀브가 세 가지를 제안하고, 그중 고른 뒤 직접 수정해 저장할 수 있다.
- 셀카 한 장 → AI 프로필 사진(자세·방향·표정·배경 고르기). AI 프로필 사진 3장까지 무료.
- 만들기 · 건네기 · 받은 명함 모으기 무료. 가입은 카카오 · 네이버 · 이메일.
- 건네기: 카카오톡 · 문자 · 주소 복사(링크), 큰 QR, 잠금 화면 그림, NFC. 받는 분은 앱 설치·가입 없이 열고 연락처에 저장. 명함에 전화 · 문자 · 길찾기 · 저장 단추, SNS · 유튜브 연결.
- 내용을 고치면 이미 받은 분 화면에도 바로 바뀐다(다시 보낼 필요 없음). 주소는 /@내아이디 형태.
- 공유 통계: 공유 · 열림 · 저장 수를 본다.
- 이메일 서명 · 인쇄 파일 · 영문 명함으로도 활용.
- 받은 명함: 찍으면 AI가 읽어 담고 저장은 내가 확인, 상대 AI 명함은 QR로 받기, 받은 자리에서 메모 · 다음 연락할 날, 회사별로 보기, 하나로 합치기, 연달아 찍기, 바뀐 명함, 엑셀로 내려받기. 받은 명함은 나만 본다.
- 안전: 번호 · 이메일 암호화, 공개한 것만 검색에 노출, 탈퇴하면 AI 명함 · 받은 명함 · 사진이 함께 지워지고 건넨 링크도 열리지 않음.
- AEO · GEO: ChatGPT · Perplexity 같은 AI 검색이 읽고 언급하기 쉽게 공개한 AI 명함을 정리해 둔다(노출을 보장하지는 않는다).
- 이런 분께: 재직자, 소상공인(계산대 옆 QR, 전화·길찾기), 프리랜서 · 사회초년생(경력이 짧아도 관심·배우는 중으로), 은퇴 후(자문·강의·멘토링).
`;

// 본문에 쓸 수 있는 사진 (경로 → 설명). 이 목록 밖의 주소는 저장 전에 지운다
const IMAGES = {
  'assets/img/content/film/01-worries.jpg': '세 사람의 고민 말풍선(은퇴 후 강사, 동네 카페 사장님, 새 출발 프리랜서) · 가로',
  'assets/img/content/film/02-discover.jpg': '"세상에 하나뿐인 나, 브랜드가 되다." 슬로건 화면 · 가로',
  'assets/img/content/film/03-five-steps.jpg': '다섯 단계 카드(Discover·Profile·AI Branding·AI Business Card·Connect) · 가로',
  'assets/img/content/film/04-chat-profile.jpg': '셀브와 대화(왼쪽)하며 프로필이 채워지는 화면 · 가로',
  'assets/img/content/film/06-ai-photo.jpg': 'AI 한 줄 소개와 셀카→AI 프로필 사진 · 가로',
  'assets/img/content/film/07-ai-card.jpg': '완성된 AI 명함(사진·소개·키워드·QR) · 가로',
  'assets/img/content/film/08-shop-exp-career.jpg': '내 가게의·내 경험의·내 경력의 AI 명함 3장 · 가로',
  'assets/img/content/film/09-share.jpg': '카카오톡·문자·QR·링크 공유 선택과 받는 분 휴대폰 화면 · 가로',
  'assets/img/content/film/10-ai-search.jpg': 'AI 검색 답변에 AI 명함이 출처로 나오는 화면, AEO·GEO 설명 · 가로',
  'assets/img/content/film/11-closing.jpg': '"나를 알리는 AI 명함" 마무리 문구 · 가로',
  'assets/img/content/about-film-poster.jpg': '대화로 만들기 3단계 일러스트 · 4:3',
  'assets/img/content/features-film-poster.jpg': '"셀브가 묻는 대로 답만 했어요" 일러스트 · 4:3',
  'assets/img/content/for-film-poster.jpg': '영업 직원이 "명함 링크 바로 보내 드릴게요" 일러스트 · 4:3',
  'assets/img/content/clip-1.jpg': '셀브와 대화로 AI 명함 만들기 휴대폰 화면 · 세로',
  'assets/img/content/clip-2.jpg': '셀카 → AI 프로필 사진 휴대폰 화면 · 세로',
  'assets/img/content/clip-4.jpg': 'QR 보여 주기 휴대폰 화면 · 세로',
  'assets/img/content/clip-5.jpg': '받는 분이 보는 명함 화면(전화·문자·저장) · 세로',
  'assets/img/content/clip-6.jpg': '명함 정보 편집 화면 · 세로',
  'assets/img/content/gift-c-selfie.jpg': '창가에서 찍은 셀카 · 세로',
  'assets/img/content/profile_sky-front-basic.jpg': 'AI 프로필 사진 예시(하늘색 배경) · 세로',
  'assets/img/content/profile_white-front-arms-crossed.jpg': 'AI 프로필 사진 예시(흰 배경, 팔짱) · 세로',
  'assets/img/content/profile-sea.jpg': 'AI 프로필 사진 예시(바다 배경) · 세로',
  'assets/img/content/people_barista.jpg': '바리스타 인물 사진 · 세로',
  'assets/img/content/people_freelancer.jpg': '카메라를 든 프리랜서 인물 사진 · 세로',
  'assets/img/content/people_mentor.jpg': '노트를 쓰는 중년 멘토 인물 사진 · 세로',
  'assets/img/content/people_woodworker.jpg': '목공 장인 인물 사진 · 세로',
  'assets/video/steps/step1.jpg': '셀브 대화 창 장면 · 가로',
  'assets/video/steps/step4.jpg': '카톡·QR 공유 장면 · 가로',
};
const IMAGE_LIST = Object.entries(IMAGES).map(([k, v]) => `- ${k} : ${v}`).join('\n');

const SYSTEM = `당신은 SelB(AI 셀프 브랜딩 · AI 명함 서비스) 블로그의 전속 작가입니다. 블로그에 올릴 초안 한 편을 씁니다. 사람 편집자가 검토한 뒤 발행합니다.

[SelB에 대해 쓸 수 있는 사실 — 이것이 전부입니다]
${FACTS}
위 목록에 없는 SelB 기능, 메뉴 이름, 버튼 위치, 요금, 숫자, 출시 일정, 혜택은 쓰지 마세요. 출처를 댈 수 없는 통계·퍼센트·연구 결과도 쓰지 마세요.

[쓰지 않는 글]
- 이벤트·경품·프로모션 글
- 고객 인터뷰, 고객 이야기, 고객 사례, 후기, 체험기 — 실제 인물·회사·사례처럼 읽히는 글. 예시가 필요하면 "예를 들어 카페를 운영한다면"처럼 가정으로만 짧게 씁니다.
- 공지, 업데이트 내역처럼 실제 일정·변경 사항이 필요한 글

[분량과 구성]
- 본문 2,000~3,000자(HTML 태그 제외). 도입(독자의 상황·고민) → 소제목 4~6개 → 마무리(정리 + 오늘 해 볼 행동 하나).
- 표 1개 이상, 강조 박스(blockquote) 1개 이상, 본문 사진 2~3장.
- 바로 써먹을 수 있는 예시 문장, 비교표, 체크리스트, 단계별 방법을 넣습니다.
- 말투: "~해요/~입니다"를 섞은 친근한 존댓말. 과장·광고 문구 금지. 영어 남발 금지.
- SelB 연결은 글의 흐름에 맞게 자연스럽게, 주로 후반부에 합니다.

[본문 HTML 규칙]
- 쓸 수 있는 태그: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote><p>…</p></blockquote>, <table><thead><tr><th>…</th></tr></thead><tbody><tr><td>…</td></tr></tbody></table>, <hr>, <a href="…">.
- 사진은 태그 대신 한 줄에 [[IMG:경로|캡션]] 형식으로 넣습니다. 경로는 아래 목록에 있는 것만, 같은 사진은 한 번만.
- 블로그 안 링크는 서비스 소개 페이지 <a href="service.html">서비스 소개 페이지</a>만 씁니다.

[쓸 수 있는 사진]
${IMAGE_LIST}`;

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: '글 제목 (40자 안팎)' },
    summary: { type: 'string', description: '목록과 글 상단에 보이는 요약 1~2문장 (80~140자)' },
    tags: { type: 'array', items: { type: 'string' }, description: '태그 2~5개 (# 없이)' },
    thumbnail: { type: 'string', description: '대표 사진 경로 (사진 목록 중 하나, 가로 사진 권장)' },
    body_html: { type: 'string', description: '본문 HTML' },
    check_notes: { type: 'string', description: '편집자가 발행 전에 확인할 점 (없으면 빈 문자열)' },
  },
  required: ['title', 'summary', 'tags', 'thumbnail', 'body_html', 'check_notes'],
  additionalProperties: false,
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 본문 정리: 위험한 태그 제거 + [[IMG:…]] → 에디터 형식 사진 블록 (목록 밖 주소는 버림)
function finishBody(html) {
  let s = String(html || '');
  s = s.replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '').replace(/<(script|style|iframe|object|embed|form)[^>]*>/gi, '');
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/javascript:/gi, '');
  const used = new Set();
  s = s.replace(/(?:<p>\s*)?\[\[IMG:([^|\]]+)\|([^\]]*)\]\](?:\s*<\/p>)?/g, (m, path, cap) => {
    path = path.trim();
    if (!IMAGES[path] || used.has(path)) return '';
    used.add(path);
    const tall = /세로/.test(IMAGES[path]);
    return `<div class="se-component se-image-container __se__float-none"><figure style="margin: 0px auto;${tall ? ' width: 46%;' : ''}"><img src="${path}" alt="${esc(cap)}" data-align="center"${tall ? ' style="width: 100%;"' : ''}><figcaption>${esc(cap)}</figcaption></figure></div>`;
  });
  return s.trim();
}

const kstDay = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

export async function getAutodraftConfig(env) {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?1').bind('autodraft:' + AUTODRAFT_SITE).first().catch(() => null);
  const v = row ? JSON.parse(row.value) : {};
  return { ...DEFAULT_CONFIG, ...v, categories: (v.categories || DEFAULT_CONFIG.categories).filter(c => AUTODRAFT_CATS[c]) };
}
export async function getAutodraftLog(env) {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?1').bind('autodraft-log:' + AUTODRAFT_SITE).first().catch(() => null);
  return row ? JSON.parse(row.value) : [];
}
async function addLog(env, entry) {
  const log = await getAutodraftLog(env);
  log.unshift(entry);
  await env.DB.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = ?3')
    .bind('autodraft-log:' + AUTODRAFT_SITE, JSON.stringify(log.slice(0, 60)), Date.now()).run();
}

// 한 카테고리 초안 한 편 만들기 → { ok, postId, title } 또는 { ok:false, error }
export async function makeDraft(env, category, trigger) {
  const at = Date.now();
  try {
    if (!AUTODRAFT_CATS[category]) throw new Error('자동 초안을 만들 수 없는 카테고리예요: ' + category);
    if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY 비밀값이 없어요. npx wrangler secret put ANTHROPIC_API_KEY 로 넣어 주세요.');
    // 이미 다룬 주제 (모든 상태의 SelB 글)
    const { results } = await env.DB.prepare('SELECT data FROM posts').all();
    const existing = results.map(r => JSON.parse(r.data)).filter(p => (p.site || 'selb') === AUTODRAFT_SITE)
      .map(p => `- [${p.category}] ${p.title}${p.summary ? ' — ' + String(p.summary).slice(0, 70) : ''}`).join('\n');
    const cat = AUTODRAFT_CATS[category];
    const userMsg = `오늘(${kstDay()}) 올릴 '${cat.label}' 카테고리 초안을 한 편 써 주세요.
카테고리 성격: ${cat.desc}

[이미 있는 글 — 같은 주제·같은 각도는 피하고, 독자에게 새로운 도움이 되는 주제를 고르세요]
${existing}`;

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    let data = null, lastErr = '';
    for (let attempt = 0; attempt < 2 && !data; attempt++) {
      const stream = client.beta.messages.stream({
        model: 'claude-opus-5-5',
        max_tokens: 32000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'high', format: { type: 'json_schema', schema: SCHEMA } },
        system: SYSTEM,
        messages: [{ role: 'user', content: attempt ? userMsg + '\n\n주의: 이벤트·고객 사례·인터뷰·후기 성격이 아닌 주제로 다시 골라 주세요.' : userMsg }],
      });
      const msg = await stream.finalMessage();
      if (msg.stop_reason === 'refusal') { lastErr = '모델이 요청을 거절했어요'; continue; }
      if (msg.stop_reason === 'max_tokens') { lastErr = '글이 너무 길어 중간에 끊겼어요'; continue; }
      const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
      let d;
      try { d = JSON.parse(text); } catch (e) { lastErr = '응답 형식을 읽지 못했어요'; continue; }
      if (BANNED_TITLE.test(d.title)) { lastErr = '만들지 않기로 한 주제(이벤트·고객 사례 등)라 다시 썼어요: ' + d.title; continue; }
      data = d;
    }
    if (!data) throw new Error(lastErr || '초안을 만들지 못했어요');

    const body = finishBody(data.body_html);
    const textLen = body.replace(/<[^>]*>/g, '').length;
    const id = 'ad' + Math.random().toString(36).slice(2, 10);
    const notes = [
      `[자동 초안] ${new Date(at + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')} 생성 (${trigger === 'cron' ? '매일 자동' : '직접 실행'}) · 본문 ${textLen}자`,
      '발행 전에 내용·사실·사진을 확인해 주세요.',
      data.check_notes ? '⚠ 확인할 점: ' + data.check_notes : '',
    ].filter(Boolean).join('\n');
    const post = {
      id, site: AUTODRAFT_SITE, slug: '', slugAuto: true, title: String(data.title).slice(0, 120), category, status: 'draft', date: kstDay(),
      summary: String(data.summary || '').slice(0, 300), tags: (data.tags || []).slice(0, 6).map(t => String(t).replace(/^#/, '').slice(0, 20)),
      thumbnail: IMAGES[data.thumbnail] ? data.thumbnail : '', featured: false, ctaText: '', ctaUrl: '',
      memo: notes, body, format: 'html', images: {}, autoDraft: true,
    };
    await env.DB.prepare(`INSERT INTO posts (id, slug, status, category, date, featured, data, updated_at) VALUES (?1, '', 'draft', ?2, ?3, 0, ?4, ?5)`)
      .bind(id, category, post.date, JSON.stringify(post), Date.now()).run();
    await addLog(env, { at, trigger, category, ok: true, postId: id, title: post.title, chars: textLen });
    return { ok: true, postId: id, title: post.title };
  } catch (e) {
    const error = (e && e.message) || String(e);
    await addLog(env, { at, trigger, category, ok: false, error: error.slice(0, 300) }).catch(() => {});
    return { ok: false, error };
  }
}

// 매일 실행: 켜져 있으면 고른 카테고리마다 한 편씩
export async function runDaily(env) {
  const cfg = await getAutodraftConfig(env);
  if (!cfg.enabled) return [];
  const out = [];
  for (const c of cfg.categories) out.push(await makeDraft(env, c, 'cron'));
  return out;
}
