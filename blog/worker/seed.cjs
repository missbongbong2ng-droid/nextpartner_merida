// posts.js의 글을 D1에 넣는 SQL 만들기
// 사용: node worker/seed.cjs > worker/seed.sql
//       npx wrangler d1 execute pbaas-blog-db --remote --file worker/seed.sql
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', 'posts.js'));
const q = s => "'" + String(s).replace(/'/g, "''") + "'";
const now = Date.now();
const lines = window.PBAAS_POSTS.map(p =>
  `INSERT OR REPLACE INTO posts (id, slug, status, category, date, featured, data, updated_at) VALUES (${[
    q(p.id), q(p.slug || ''), q(p.status || 'idea'), q(p.category || ''), q(p.date || ''),
    p.featured ? 1 : 0, q(JSON.stringify(p)), now,
  ].join(', ')});`);
process.stdout.write(lines.join('\n') + '\n');
