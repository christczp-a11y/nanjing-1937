// Episode 2 (Mon 11-23): the defence — four days. Timed to the ElevenLabs VO (vo/ep2.mp3, 100.1 s), 11-22.
// All on the big map / city layer (no sandbox for the Shorts).
import { ll } from '../engine.js';
const GH = [2902, 2949], ZS = [3986, 985], ZH = [-319, 3996], PM = [6328, -2218], YH = [-434, 5655], TP = [2641, -1120], YJ = [-3634, -4288];
export default {
  duration: 105, final: true,
  vo: 'ep2',
  cam: [
    { t: 0, x: 600, z: 700, w: 21000 },
    { t: 10.9, x: 700, z: 800, w: 19500 },
    { t: 16.2, x: 900, z: 1000, w: 20500 },
    { t: 18.0, x: 2750, z: 2700, w: 5600 },                 // SE gate
    { t: 27.0, x: 2850, z: 2800, w: 5000 },
    { t: 29.0, x: 5000, z: -600, w: 10500 },                // the mountain
    { t: 41.4, x: 4800, z: -400, w: 10000 },
    { t: 43.0, x: -300, z: 5000, w: 7600 },                 // the southern hill
    { t: 49.4, x: -350, z: 4800, w: 7000 },
    { t: 50.9, x: -320, z: 4150, w: 3800 },                 // the south gate breaks
    { t: 52.6, x: -300, z: 4100, w: 3600 },
    { t: 55.0, x: 1800, z: -600, w: 19500 },                // the breakout east
    { t: 66.6, x: 1600, z: -500, w: 19000 },
    { t: 68.8, x: -4200, z: -5000, w: 9800 },               // the river gate and the river
    { t: 85.6, x: -4500, z: -5300, w: 9200 },
    { t: 88.5, x: 300, z: 300, w: 20500 },
    { t: 105, x: 300, z: 300, w: 19500 },
  ],
  story: [
    { t: 0, d: '12-09 08:00' }, { t: 9.3, d: '12-10 12:00', ease: 'linear' }, { t: 10.9, d: '12-10 13:00' },
    { t: 27.6, d: '12-10 18:00', ease: 'linear' }, { t: 41.9, d: '12-11 18:00', ease: 'linear' }, { t: 49.9, d: '12-12 12:00', ease: 'linear' },
    { t: 52.4, d: '12-12 17:00', ease: 'linear' }, { t: 67.2, d: '12-12 21:00', ease: 'linear' }, { t: 86.4, d: '12-13 03:00', ease: 'linear' },
    { t: 97.5, d: '12-13 06:00', ease: 'linear' }, { t: 103, d: '12-13 18:00', ease: 'linear' },
  ],
  clock: [[0, 97.5]],
  legend: [[0.3, 2.6]],
  dark: [{ t: 0, v: 0 }, { t: 52.4, v: 0 }, { t: 58, v: .8 }, { t: 96.5, v: .8 }, { t: 99.5, v: .15 }],
  hideDate: [[0, 2.7]],
  phases: [
    { t0: 0.5, t1: 10.7, text: 'THE ULTIMATUM' }, { t0: 10.9, t1: 16.7, text: 'GENERAL ASSAULT' }, { t0: 16.9, t1: 27.5, text: 'THE SOUTH-EAST GATE' },
    { t0: 27.7, t1: 41.9, text: 'THE MOUNTAIN' }, { t0: 42.1, t1: 49.8, text: 'THE SOUTHERN HILL' }, { t0: 50.0, t1: 52.3, text: 'THE TWELFTH' },
    { t0: 52.5, t1: 67.2, text: 'THE BREAKOUT' }, { t0: 67.4, t1: 86.4, text: 'THE RIVER' }, { t0: 86.6, t1: 100.2, text: 'THE COUNT' },
  ],
  shake: [[18.9, 19.6, 5], [51.2, 52.0, 7], [73.6, 74.4, 4]],
  items: [
    // defenders inside the wall; some go dark on the mountain and the southern hill
    { type: 'units', t0: 0, t1: 66, side: 'cn', r: 11, dots: [[-300, 3700], [900, 3500], [1600, 2500], [2700, 2700], [3700, 1000], [2500, -1000], [200, -2400], [-1600, 1900], [-2500, 0], [500, 1000],
      { at: [-700, 5500], out: 47.3 }, { at: [-200, 5800], out: 47.8 }, { at: [-500, 5300], out: 48.3 }, { at: [100, 5500], out: 48.8 }, { at: [5600, -2000], out: 36.2 }, { at: [6300, -2400], out: 37.4 }] },

    // 0–10.9 the ultimatum
    { type: 'icon', kind: 'plane', t0: 2.6, t1: 8.6, path: [[11000, 4000], [-11000, -3000]], side: 'jp', size: 1.4 },
    { type: 'icon', kind: 'plane', t0: 3.2, t1: 9.2, path: [[11000, 6000], [-11000, -1000]], side: 'jp', size: 1.4 },
    { type: 'card', t0: 0.6, t1: 3.5, screen: [760, 820], w: 300, h: 486, img: 'ep2_guns_dec9.jpg', caption: 'Closing in · Dec 1937', credit: 'Asahi Shimbun · public domain' },
    { type: 'info', t0: 3.6, t1: 10.6, screen: [540, 1200], side: 'jp', badge: 'JAPAN', portrait: 'matsui_face.jpg', title: 'THE ULTIMATUM', sub: 'Dropped on the city · 9 Dec 1937', rowT: [6.4, 9.3],
      rows: [['Deadline', 'Surrender by noon, 10 Dec', true], ['Chinese answer', 'None']] },
    { type: 'label', t0: 9.4, t1: 10.8, screen: [540, 640], at: [0, 0], layer: 'hud', text: 'NO REPLY', size: 72, style: 'jp', pin: false },

    // 10.9–16.8 general assault on a 14th-century wall
    { type: 'arrow', t0: 11.0, t1: 17.5, path: [[10500, 400], [7500, 700], [4300, 950]], side: 'jp', grow: 1.6, wpx: 50 },
    { type: 'arrow', t0: 11.2, t1: 17.5, path: [[9500, 8500], [6000, 5500], [3200, 3200]], side: 'jp', grow: 1.6, wpx: 50 },
    { type: 'arrow', t0: 11.4, t1: 17.5, path: [[-600, 10000], [-500, 7200], [-350, 4300]], side: 'jp', grow: 1.6, wpx: 50 },
    { type: 'blasts', t0: 11.3, t1: 17, at: [1500, 2500], radius: 6500, n: 28, seed: 21, scale: .8 },
    { type: 'counter', t0: 12.5, t1: 13.9, screen: [540, 730], from: 0, to: 70000, dur: 1.0, prefix: '~', size: 120, color: 'jp', caption: 'JAPANESE TROOPS ATTACK', note: '1 pm · 10 December' },
    { type: 'card', t0: 11.2, t1: 13.9, screen: [540, 1120], w: 520, h: 368, img: 'ep2_artillery_dec10.jpg', caption: 'Purple Mountain guns · 10 Dec 1937', credit: 'Public domain' },
    { type: 'wallGlow', t0: 14.0, t1: 16.8, dur: 2.2 },
    { type: 'counter', t0: 14.0, t1: 16.8, screen: [540, 730], steps: [[0, '1366–1393']], size: 130, caption: 'WALL BUILT', note: 'Ming dynasty · 35 km around the city' },

    // 16.9–27.5 the south-east gate
    { type: 'ring', t0: 17.2, t1: 27.4, at: GH, rpx: 70, color: '#ffd24d' },
    { type: 'label', t0: 17.4, t1: 21, at: GH, text: 'GUANGHUA GATE', dy: -110, size: 34, style: 'dark' },
    { type: 'blasts', t0: 18.8, t1: 21, at: GH, radius: 260, n: 10, seed: 3, scale: 1.2 },
    { type: 'breach', t0: 18.9, t1: 105, at: [2950, 3010], rpx: 22 },
    { type: 'arrow', t0: 20.8, t1: 27.4, path: [[3900, 3900], [3200, 3200], [2750, 2820]], side: 'jp', grow: 1.4, wpx: 40, text: '2 COMPANIES', tsize: 30, tdy: 70 },
    { type: 'label', t0: 22.6, t1: 24.1, screen: [540, 1230], at: [0, 0], layer: 'hud', text: 'TRAPPED INSIDE THE GATE', size: 48, style: 'jp', pin: false },
    { type: 'counter', t0: 24.2, t1: 27.4, screen: [540, 730], steps: [[0, '88'], [1.1, '60'], [1.5, '30'], [2.0, '8']], size: 150, color: 'jp', caption: 'MEN IN ONE JAPANESE COMPANY', note: '80 of 88 lost in the breach' },

    // 27.7–41.9 the mountain
    { type: 'place', t0: 28.2, t1: 41.6, at: PM, text: 'PURPLE MOUNTAIN', size: 34 },
    { type: 'ring', t0: 30.4, t1: 36, at: 'lm-sun-mausoleum', rpx: 60, color: '#ffd24d' },
    { type: 'label', t0: 30.4, t1: 37.6, at: 'lm-sun-mausoleum', text: 'DO NOT SHELL', sub: "Sun Yat-sen's tomb", dy: 110, size: 36, style: 'light' },
    { type: 'arrow', t0: 35.8, t1: 41.6, path: [[11500, -3800], [9500, -3300], [7800, -2700], [6500, -2250]], side: 'jp', grow: 2.4, wpx: 42, text: 'RIDGE BY RIDGE', tsize: 30, tdy: -60 },
    { type: 'line', t0: 38.8, t1: 41.6, path: [PM, [5600, -500], [4100, 900]], color: '#ff6b4a', width: 8, dash: [18, 12], head: true, grow: 1.2 },
    { type: 'blasts', t0: 39.8, t1: 41.8, at: ZS, radius: 500, n: 12, seed: 5, scale: 1.0 },
    { type: 'label', t0: 39.4, t1: 41.6, at: [4100, 900], text: 'GUNS ON THE WALL', dy: 90, size: 34, pin: false },

    // 42.1–49.8 the southern hill
    { type: 'place', t0: 42.3, t1: 49.6, at: YH, text: 'YUHUATAI', size: 34, align: 'right' },
    { type: 'arrow', t0: 42.8, t1: 49.6, path: [[-500, 9800], [-450, 7800], [-430, 6000]], side: 'jp', grow: 1.6, wpx: 56 },
    { type: 'counter', t0: 43.6, t1: 46.9, screen: [540, 730], from: 0, to: 40000, dur: 1.0, prefix: '~', size: 120, color: 'jp', caption: 'MEN SENT AGAINST ONE HILL', note: "two divisions' total strength" },
    { type: 'label', t0: 44.7, t1: 49.6, at: YH, text: '2 DAYS', dy: -150, size: 60, pin: false },
    { type: 'blasts', t0: 43.5, t1: 49, at: YH, radius: 900, n: 22, seed: 11, scale: .9 },
    { type: 'label', t0: 47.1, t1: 49.7, screen: [540, 1230], at: [0, 0], layer: 'hud', text: 'ALMOST NOBODY CAME DOWN', size: 48, style: 'dark', pin: false },

    // 50.0–52.4 the wall breaks (south gate, 12 Dec noon)
    { type: 'ring', t0: 50.2, t1: 54, at: ZH, rpx: 80, color: '#ff6b4a' },
    { type: 'blasts', t0: 50.9, t1: 53, at: ZH, radius: 300, n: 14, seed: 7, scale: 1.3 },
    { type: 'breach', t0: 51.2, t1: 105, at: [-180, 3990], rpx: 26 },
    { type: 'breach', t0: 51.6, t1: 105, at: [4010, 1215], rpx: 26 },
    { type: 'stamp', t0: 51.2, t1: 52.6, screen: [540, 640], text: 'THE WALL BREAKS', size: 110 },
    { type: 'card', t0: 50.4, t1: 52.9, screen: [760, 1130], w: 420, h: 390, img: 'ep2_zhonghua_blast_dec12.jpg', caption: 'Zhonghua Gate · 12 Dec 1937', credit: 'Asahi Shimbun · public domain' },

    // 52.5–67.2 the breakout
    { type: 'info', t0: 53.0, t1: 59.6, screen: [540, 1200], side: 'cn', badge: 'ORDER', portrait: 'tang_c1935.jpg', title: 'TANG SHENGZHI', sub: '5 pm · 12 December', rowT: [55.2, 56.7],
      rows: [['To the whole army', 'Get out', true], ['How', '“Break through the enemy”']] },
    { type: 'arrow', t0: 59.9, t1: 66.8, path: [TP, [4200, -2000], [6000, -3500], [8800, -5200]], side: 'cn', grow: 3.2, wpx: 46, thin: .4, thinAt: 3.8, thinDur: 2.0 },
    { type: 'counter', t0: 59.9, t1: 66.8, screen: [540, 730], from: 0, to: 12500, dur: 1.0, final: '3,000–4,000 GOT THROUGH', finalDelay: 3.8, size: 104, color: 'cn', caption: 'BREAK OUT EAST, IN THE DARK' },

    // 67.4–86.4 the river gate and the river
    { type: 'units', t0: 67.4, t1: 88, side: 'cn', r: 10, dots: [[-300, 3700], [900, 3500], [1600, 2500], [500, 1000], [-1600, 1900], [-2500, 0], [200, -2400], [-800, -1500], [1200, 300], [-1200, 2600]].map((p, k) => ({ from: p, to: [-3634 - 400 - (k % 4) * 260, -4288 - 420 - Math.floor(k / 4) * 260], m0: 67.4 + k * .2, m1: 73 + k * .2 })) },
    { type: 'ring', t0: 68.4, t1: 75, at: YJ, rpx: 70, color: '#ffd24d' },
    { type: 'label', t0: 68.9, t1: 75, at: YJ, text: 'YIJIANG GATE · HALF BLOCKED', dy: 120, size: 32, style: 'dark' },
    { type: 'label', t0: 71.6, t1: 75, screen: [540, 640], at: [0, 0], layer: 'hud', text: 'ITS GUARDS WERE NOT TOLD', size: 52, style: 'jp', pin: false },
    { type: 'blasts', t0: 73.6, t1: 75.6, at: YJ, radius: 220, n: 12, seed: 13, scale: .9 },
    { type: 'riverGlow', t0: 75.0, t1: 86.4 },
    { type: 'scatter', t0: 73.5, t1: 88, area: [[-4300, -4500], [-5600, -4200], [-5300, -5600], [-4300, -6400], [-3900, -5600]], n: 260, r: 4.4, color: '#7fa7ee', seed: 9 },
    { type: 'icon', kind: 'ship', t0: 75.2, t1: 80.2, m0: 75.4, m1: 79.6, path: ['lm-meitan', [-5200, -6000], 'lm-pukou-pier'], side: 'cn', size: 1.2 },
    { type: 'label', t0: 75.4, t1: 79.8, screen: [540, 640], at: [0, 0], layer: 'hud', text: 'THE GENERAL CROSSES', size: 52, style: 'dark', pin: false },
    { type: 'label', t0: 77.9, t1: 80.3, screen: [540, 1230], at: [0, 0], layer: 'hud', text: 'NO BOATS FOR ANYONE ELSE', size: 48, style: 'jp', pin: false },
    { type: 'counter', t0: 80.5, t1: 86.3, screen: [540, 730], steps: [[0, '3,000'], [3.8, '300']], size: 150, color: 'cn', caption: 'ONE DIVISION AT THE WATER', note: 'men alive afterwards' },

    // 86.6–97.4 the count
    { type: 'card', t0: 86.7, t1: 92.6, screen: [540, 1150], w: 460, h: 374, img: 'ep2_tokyo_lit_dec12.png', caption: 'Tokyo celebrates · 12 Dec 1937', credit: 'Asahi Shimbun · public domain' },
    { type: 'panel', t0: 88.0, t1: 97.3, y: 640, gap: 330, rows: [{ big: '1,558', small: 'JAPANESE DEAD', note: "Japan's own count for the battle", color: 'jp' }, { big: '?', small: 'CHINESE DEAD', note: 'no agreed figure', color: 'cn', delay: 5.5 }] },

    // 97.6– dawn, the city falls
    { type: 'stamp', t0: 98.4, t1: 101.4, screen: [540, 760], text: 'FALLEN', size: 190 },
    { type: 'label', t0: 98.8, t1: 101.4, screen: [540, 930], at: [0, 0], layer: 'hud', text: 'NANJING · 13 DECEMBER 1937', size: 48, style: 'dark', pin: false },
    { type: 'title', t0: 101.2, t1: 105, text: 'Part 3 tomorrow.', sub: 'SUBSCRIBE', y: 1180 },
  ],
};
