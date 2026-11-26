# 大地图引擎源码（长片版，2026-11-24）

云端大地图线程容器里的完整工作目录，长片 nanjing1937_long.mp4 就是用这一版渲染的。

## 目录
- `web/engine.js`：引擎（Canvas2D）。横屏 `setSize`/`LAY`、3D 倾斜（`tiltBegin`/`tiltEnd`）、细海岸线、`ep.fine` 细战线、电影式字幕、`i_film` 历史影像、`i_barrage` 炮弹、`i_tracers` 曳光。
- `web/episodes/`：`ep1.js` `ep2.js` `ep3.js`（竖屏 Shorts）、`eplong.js`（长片，复用三集素材并重新定时）、`epthumb.js`（缩略图底图）、`long_map.json`（旧时间到长片时间的对照）。
- `web/assets/`：烘焙好的底图、水陆掩膜（`city_land.png` `big_land.png`）等。
- `web/vo/`：配音和逐词时间。`eplong.mp3` 和 `long.mp3` 是同一个文件（容器里是软链接，这里是副本）。
- `web/photos/` `web/fonts/`：照片和字体。
- `web/thumb_long.html`：长片缩略图合成页（`?v=a` 或 `?v=b`）。
- `render.mjs`：Playwright 逐帧渲染。`tools/render_long.sh`：长片分 3 段并行渲染再合并。`tools/build_long.py`：拼长片配音和时间对照。
- `tools/bake.py` `dem.py` `fields.py` `water_city.py` `world.py`：从 `data/` 烘焙底图和推进场到 `bake/`、`web/assets/`。
- `kit/` `kit.mjs`：给剪辑用的兵棋图标和字体包。

## 这里没有的两样东西
1. **`web/footage/`（历史影像逐帧图，230MB）。** 用 `tools/extract_footage.sh <mp4 所在目录>` 从本分支 `shorts/footage/long/` 的 mp4 重新抽帧（960×720，原始帧率）。
2. **`bake/city_elev.npy`（102MB，超过 GitHub 单文件上限）。** 只有重新烘焙推进场（`tools/fields.py`）才用到，由 `tools/bake.py` 从 `data/dem_city.npy` 生成。只渲染不需要它。

## 渲染
需要 Node、Playwright（Chromium）、ffmpeg、Python 3（numpy、Pillow）。

    node render.mjs long 30 0 20            # 渲染长片 0–20 秒
    node render.mjs long 30 --stills=143,200 # 出静帧
    CLEAN=1 node render.mjs thumb 30 --stills=2.2   # 无 HUD 的干净底图
    bash tools/render_long.sh               # 整部长片 -> out/nanjing1937_long.mp4

先建一个 `out/` 目录。
