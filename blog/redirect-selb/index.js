// selb-blog 주소(잠시 쓰였던 주소)로 들어오면 원래 주소(pbaas-blog)로 돌려보낸다.
// 브라우저가 예전 '영구 이동'(pbaas-blog → selb-blog)을 기억하고 있어도 무한 반복되지 않도록
// 주소 끝에 표시(r=1)를 붙여 다른 주소로 보낸다. 이 응답은 임시(302)·저장 안 함.
const TO = 'https://pbaas-blog.petsitter-moriah.workers.dev';
const SLUGS = { 'selb-launch': 'pbaas-launch', 'news-selb-chat': 'news-pibi-chat', 'selb-service-guide': 'pbaas-service-guide' };
export default {
  fetch(req) {
    const u = new URL(req.url);
    const s = u.searchParams.get('slug');
    if (SLUGS[s]) u.searchParams.set('slug', SLUGS[s]);
    u.searchParams.set('r', '1');
    return new Response(null, { status: 302, headers: { Location: TO + u.pathname + u.search, 'Cache-Control': 'no-store' } });
  },
};
