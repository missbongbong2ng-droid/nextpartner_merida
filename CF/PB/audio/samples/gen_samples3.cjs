const fs = require('fs');
const { execFileSync } = require('child_process');
const FF = 'C:/Users/missb/AppData/Local/Temp/claude/56ee5e0c35754088/308ffb76-0545-4298-8def-b7e318829d3d/scratchpad/render/node_modules/ffmpeg-static/ffmpeg.exe';
const TEXT = 'Say this in a bright, cheerful, upbeat tone, as if smiling while speaking, like a friendly Korean TV commercial narrator: 나를 발견하고, 브랜드를 만들고, 세상에 알리는 AI 퍼스널 브랜딩, 파바스.';
const VOICES = { Laomedeia: '스마일_Laomedeia', Leda: '스마일_Leda', Pulcherrima: '스마일_Pulcherrima', Callirrhoe: '스마일_Callirrhoe' };
(async () => {
  for (const [v, tag] of Object.entries(VOICES)) {
    const res = await fetch('https://merida-s-voice-studio.vercel.app/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: TEXT, voice: v, language: 'Korean' }) });
    const b = await res.json().catch(() => ({}));
    if (!b.audio) { console.log(v, '실패', res.status, b.error || ''); continue; }
    fs.writeFileSync(`${v}.pcm`, Buffer.from(b.audio, 'base64'));
    execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', `${v}.pcm`, `${tag}.mp3`]);
    fs.unlinkSync(`${v}.pcm`);
    console.log(v, tag, '완료');
    await new Promise(r => setTimeout(r, 3000));
  }
})();
