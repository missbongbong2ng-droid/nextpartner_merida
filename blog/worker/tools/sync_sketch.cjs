/* 모리아AI 홈페이지 도입사례(moriahai.com/cases)를 블로그 '현장 스케치' 글로 가져온다.
   다시 실행하면 새 사례·새 사진만 내려받고, 글은 같은 id(sk_<사례id>)로 덮어쓴다.
   사용: node worker/tools/sync_sketch.cjs <ffmpeg.exe> [out.sql]
   그 다음: npx wrangler d1 execute selb-blog-db --remote --file <out.sql> */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const FF = process.argv[2];
const OUT_SQL = process.argv[3] || path.join(__dirname, 'sketch.sql');
const ROOT = path.join(__dirname, '..', '..');
const IMG_DIR = path.join(ROOT, 'assets/img/moriahai/sketch');
const BS = String.fromCharCode(92);
const jpgSize = require('./jpgsize.cjs');

async function fetchCases() {
  const html = await (await fetch('https://moriahai.com/cases')).text();
  let flight = '';
  const re = /self\.__next_f\.push\((\[.*?\])\)<\/script>/gs; let m;
  while ((m = re.exec(html))) { try { const a = JSON.parse(m[1]); if (typeof a[1] === 'string') flight += a[1]; } catch (e) {} }
  const i = flight.indexOf('"cases":[') + 8; let d = 0, j = i;
  for (; j < flight.length; j++) {
    const c = flight[j];
    if (c === '"') { j++; while (flight[j] !== '"') { if (flight[j] === BS) j++; j++; } continue; }
    if (c === '[') d++; else if (c === ']') { d--; if (!d) break; }
  }
  return JSON.parse(flight.slice(i, j + 1));
}

// 홈페이지 내부 이름 → 블로그에 보일 서비스 이름
const SVC = {
  '이력서 자유 양식': 'AI 이력서 작성', '채팅형 이력서 작성': 'AI 이력서 작성',
  'OCR 문서 작성': '손글씨 이력서 변환', 'OCR + 증명사진': '손글씨 이력서 변환',
  '참여기업 안내+모의면접': ['참여기업 안내', '모의면접'], '자기소개서 분석': '자기소개서 분석',
  '채용 면접': '현장 채용 면접',
};
function services(list) {
  const out = [];
  for (const s of list) {
    const base = s.title.split(' · ')[0].replace(/\s*V\d+$/, '').trim();
    [].concat(SVC[base] || base).forEach(x => { if (!out.includes(x)) out.push(x); });
  }
  return out;
}
const tidy = s => String(s || '').replace(/\s+/g, ' ').replace('채용박림회', '채용박람회').trim();
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28) ? a : b; };

async function download(url, dest) {
  if (fs.existsSync(dest)) return;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const tmp = dest + '.src';
  fs.writeFileSync(tmp, buf);
  // 큰 사진(글 안·크게 보기)과 작은 사진(카드·갤러리)
  execFileSync(FF, ['-y', '-loglevel', 'error', '-i', tmp, '-vf', "scale='min(1440,iw)':-2", '-q:v', '4', dest]);
  execFileSync(FF, ['-y', '-loglevel', 'error', '-i', tmp, '-vf', "scale='min(560,iw)':-2", '-q:v', '5', dest.replace(/\.jpg$/, '_s.jpg')]);
  fs.unlinkSync(tmp);
}
async function pool(tasks, n) { let k = 0; await Promise.all(Array.from({ length: n }, async () => { while (k < tasks.length) await tasks[k++](); })); }

(async () => {
  const cases = await fetchCases();
  console.log('사례', cases.length);
  const tasks = [];
  for (const c of cases) {
    fs.mkdirSync(path.join(IMG_DIR, c.id), { recursive: true });
    c.photos.forEach((p, i) => tasks.push(() => download(p.url, path.join(IMG_DIR, c.id, String(i + 1).padStart(2, '0') + '.jpg'))));
  }
  let done = 0; const total = tasks.length;
  await pool(tasks.map(t => async () => { await t(); if (++done % 25 === 0) console.log('사진', done, '/', total); }), 6);

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const perMonth = {};
  const sql = [];
  cases.forEach((c, idx) => {
    const [y, mo] = (c.period.match(/(\d{4})\.\s*(\d{1,2})/) || []).slice(1);
    const key = y + mo; perMonth[key] = (perMonth[key] || 0) + 1;
    const date = `${y}-${mo.padStart(2, '0')}-${String(29 - perMonth[key]).padStart(2, '0')}`; // 같은 달 안에서는 홈페이지 순서대로
    const name = tidy(c.name);
    const svc = services(c.services);
    // 현장 스케치는 사진만: 쓴 솔루션은 적지 않고 시기·행사명만
    const summary = `${y}년 ${Number(mo)}월, ${name} 현장 사진 ${c.photos.length}장`;
    const dir = `assets/img/moriahai/sketch/${c.id}/`;
    let photos = c.photos.map((_, i) => String(i + 1).padStart(2, '0'));
    // 표지는 첫 장(대개 행사 포스터), 사진 순서는 홈페이지 그대로
    const body = [
      // 요약은 글 머리에 이미 보이므로 본문은 정보 + 사진만
            `<div class="sketch-gallery">${photos.map((n, i) => `<a href="${dir}${n}.jpg"><img src="${dir}${n}_s.jpg" alt="${esc(name)} 현장 사진 ${i + 1}" loading="lazy"></a>`).join('')}</div>`,
    ].join('');
    const post = {
      id: 'sk_' + c.id, site: 'moriahai', category: 'sketch', status: 'published', format: 'html',
      title: name, slug: 'sketch-' + c.id.toLowerCase(), date, period: `${y}.${mo.padStart(2, '0')}`,
      summary, tags: [], thumbnail: dir + photos[0] + '_s.jpg', photoCount: photos.length,
      featured: false, body, images: {}, memo: '모리아AI 홈페이지 도입사례에서 자동으로 가져온 글 (worker/tools/sync_sketch.cjs)', source: 'https://moriahai.com/cases',
    };
    const q = s => "'" + String(s).replace(/'/g, "''") + "'";
    sql.push(`INSERT INTO posts (id, slug, status, category, date, featured, data, updated_at) VALUES (${q(post.id)}, ${q(post.slug)}, 'published', 'sketch', ${q(date)}, 0, ${q(JSON.stringify(post))}, ${Date.now() - idx}) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, status=excluded.status, category=excluded.category, date=excluded.date, data=excluded.data, updated_at=excluded.updated_at;`);
  });
  fs.writeFileSync(OUT_SQL, sql.join('\n') + '\n');
  console.log('SQL', OUT_SQL, sql.length, '건');
})();
