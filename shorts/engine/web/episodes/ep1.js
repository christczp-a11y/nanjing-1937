// Episode 1 (Sun 11-22): background — how a capital became a trap.
// v2 split (editor, 11-21): big map 0–38 s (Shanghai, the chase), then the coloured sandbox from 38 s to the end.
// 38–112 s here = HUD overlay only (numbers, date, cards); the map behind it is a stand-in preview.
// Retimed 11-21 to the ElevenLabs VO (vo/ep1.mp3, 108.8 s). Big map 0–39.4, sandbox 39.4–112.
import { ll } from '../engine.js';
const L = (lon, lat) => ll(lon, lat);
const NJ = [0, 300], SH = L(121.47, 31.23);
const RIVER_ROUTE = [L(121.3, 31.32), L(120.62, 31.35), L(120.3, 31.6), L(119.95, 31.8), L(119.58, 32.0), L(119.17, 31.96), L(118.9, 32.02)];
const SOUTH_ROUTE = [L(121.1, 30.85), L(120.75, 30.78), L(120.09, 30.9), L(119.42, 30.95), L(119.1, 31.5), L(118.85, 31.88)];
const NORTH_ROUTE = [L(120.6, 31.75), L(120.27, 31.9), L(119.75, 32.15), L(119.45, 32.19), L(119.0, 32.12)];
export default {
  duration: 114, final: true,
  vo: 'ep1',
  cam: [
    { t: 0, x: 140000, z: 45000, w: 440000 },
    { t: 11, x: 115000, z: 34000, w: 410000 },
    { t: 15.6, x: 125000, z: 34000, w: 400000 },
    { t: 18.6, x: 230000, z: 85000, w: 170000 },
    { t: 26, x: 235000, z: 88000, w: 150000 },
    { t: 29.5, x: 135000, z: 55000, w: 380000 },
    { t: 39.4, x: 0, z: 400, w: 17000 },                     // one continuous move: chase -> lands on the sandbox 1-1 wide framing
    { t: 56.4, x: 0, z: 400, w: 15500 },
    { t: 65.9, x: -600, z: 200, w: 16500 },
    { t: 79.6, x: 0, z: 400, w: 15500 },
    { t: 96, x: 200, z: 600, w: 17500 },
    { t: 112, x: -1500, z: -600, w: 19000 },
    { t: 114, x: -1600, z: -650, w: 19400 },
  ],
  story: [
    { t: 0, d: '11-08 00:00' }, { t: 26, d: '11-08 00:00' }, { t: 29, d: '11-12 12:00' },
    { t: 39.3, d: '12-06 10:00', ease: 'linear' },
    { t: 79.6, d: '12-06 10:00' }, { t: 95.9, d: '12-08 06:00', ease: 'linear' },
    { t: 96, d: '12-08 08:00' }, { t: 100.4, d: '12-08 20:00', ease: 'linear' },
    { t: 100.6, d: '12-09 06:00' }, { t: 110, d: '12-09 10:00', ease: 'linear' },
  ],
  legend: [[0.4, 15.8]],
  hideDate: [[0, 16], [56.4, 96]], // 1-4 shows no running date (editor 11-21); date back in 1-5: DEC 8 outer line, DEC 9 at the wall
  phases: [
    { t0: 16.2, t1: 26.8, text: 'SHANGHAI' }, { t0: 27, t1: 39.4, text: 'THE CHASE' },
    { t0: 39.6, t1: 56.4, text: 'THE CITY' }, { t0: 79.8, t1: 96, text: 'NO WAY OUT' }, { t0: 96.2, t1: 114, text: 'THE WALL' },
  ],
  shake: [[18.8, 26, 3], [108.9, 109.5, 7]],
  items: [
    // ---------------- big map 0–39.4
    { type: 'place', t0: 0.3, t1: 38, at: NJ, text: 'NANJING', size: 34 },
    { type: 'place', t0: 0.3, t1: 38, at: SH, text: 'SHANGHAI', size: 30, align: 'right' },
    { type: 'label', t0: 3.3, t1: 12.6, at: NJ, text: 'LIVE OR DIE WITH NANJING', dy: -120, size: 48 },
    { type: 'info', t0: 2.1, t1: 12.8, screen: [540, 1200], side: 'cn', badge: 'CHINA', portrait: 'tang_c1935.jpg', title: 'TANG SHENGZHI', sub: 'Commander · Nanjing garrison', rowT: [3.4, 6.8],
      rows: [['His vow · 18 Nov 1937', '“Live or die with Nanjing”', true], ['Less than four weeks later', 'Across the river']] },
    { type: 'label', t0: 13.1, t1: 15.9, at: NJ, text: 'THE TRAP', dy: -120, size: 64, style: 'jp' },
    // Shanghai
    { type: 'ring', t0: 18.3, t1: 26.5, at: SH, rpx: 120, color: '#ffd24d' },
    { type: 'blasts', t0: 18.5, t1: 26, at: SH, radius: 26000, n: 46, seed: 4, scale: .9 },
    { type: 'counter', t0: 18.6, t1: 26.6, at: SH, dy: -190, steps: [[0, 'AUG 13'], [1.8, '3 MONTHS']], size: 110, caption: 'THE BATTLE OF SHANGHAI' },
    { type: 'card', t0: 21.3, t1: 26.6, at: SH, dx: -250, dy: 250, w: 520, h: 340, img: 'shanghai_zhabei_fire_1026.jpg', placeholder: 'Zhabei on fire, Oct 1937', caption: 'Zhabei burning · Shanghai, 26 Oct 1937', credit: 'Wikimedia Commons · public domain' },
    // the chase
    { type: 'arrow', t0: 28.2, t1: 38.6, path: SOUTH_ROUTE, side: 'jp', grow: 9.5, wpx: 40, pawns: 2 },
    { type: 'arrow', t0: 28.8, t1: 38.6, path: NORTH_ROUTE, side: 'jp', grow: 8.5, wpx: 36, pawns: 2 },
    { type: 'arrow', t0: 27.2, t1: 38.6, path: RIVER_ROUTE, side: 'jp', grow: 10.5, wpx: 52, pawns: 3, text: '160,000+', tsize: 44, tdy: -70 },
    { type: 'blasts', t0: 27.5, t1: 38, path: RIVER_ROUTE, spread: 22000, n: 36, seed: 8, scale: .75 },
    { type: 'units', t0: 25.6, t1: 38.6, side: 'cn', r: 13, dots: [
      { from: L(120.9, 31.4), to: L(118.95, 32.0), m0: 26, m1: 37.5 }, { from: L(120.5, 31.6), to: L(118.9, 31.95), m0: 26.5, m1: 38 },
      { from: L(120.6, 31.2), to: L(118.95, 31.85), m0: 26, m1: 37.5 }, { from: L(120.2, 30.9), to: L(118.85, 31.8), m0: 27, m1: 38.3 },
      { from: L(120.0, 31.75), to: L(118.85, 32.08), m0: 27, m1: 38 }, { from: L(119.6, 32.15), to: L(118.95, 32.12), m0: 28, m1: 38.3 } ] },
    { type: 'card', t0: 27.3, t1: 30.2, at: L(121.0, 30.75), dx: -120, dy: -220, w: 580, h: 300, img: 'hangzhou_bay_landing_nov.jpg', placeholder: 'Landing at Hangzhou Bay, Nov 1937', caption: 'Japanese landing, Hangzhou Bay · Nov 1937', credit: 'Wikimedia Commons · public domain' },
    { type: 'info', t0: 30.0, t1: 37.4, screen: [540, 1230], side: 'jp', badge: 'JAPAN', unit: { ech: 'XXXX' }, portrait: 'matsui_face.jpg', title: 'CENTRAL CHINA AREA ARMY', tsize: 48, sub: 'Gen. Matsui Iwane', rowT: [32.8, 33.5, 35.0],
      rows: [['Strength', '160,000+', true], ['Armies', 'Shanghai Exp. Force + 10th Army'], ['Tokyo’s order · 1 Dec', 'Take Nanjing']] },

    // ---------------- sandbox 39.4–112 (HUD overlay only)
    { type: 'handoff', id: 'ep1_1-1', shot: '1-1', sandbox: true, t0: 39.4, t1: 56.4, note: 'Whole city, river, mountain, south hill in frame. 12-06 10:00. People flowing in the city.' },
    { type: 'handoff', id: 'ep1_1-2', shot: '1-2', sandbox: true, t0: 56.4, t1: 65.9, note: 'Low flight along the west side of the wall from the south gate, climb over the NW corner, look out over the river (river reveal on "Behind it is the river" 60.5 s).' },
    { type: 'handoff', id: 'ep1_1-3', shot: '1-3', sandbox: true, t0: 65.9, t1: 79.6, note: 'Dawn over the whole city, 12-07 05:00. Background for the two cards.' },
    { type: 'handoff', id: 'ep1_1-4', shot: '1-4', sandbox: true, t0: 79.6, t1: 96, note: 'Defenders on the wall; gates X-ed as of 12-06 on "walls up the gates" 91.5 s; ferries leave Xiaguan on "sends the ferries upriver" 93.3 s (overlay tag: FERRIES SENT UPRIVER, DEC 9). No running date on screen in this shot.' },
    { type: 'handoff', id: 'ep1_1-5', shot: '1-5', sandbox: true, t0: 96, t1: 114, note: 'Outer line breaks 12-08 (96–100 s); three red columns reach the wall E / SE / S by 12-09 morning (101.9 s "seventy thousand"); pan NW to the river on "fourth side" 106.8 s.' },
    // 1-1 the city
    { type: 'info', t0: 40.0, t1: 47.9, screen: [540, 1200], side: 'cn', badge: 'CAPITAL', title: 'NANJING', sub: 'Capital of China since 1927', layer: 'hud', rowT: [41.6, 44.6],
      rows: [['Capital for', '10 years'], ['Census · spring 1937', '1,019,667 people', true]] },
    { type: 'counter', t0: 48.4, t1: 56.2, screen: [540, 640], from: 1019667, to: 1019667, dur: .1, final: '250,000–500,000', finalDelay: 3.8, size: 118, caption: 'PEOPLE STILL INSIDE', note: 'estimates for December · the rest had left' },
    // 1-2 the wall flight
    { type: 'card', t0: 58.0, t1: 61.4, screen: [780, 1170], w: 400, h: 236, img: 'nanking_wall_aerial_1930.jpg', caption: 'The wall from the air · 1930', credit: 'Wikimedia Commons · public domain' },
    { type: 'wallGlow', t0: 57.7, t1: 61.6, dur: 2.6 },
    { type: 'riverGlow', t0: 60.5, t1: 65.9 },
    { type: 'counter', t0: 57.7, t1: 61.6, screen: [540, 560], steps: [[0, '35 KM']], size: 150, caption: 'OF CITY WALL' },
    { type: 'counter', t0: 62.4, t1: 65.7, screen: [540, 560], steps: [[0, '1 KM']], size: 150, caption: 'OF RIVER' },
    { type: 'label', t0: 64.3, t1: 65.7, screen: [540, 1240], at: [0, 0], layer: 'hud', text: 'NO BRIDGE', size: 64, style: 'jp', pin: false },
    // 1-3 hold or leave
    { type: 'info', t0: 66.0, t1: 79.4, screen: [540, 620], side: 'cn', badge: 'LEADER', portrait: 'chiang_face.jpg', title: 'CHIANG KAI-SHEK', sub: 'Leader of China', from: 'left', rowT: [66.4, 70.8, 73.3],
      rows: [['Most generals', 'Give up the city, save the army'], ['His answer', 'Hold Nanjing', true], ['Government', 'Moves inland · 20 Nov']] },
    { type: 'info', t0: 75.4, t1: 79.4, screen: [540, 1200], side: 'cn', badge: 'GARRISON', portrait: 'tang_c1935.jpg', title: 'TANG SHENGZHI', sub: 'The only general who said yes', from: 'right', rowT: [77.3],
      rows: [['He said', '“It can be held”', true]] },
    // 1-4 no way out
    { type: 'gateSeq', t0: 89.3, t1: 95.9, gates: ['zhonghua', 'yuhua', 'wuding', 'tongji', 'guanghua', 'zhongshan', 'taiping', 'shuixi', 'shicheng', 'hanzhong', 'caochang', 'xuanwu', 'heping', 'zhongyang', 'xiaobei', 'jinchuan', 'xinmin', 'xingzhong', 'yijiang'],
      batches: [[91.7, ['zhonghua', 'yuhua', 'wuding', 'tongji', 'guanghua', 'zhongshan', 'taiping']], [92.8, ['shuixi', 'shicheng', 'hanzhong', 'caochang', 'xuanwu', 'heping']], [94.1, ['zhongyang', 'xiaobei', 'jinchuan', 'xinmin', 'xingzhong']]],
      keep: ['yijiang'], keepLabel: 'YIJIANG GATE · LAST WAY OUT', step: .09 },
    { type: 'counter', t0: 81.4, t1: 89.2, screen: [540, 640], steps: [[0, '70,000–150,000']], size: 104, color: 'cn', caption: 'CHINESE DEFENDERS', note: 'historians disagree · about half were recruits' },
    { type: 'counter', t0: 89.3, t1: 95.8, screen: [540, 1250], steps: [[0, '19'], [2.4, '12'], [3.5, '6'], [4.8, '1']], size: 130, caption: 'WAYS OUT OF THE CITY' },
    { type: 'label', t0: 91.6, t1: 95.8, screen: [540, 450], at: [0, 0], layer: 'hud', text: 'GATES WALLED UP', size: 44, style: 'dark', pin: false },
    { type: 'label', t0: 93.3, t1: 95.8, screen: [540, 535], at: [0, 0], layer: 'hud', text: 'FERRIES SENT UPRIVER, DEC 9', size: 44, style: 'dark', pin: false },
    // 1-5 the wall
    { type: 'label', t0: 97.6, t1: 100.4, screen: [540, 640], at: [0, 0], layer: 'hud', text: '8 DEC · LAST OUTER LINE BREAKS', size: 52, style: 'jp', pin: false },
    { type: 'counter', t0: 101.8, t1: 106.5, screen: [540, 640], from: 0, to: 70000, dur: 1.2, prefix: '~', size: 120, color: 'jp', caption: 'JAPANESE TROOPS AT THE WALL' },
    { type: 'versus', t0: 102.6, t1: 106.6, screen: [540, 1070], kicker: 'NANJING · 9 DECEMBER 1937', title: 'THE SIEGE', stake: 'THE CAPITAL OF CHINA',
      left: { side: 'cn', name: 'CHINA', who: 'Gen. Tang Shengzhi', role: 'Nanjing garrison', num: '70,000–150,000', img: 'tang_c1935.jpg' },
      right: { side: 'jp', name: 'JAPAN', who: 'Gen. Matsui Iwane', role: 'Central China Area Army', num: '~70,000 AT THE WALL', img: 'matsui_face.jpg' } },
    { type: 'riverGlow', t0: 106.6, t1: 114 },
    { type: 'label', t0: 106.8, t1: 108.9, screen: [540, 900], at: [0, 0], layer: 'hud', text: 'THE FOURTH SIDE: THE RIVER', size: 56, style: 'dark', pin: false },
    { type: 'stamp', t0: 108.9, t1: 111.3, screen: [540, 820], text: 'TRAPPED', size: 180 },
    { type: 'title', t0: 111.0, t1: 114, text: 'Part 2 tomorrow.', sub: 'SUBSCRIBE', y: 1180 },
  ],
};
