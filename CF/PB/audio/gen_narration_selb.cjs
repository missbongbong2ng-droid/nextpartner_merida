// v6 나레이션(03~16) 생성: 보이스 스튜디오 배포본 /api/tts + 톤 지시문
// 사용법: VOICE=Laomedeia OUT=laomedeia node gen_narration.cjs [03 04 ...]
const fs = require('fs');
const { execFileSync } = require('child_process');
const FF = 'C:/Users/missb/AppData/Local/Temp/claude/56ee5e0c35754088/308ffb76-0545-4298-8def-b7e318829d3d/scratchpad/render/node_modules/ffmpeg-static/ffmpeg.exe';
const URL = 'https://merida-s-voice-studio.vercel.app/api/tts';
const VOICE = process.env.VOICE || 'Laomedeia';
const OUT = (process.env.OUT || 'laomedeia') + '/';
const STYLE = 'Say this in a bright, cheerful, upbeat tone, as if smiling while speaking, like a friendly Korean TV commercial narrator: ';

const html = fs.readFileSync('d:/AI/task/CF/PB/selb_film_v14.html', 'utf8');
const OCUES = eval(html.match(/const OCUES = (\[[\s\S]*?\]);/)[1]);
const speak = s => s.replace(/AEO/g, '에이이오').replace(/GEO/g, '지이오').replace(/SelB/g, '셀브').replace(/셀브AI/g, '셀브 AI');
const jobs = OCUES.map((c, i) => ({ name: String(i + 3).padStart(2, '0'), text: speak(c[2]) }));
const only = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  for (const j of jobs) {
    if (only.length && !only.includes(j.name)) continue;
    let data;
    for (let a = 0; a < 4 && !data; a++) {
      const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: STYLE + j.text, voice: VOICE, language: 'Korean' }) });
      const b = await res.json().catch(() => ({}));
      if (res.ok && b.audio) data = b.audio; else { console.log(j.name, '재시도', res.status, b.error || ''); await sleep(15000); }
    }
    if (!data) { console.log(j.name, '실패'); continue; }
    const pcm = OUT + j.name + '.pcm';
    fs.writeFileSync(pcm, Buffer.from(data, 'base64'));
    execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm, OUT + j.name + '.wav']);
    fs.unlinkSync(pcm);
    console.log(j.name, (fs.statSync(OUT + j.name + '.wav').size / 48000).toFixed(2) + '초', j.text);
    await sleep(3000);
  }
})();
