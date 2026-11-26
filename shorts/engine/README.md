# 南京 1937 双色大地图（三集 Shorts 底座）

云端做的，可在任何电脑上跑，不占沙盘。竖版 1080x1920，30 fps。

## 怎么看、怎么出片
- 预览：在本目录 `npx http-server web -p 8080`（或任何静态服务器），浏览器开 `http://localhost:8080/index.html?ep=1`。拖进度条看。`&debug=1` 显示镜头参数和 y=1561 字幕线，`&handoff=1` 显示沙盘镜头占位。
- 出片：`node render.mjs 1`（第 1 集整条，输出 out/ep1.mp4）；`node render.mjs 2 30 60 75` 只渲 60–75 秒；`node render.mjs 3 30 --stills=10,20,30` 只出几张图。需要 Node 和 Playwright（Chromium）。
- 同时写出 `out/ep<N>_handoff.json`：大地图把画面交给沙盘、再接回来的那一刻的机位。

## 改剧本时改哪里
每集一个文件：`web/episodes/ep1.js`、`ep2.js`、`ep3.js`。全是时间轴，旁白录好后按实际秒数改 `t` / `t0` / `t1` 即可。
- `cam`：镜头关键帧。`x, z` 是画面中心（沙盘坐标，米，+x 东、+z 南），`w` 是画面宽多少米，`rot` 是画面上方朝哪个罗盘方向（0=北）。两帧之间自动平滑推拉（van Wijk 曲线，加速、匀速、减速）。`hold: true` 表示停住。
- `story`：故事时间（驱动红蓝范围和左上角日期）。`clock` 时段显示几点几分。`dark` 夜色。
- `phases`：左上角红色阶段标签。
- `items`：画面上的东西。类型：`label` 钉在地点的短标签（style jp 红 / cn 蓝 / dark 黑 / light 白），`place` 地名，`counter` 跳动数字（`steps` 换文字，`final` 落定文字），`arrow` 推进箭头（会长出来、可变细），`line` 虚线，`units` 部队点（可移动、可熄灭），`scatter` 平民白点（可从城里流进安全区），`ring` 光圈，`gateX` 城门打叉（`keep` 留一个亮着），`breach` 城墙破口，`icon` 飞机/船（可沉），`card` 照片卡片，`portrait` 圆头像，`area` 安全区轮廓，`fires` 按日期烧城，`panel` 全屏数字对比，`title` 结尾字，`handoff` 沙盘镜头位置。
- 地点可以写坐标 `[x, z]`、沙盘地名 id（如 `'g-zhonghua'`、`'lm-meitan'`，见 assets/world.json 的 places），或 `'gate:yijiang'`。

## 照片
放进 `web/photos/`，文件名和剧本里 `img` 一致就会自动显示（灰度），没有的显示灰色占位卡。目前全部是占位：
tang_shengzhi.jpg, chiang_kaishek.jpg, shanghai_1937.jpg, guanghua_gate_dec13.jpg, zhongshan_gate_damaged.jpg, panay_sinking.jpg, safety_zone_committee.jpg, john_rabe.jpg, matsui_iwane.jpg, nanjing_wall_today.jpg

## 照片卡片和沙盘镜头（两种都支持）
每集有一段 `type: 'handoff'`：默认在大地图上钉一张大照片卡片（第 1 集城墙航拍、第 2 集 12-12 南门、第 3 集 12-17 入城式）。
需要切沙盘镜头时，不用改地图：大地图和沙盘是同一套坐标（原点 118.78E 32.05N，+x 东、+z 南），`out/ep*_handoff.json` 给出交接那一刻的画面中心 `centre_x, centre_z`、画面宽 `view_width_m`、画面上方朝向 `bearing_up_deg`（画面中心在画面高度 44% 处）。沙盘从同一个正俯视机位降下去，回来时升回同一个机位，大地图接着走。想换位置就改该集 `cam` 里那两行的 `x, z, w, rot`。`?handoff=1` 预览时用黑底占位标出沙盘镜头的位置。
任何一段都可以加 handoff，切不切沙盘由剧本定。

## 数据从哪来
- 华东大图：Natural Earth（公有领域）海岸线、湖、长江；高程 AWS Terrain Tiles（SRTM 等，公开）。
- 南京城防图：沙盘的江岸 banks.json、backdrop_water.json、城墙 wall.json、地名 places.json、烧城 timeline.json；高程同上。
- 占领时间：`assets/field_seeds.json` 列了每个种子点的时间和等级。南京一级的时间多数出自 FACT_DIGEST（S），华东各城镇的陷落日期多为我按常见说法填的，标「推测」，只决定红色怎么铺过去，不上屏、不进旁白。
- 屏幕上的数字一律按 SHORTS_3_v5.md 的数字表（出自 FACT_DIGEST）。

## 已知限制
- 第 3 集 Panay 的位置是按「上游约 28 英里」估的，标推测。
- 华东一级的红色是平滑示意，不是逐日战线图。
- 所有照片和头像是占位。
