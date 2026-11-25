// 무음 영상 + 나레이션 트랙 + BGM(원하는 구간)을 합친다. 나레이션이 나올 때 BGM은 자동으로 살짝 줄어든다(사이드체인).
// 사용법: node mix_bgm_v6.cjs <무음영상> <bgm.mp3> <BGM 시작초> <출력.mp4> [BGM음량=0.30] [길이=35.35] [페이드인초=0.3]
const { execFileSync } = require('child_process');
const FF = 'C:/Users/missb/AppData/Local/Temp/claude/56ee5e0c35754088/308ffb76-0545-4298-8def-b7e318829d3d/scratchpad/render/node_modules/ffmpeg-static/ffmpeg.exe';
const [video, bgm, ss, out, vol = '0.30', dur = '35.35', fin = '0.3'] = process.argv.slice(2);
const voice = __dirname + '/leda_v4/narration_full.wav';
const fadeSt = (+dur - 3.5).toFixed(2);
const fc = [
  `[2:a]aresample=48000,atrim=${ss}:${(+ss + +dur).toFixed(2)},asetpts=PTS-STARTPTS,afade=t=in:d=${fin},afade=t=out:st=${fadeSt}:d=3.5,volume=${vol}[bg]`,
  `[1:a]aresample=48000,asplit=2[v][key]`,
  `[bg][key]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=450[bgd]`,
  `[v][bgd]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]`,
].join(';');
execFileSync(FF, ['-y', '-loglevel', 'error', '-i', video, '-i', voice, '-i', bgm, '-filter_complex', fc,
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out]);
console.log('완성:', out);
