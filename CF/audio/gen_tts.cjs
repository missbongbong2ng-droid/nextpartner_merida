// 보이스 스튜디오(배포본) /api/tts 로 나레이션 문장을 생성해 wav로 저장
const fs = require('fs');
const { execFileSync } = require('child_process');
const FF = 'C:/Users/missb/AppData/Local/Temp/claude/56ee5e0c35754088/308ffb76-0545-4298-8def-b7e318829d3d/scratchpad/render/node_modules/ffmpeg-static/ffmpeg.exe';
const URL = 'https://merida-s-voice-studio.vercel.app/api/tts';
const VOICE = process.env.VOICE || 'Zephyr';

const html = fs.readFileSync('d:/AI/task/CF/pbaas_film_v5.html', 'utf8');
const CUES = eval(html.match(/const CUES = (\[[\s\S]*?\]);/)[1]);
const speak = s => s.replace(/AEO/g, '에이이오').replace(/GEO/g, '지이오').replace(/PBaaS/g, '파바스');

const jobs = CUES.map((c, i) => ({ name: String(i + 1).padStart(2, '0'), text: speak(c[2]), slot: c[1] - c[0] }));
for (const i of [2, 15]) jobs.push({ name: jobs[i].name + '_파바스', text: jobs[i].text.replace(/피바스/g, '파바스'), slot: jobs[i].slot });
const only = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const report = [];
  for (const j of jobs) {
    if (only.length && !only.includes(j.name)) continue;
    let data;
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: j.text, voice: VOICE, language: 'Korean' }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.audio) { data = body.audio; break; }
      console.log(j.name, '재시도', res.status, body.error || '');
      await sleep(30000);
    }
    if (!data) { console.log(j.name, '실패'); continue; }
    fs.writeFileSync(`${j.name}.pcm`, Buffer.from(data, 'base64'));
    execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', `${j.name}.pcm`, `${j.name}.wav`]);
    fs.unlinkSync(`${j.name}.pcm`);
    const sec = fs.statSync(`${j.name}.wav`).size / 48000;
    const line = `${j.name}\t${sec.toFixed(2)}초 / 자리 ${j.slot.toFixed(1)}초 ${sec > j.slot ? '⚠ 넘침' : 'OK'}\t${j.text}`;
    console.log(line); report.push(line);
    await sleep(4000);
  }
  fs.writeFileSync('report.txt', report.join('\n'));
  console.log('완료');
})();
