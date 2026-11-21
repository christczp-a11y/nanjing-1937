# Shorts assets (from the cloud big-map thread)

For the local sandbox renders of the three Nanjing Shorts. Coordinates are the sandbox frame (origin 118.78E 32.05N, metres, +x east, +z south).

## overlay/
Transparent HUD layer for episode 1's sandbox part (date, chapter tag, numbers, info cards, VS card, word-by-word captions), timed to the ElevenLabs VO.
- `ep1_overlay_39.4-112.webm`: VP9 with alpha, 72.6 s. Frame 0 = 39.4 s of the episode = first frame of sandbox shot 1-1. Lay it over the sandbox clips.
- `ep1_overlay_nocap_39.4-112.webm`: same without captions.
- `ep1_captions.srt`: sentence captions for the whole episode.
- The ProRes 4444 masters (.mov, 0.5-0.7 GB, too big for GitHub) are in the project files folder `nanjing-map/videos/v2/`.
- Note: Premiere does not read WebM alpha natively; DaVinci Resolve, CapCut, After Effects (with plugin) and ffmpeg do. Ask for a PNG sequence if needed.

## Episode 1 shot ranges (seconds, follow the VO)
| shot | in | out | on screen / VO cue |
|---|---|---|---|
| big map | 0 | 39.4 | dive into Nanjing at the end |
| 1-1 | 39.4 | 56.4 | whole city, 12-06 |
| 1-2 | 56.4 | 65.9 | wall flight; "Behind it is the river" 60.5 |
| 1-3 | 65.9 | 79.6 | dawn over the city (cards) |
| 1-4 | 79.6 | 96.0 | no running date on screen; gates X-ed as of 12-06 on "walls up the gates" 91.5; ferries leave on "sends the ferries upriver" 93.3 (tag: FERRIES SENT UPRIVER, DEC 9) |
| 1-5 | 96.0 | 112.0 | date back: DEC 8 outer line breaks (96-100), DEC 9 morning from 100.6; "seventy thousand" 101.9; turn to the river on "fourth side" 106.8 |

`handoff/ep1_handoff.json` has the camera at each in/out point (centre, view width, bearing; the centre sits at 44% of screen height).

## kit/
Unit pawns, NATO counters (inf / armor / mech / art x division / corps / army), tag styles and arrow look as transparent PNGs, plus the two fonts. Colours and use in `kit/README.md`. Use these for sandbox unit markers so they match the overlay.
