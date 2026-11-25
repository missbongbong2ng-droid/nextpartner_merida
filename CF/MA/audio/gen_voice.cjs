// 나레이션 문장별 음성 생성 (보이스 스튜디오 /api/tts), 앞뒤 무음 잘라 wav로 저장
// 사용법: VOICE=Leda node gen_voice.cjs [n01 n02 ...]
const fs = require('fs');
const { execFileSync } = require('child_process');
const FF = 'C:/Users/missb/AppData/Local/Temp/claude/56ee5e0c35754088/308ffb76-0545-4298-8def-b7e318829d3d/scratchpad/render/node_modules/ffmpeg-static/ffmpeg.exe';
const URL = 'https://merida-s-voice-studio.vercel.app/api/tts';
const VOICE = process.env.VOICE || 'Leda';
const OUT = __dirname + '/' + (process.env.OUT || VOICE.toLowerCase()) + '/';
const STYLE = 'Say this in a bouncy, playful, energetic young female voice, punchy and crisp like a snappy Korean TV commercial, quick and lively with a smile: ';
const speak = s => s.replace(/모리아AI/g, '모리아 에이아이').replace(/AI/g, '에이아이');
const cues = JSON.parse(fs.readFileSync(__dirname + '/cues.json', 'utf8'));
const only = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  for (const [name, , text] of cues) {
    if (only.length && !only.includes(name)) continue;
    let data;
    for (let a = 0; a < 4 && !data; a++) {
      const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: STYLE + speak(text), voice: VOICE, language: 'Korean' }) });
      const b = await res.json().catch(() => ({}));
      if (res.ok && b.audio) data = b.audio; else { console.log(name, '재시도', res.status, b.error || ''); await sleep(15000); }
    }
    if (!data) { console.log(name, '실패'); continue; }
    const pcm = OUT + name + '.pcm';
    fs.writeFileSync(pcm, Buffer.from(data, 'base64'));
    // 앞뒤 무음 제거
    execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm,
      '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', OUT + name + '.wav']);
    fs.unlinkSync(pcm);
    console.log(name, ((fs.statSync(OUT + name + '.wav').size - 78) / 48000).toFixed(2) + '초', text);
    await sleep(2500);
  }
})();
