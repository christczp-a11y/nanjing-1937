#!/bin/bash
# Rebuild web/footage/<clip>/0001.jpg... (30 fps, 960x720) from the source clips.
# usage: tools/extract_footage.sh <dir with the mp4s, e.g. ../footage/long>
set -e
cd "$(dirname "$0")/.."
for c in 1937-08_shanghai_naval_shelling_battle_of_china 1937-11_hangzhou_bay_landing_advance_battle_of_china 1937-12-12_panay_last_moments_universal 1937-12-12_panay_under_air_attack_universal 1937-12-13_japanese_troops_at_nanking_gate_battle_of_china 1937-12_japanese_guns_approach_nanking_battle_of_china 1937-12_nanking_wall_assault_battle_of_china 1937_shanghai_city_burning_battle_of_china; do
  mkdir -p web/footage/$c
  ffmpeg -y -loglevel error -i "$1/$c.mp4" -fps_mode passthrough -vf "scale=960:720" -q:v 3 web/footage/$c/%04d.jpg
done
