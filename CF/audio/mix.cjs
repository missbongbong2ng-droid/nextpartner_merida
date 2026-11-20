// 나레이션(03~16)과 후킹 인물 대사(hook_A·B·C)를 영상 타이밍에 배치해 트랙을 만들고, 무음 영상과 합친다.
// 사용법: NARR_DIR=<문장 wav 폴더/> node mix.cjs <무음영상.mp4> <출력.mp4>
const fs = require('fs');
const { execFileSync } = require('child_process');
const FF = 'C:/Users/missb/AppData/Local/Temp/claude/56ee5e0c35754088/308ffb76-0545-4298-8def-b7e318829d3d/scratchpad/render/node_modules/ffmpeg-static/ffmpeg.exe';
const [video, out] = process.argv.slice(2);
const html = fs.readFileSync(process.env.FILM_HTML || 'd:/AI/task/CF/pbaas_film_v6.html', 'utf8');
const dir = process.env.NARR_DIR || 'd:/AI/task/CF/audio/';
const hookDir = process.env.HOOK_DIR || 'd:/AI/task/CF/audio/';

// HTML의 타임라인 정의를 그대로 읽어 같은 계산을 한다
const KNOTS = eval(html.match(/const KNOTS = (\[[\s\S]*?\]);/)[1]);
const mapK = (v, a, b) => { for (let i = 1; i < KNOTS.length; i++) { const p = KNOTS[i - 1], q = KNOTS[i]; if (v <= q[a] || i === KNOTS.length - 1) return p[b] + (q[b] - p[b]) * (v - p[a]) / (q[a] - p[a]); } };
const o2n = to => mapK(to, 0, 1);
const OCUES = eval(html.match(/const OCUES = (\[[\s\S]*?\]);/)[1]);
const DURATION = +html.match(/const DURATION = ([\d.]+);/)[1];
const HK = eval(html.match(/const HK = (\[[\s\S]*?\]);/)[1]);

const clips = [];
const CUE_AT = eval('(' + html.match(/const CUE_AT = ({[^}]*});/)[1] + ')');
OCUES.forEach((c, i) => clips.push({ file: dir + String(i + 3).padStart(2, '0') + '.wav', at: CUE_AT[i + 3] ?? o2n(c[0]), tempo: +(process.env.NARR_TEMPO || 1) }));
['A', 'B', 'C'].forEach((k, i) => clips.push({ file: hookDir + `hook_${k}.wav`, at: HK[i].t0 + 1.0, optional: true, tempo: 1.08 }));

const inputs = [], filters = [];
let n = 0;
for (const c of clips) {
  if (!fs.existsSync(c.file)) { if (c.optional) { console.log('건너뜀(없음):', c.file); continue; } throw new Error('없음: ' + c.file); }
  inputs.push('-i', c.file);
  const ms = Math.round(c.at * 1000);
  filters.push(`[${n}:a]${c.tempo && c.tempo !== 1 ? `atempo=${c.tempo},` : ''}aresample=48000,adelay=${ms}|${ms}[a${n}]`);
  console.log(c.file.split('/').pop(), '→', c.at.toFixed(2) + '초');
  n++;
}
filters.push(`${[...Array(n).keys()].map(i => `[a${i}]`).join('')}amix=inputs=${n}:normalize=0:duration=longest,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,apad=whole_dur=${DURATION},atrim=0:${DURATION}[nar]`);
const track = dir + 'narration_full.wav';
execFileSync(FF, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', '[nar]', '-ac', '2', '-ar', '48000', track]);
console.log('트랙:', track);
if (video && out) {
  execFileSync(FF, ['-y', '-loglevel', 'error', '-i', video, '-i', track, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  console.log('완성:', out);
}
