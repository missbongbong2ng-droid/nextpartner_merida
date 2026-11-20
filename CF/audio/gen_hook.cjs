// 후킹 인물 대사 음성 생성 (보이스 스튜디오 배포본 /api/tts)
// 사용법: node gen_hook.cjs [A] [B] [C]
const fs = require('fs');
const { execFileSync } = require('child_process');
const FF = 'C:/Users/missb/AppData/Local/Temp/claude/56ee5e0c35754088/308ffb76-0545-4298-8def-b7e318829d3d/scratchpad/render/node_modules/ffmpeg-static/ffmpeg.exe';
const URL = 'https://merida-s-voice-studio.vercel.app/api/tts';
const LINES = {
  A: { voice: 'Algenib', text: '종이 명함 한 장으론 제 경력을 다 못 보여줘요. 홈페이지는 엄두가 안 나고요.' },
  B: { voice: 'Sulafat', text: '가게 일만으로도 벅찬데 홍보는 언제 하죠? 광고비도 부담돼요.' },
  C: { voice: 'Achird', text: '나를 어떻게 소개해야 할지 모르겠어요. 제 강점이 뭘까요?' },
};
const only = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  for (const [k, v] of Object.entries(LINES)) {
    if (only.length && !only.includes(k)) continue;
    const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: v.text, voice: v.voice, language: 'Korean' }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.audio) { console.log(k, '실패', res.status, body.error || ''); continue; }
    fs.writeFileSync(`hook_${k}.pcm`, Buffer.from(body.audio, 'base64'));
    execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', `hook_${k}.pcm`, `hook_${k}.wav`]);
    fs.unlinkSync(`hook_${k}.pcm`);
    console.log(k, v.voice, (fs.statSync(`hook_${k}.wav`).size / 48000).toFixed(2) + '초');
    await sleep(4000);
  }
})();
