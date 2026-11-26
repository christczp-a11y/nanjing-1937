#!/bin/bash
# Render the long film in 3 parallel chunks, join, mux the VO. -> out/nanjing1937_long.mp4
set -e
cd "$(dirname "$0")/.."
END=$(python3 -c "import json;print(json.load(open('web/episodes/long_map.json'))['meta']['duration'])")
A=$(python3 -c "e=$END;print(round(round(e/3*30)/30,4))"); B=$(python3 -c "e=$END;print(round(round(e*2/3*30)/30,4))")
echo "chunks: 0-$A $A-$B $B-$END"
NOAUDIO=1 node render.mjs long 30 0 $A > out/rl1.log 2>&1 &
NOAUDIO=1 node render.mjs long 30 $A $B > out/rl2.log 2>&1 &
NOAUDIO=1 node render.mjs long 30 $B $END > out/rl3.log 2>&1 &
wait
printf "file 'eplong_0-%s.mp4'\nfile 'eplong_%s-%s.mp4'\nfile 'eplong_%s-%s.mp4'\n" $A $A $B $B $END > out/rl_list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i out/rl_list.txt -i web/vo/long.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/nanjing1937_long.mp4
rm -f out/eplong_0-*.mp4 out/eplong_$A-*.mp4 out/eplong_$B-*.mp4 out/rl_list.txt
ffprobe -v error -show_entries format=duration,size -of csv=p=0 out/nanjing1937_long.mp4
