#!/bin/bash
# 사용법: bash mix_bgm.sh <bgm파일> <출력mp4>   (음성 트랙: laomedeia/narration_full.wav, 영상: v6_noaudio.mp4)
FF="C:/Users/missb/AppData/Local/Temp/claude/56ee5e0c35754088/308ffb76-0545-4298-8def-b7e318829d3d/scratchpad/render/node_modules/ffmpeg-static/ffmpeg.exe"
VIDEO="C:/Users/missb/AppData/Local/Temp/claude/56ee5e0c35754088/308ffb76-0545-4298-8def-b7e318829d3d/scratchpad/v6_noaudio.mp4"
VOICE="d:/AI/task/CF/audio/laomedeia/narration_full.wav"
DUR=105.6
BGM_VOL=${BGM_VOL:-0.30}
"$FF" -y -loglevel error -i "$VIDEO" -i "$VOICE" -i "$1" -filter_complex "\
[2:a]aresample=48000,atrim=0:$DUR,asetpts=PTS-STARTPTS,afade=t=in:d=1.2,afade=t=out:st=102.1:d=3.5,volume=$BGM_VOL[bg];\
[1:a]aresample=48000,asplit=2[v][key];\
[bg][key]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=450[bgd];\
[v][bgd]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]" \
-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "$2" && echo "완성: $2"
