// 나레이션 문장(wav)을 cues.json 시각에 배치해 한 트랙으로 만들고, 무음 영상과 합친다.
// 사용법: node mix_v4.cjs <무음영상.mp4> <출력.mp4> [음성폴더=leda_v4] [길이=29.5]
const fs = require('fs');
const { execFileSync } = require('child_process');
const FF = 'C:/Users/missb/AppData/Local/Temp/claude/56ee5e0c35754088/308ffb76-0545-4298-8def-b7e318829d3d/scratchpad/render/node_modules/ffmpeg-static/ffmpeg.exe';
const [video, out, dirName = 'leda_v4', dur = '29.5'] = process.argv.slice(2);
const dir = __dirname + '/' + dirName + '/';
const cues = JSON.parse(fs.readFileSync(__dirname + '/cues.json', 'utf8'));
const inputs = [], filters = [];
cues.forEach(([name, at], i) => {
  inputs.push('-i', dir + name + '.wav');
  const ms = Math.round(at * 1000);
  filters.push(`[${i}:a]aresample=48000,adelay=${ms}|${ms}[a${i}]`);
});
filters.push(`${cues.map((_, i) => `[a${i}]`).join('')}amix=inputs=${cues.length}:normalize=0:duration=longest,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,apad=whole_dur=${dur},atrim=0:${dur}[nar]`);
const track = dir + 'narration_full.wav';
execFileSync(FF, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', '[nar]', '-ac', '2', '-ar', '48000', track]);
console.log('트랙:', track);
if (video && out) {
  execFileSync(FF, ['-y', '-loglevel', 'error', '-i', video, '-i', track, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  console.log('완성:', out);
}
