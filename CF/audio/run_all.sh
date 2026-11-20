#!/bin/bash
# 결제 반영될 때까지 1분 간격 재시도 → 전체 생성 → 영상 합치기
cd /d/AI/task/CF/audio
mkdir -p autonoe
for i in $(seq 1 20); do
  rm -f hook_A.wav
  node gen_hook.cjs A
  [ -f hook_A.wav ] && break
  echo "대기 중 ($i/20)"; sleep 60
done
[ -f hook_A.wav ] || { echo "20분 동안 계속 거절됨"; exit 1; }
node gen_hook.cjs B C
VOICE=Autonoe node gen_tts.cjs 03 04 05 06 07 08 09 10 11 12 13 14 15 16 03_파바스 16_파바스
for f in 0[3-9].wav 1[0-6].wav 03_파바스.wav 16_파바스.wav; do [ -f "$f" ] && mv "$f" autonoe/; done
ls autonoe hook_*.wav
NARR_DIR="d:/AI/task/CF/audio/autonoe/" node mix.cjs "C:/Users/missb/AppData/Local/Temp/claude/56ee5e0c35754088/308ffb76-0545-4298-8def-b7e318829d3d/scratchpad/v6_noaudio.mp4" "d:/AI/task/CF/output/PBaaS_brand_film_v6_1080p.mp4"
