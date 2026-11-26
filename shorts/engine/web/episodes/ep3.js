// Episode 3 (Tue 11-24): the fall — the worst six weeks. Distant markers only; no bodies, no faces of victims.
// Timed to the ElevenLabs VO (vo/ep3.mp3, 107.4 s), 11-22. All on the big map / city layer.
import { ll } from '../engine.js';
const PANAY = ll(118.47, 31.72); // ~28 miles upriver (approximate position)
const ZS = [3986, 985];
export default {
  duration: 112, final: true,
  vo: 'ep3',
  cam: [
    { t: 0, x: 300, z: 300, w: 20000 },
    { t: 10.6, x: 200, z: 200, w: 19000 },
    { t: 12.6, x: PANAY[0] * .55, z: PANAY[1] * .55, w: 72000 },
    { t: 21.2, x: PANAY[0] * .5, z: PANAY[1] * .5, w: 68000 },
    { t: 23.6, x: -1200, z: -1600, w: 19000 },
    { t: 38.6, x: -1600, z: -2600, w: 17500 },
    { t: 40.6, x: -2200, z: -7000, w: 7800 },
    { t: 50.2, x: -2300, z: -7100, w: 7200 },
    { t: 52.4, x: -900, z: -900, w: 6800 },
    { t: 71.6, x: -900, z: -800, w: 6400 },
    { t: 73.0, x: 600, z: 400, w: 15000 },
    { t: 79.6, x: 2200, z: 1100, w: 7200 },                 // the parade, inside the east gate
    { t: 83.4, x: 2100, z: 1200, w: 6800 },
    { t: 85.0, x: 700, z: 1800, w: 13000 },                 // the burning
    { t: 89.0, x: 600, z: 1700, w: 12500 },
    { t: 91.0, x: 400, z: 400, w: 21000 },
    { t: 112, x: 400, z: 400, w: 20000 },
  ],
  story: [
    { t: 0, d: '12-13 16:00' }, { t: 10.6, d: '12-14 00:00', ease: 'linear' }, { t: 23.8, d: '12-14 06:00' },
    { t: 39.2, d: '12-15 18:00', ease: 'linear' }, { t: 50.6, d: '12-16 18:00', ease: 'linear' }, { t: 78.6, d: '12-17 06:00', ease: 'linear' },
    { t: 83.6, d: '12-17 14:00', ease: 'linear' }, { t: 84.0, d: '12-19 09:00' }, { t: 89.2, d: '12-21 00:00', ease: 'linear' }, { t: 102.6, d: '02-05 00:00', ease: 'linear' },
  ],
  hideDate: [[10.8, 23.6]],
  dark: [{ t: 0, v: 0 }, { t: 83.6, v: 0 }, { t: 85.2, v: .65 }, { t: 89.2, v: .65 }, { t: 91.5, v: .25 }],
  phases: [
    { t0: 0.5, t1: 10.6, text: 'AFTER THE BATTLE' }, { t0: 10.8, t1: 23.6, text: 'MEANWHILE, UPRIVER' }, { t0: 23.9, t1: 39.2, text: 'THE SEARCH' },
    { t0: 39.4, t1: 50.6, text: 'THE RIVERBANK' }, { t0: 50.8, t1: 78.6, text: 'THE SAFETY ZONE' }, { t0: 78.8, t1: 83.6, text: 'THE PARADE' },
    { t0: 83.7, t1: 89.2, text: 'THE BURNING' }, { t0: 89.3, t1: 107.4, text: 'THE COUNT' },
  ],
  shake: [[15.1, 15.7, 4]],
  items: [
    // 0–10.6 six weeks
    { type: 'counter', t0: 7.6, t1: 10.6, screen: [540, 730], steps: [[0, 'SIX WEEKS']], size: 150, color: 'jp', caption: 'WHAT CAME NEXT', note: '13 Dec 1937 – early Feb 1938' },

    // 10.8–23.6 the Panay, 28 miles upriver
    { type: 'place', t0: 11.4, t1: 23.4, at: [0, 0], text: 'NANJING', size: 34 },
    { type: 'line', t0: 11.9, t1: 15, path: [[0, 0], PANAY], color: '#ffffff', width: 5, dash: [10, 12], grow: 1.2 },
    { type: 'label', t0: 12.5, t1: 15, at: PANAY, text: '28 MILES UPRIVER', dy: 110, size: 32, style: 'dark' },
    { type: 'icon', kind: 'ship', t0: 12.6, t1: 21.4, m0: 12.6, m1: 14.6, path: [ll(118.52, 31.78), PANAY], size: 1.3, sinkAt: 15.3 },
    { type: 'icon', kind: 'plane', t0: 13.6, t1: 16.4, path: [ll(118.9, 31.6), ll(118.1, 31.85)], side: 'jp', size: 1.3 },
    { type: 'blasts', t0: 15.0, t1: 17, at: PANAY, radius: 1500, n: 8, seed: 31, scale: 1.2 },
    { type: 'label', t0: 15.4, t1: 17.2, screen: [540, 640], at: [0, 0], layer: 'hud', text: 'USS PANAY SUNK · 12 DEC', size: 56, style: 'jp', pin: false },
    { type: 'card', t0: 16.0, t1: 19.4, screen: [540, 1120], w: 560, h: 380, img: 'ep3_panay.jpg', caption: 'USS Panay, 12 Dec 1937', credit: 'US Navy · public domain' },
    { type: 'label', t0: 17.3, t1: 19.4, screen: [540, 640], at: [0, 0], layer: 'hud', text: 'FRONT-PAGE NEWS', size: 60, style: 'dark', pin: false },
    { type: 'counter', t0: 19.6, t1: 23.2, screen: [540, 730], steps: [[0, '3 DAYS']], size: 150, caption: 'BEFORE NANJING NEWS GOT OUT', note: 'first reports from the city: 15 Dec' },

    // 23.9–39.2 the search
    ...[[[-200, 300], [-1100, -700]], [[1200, 1500], [-500, 400]], [[600, -1600], [-900, -1500]]].map((p, k) => ({ type: 'arrow', t0: 27.7 + k * .4, t1: 39, path: p, side: 'jp', grow: 1.3, wpx: 38 })),
    { type: 'label', t0: 24.2, t1: 27.4, screen: [540, 730], at: [0, 0], layer: 'hud', text: 'UNIFORMS THROWN AWAY', size: 56, style: 'dark', pin: false },
    { type: 'counter', t0: 29.8, t1: 33.9, screen: [540, 730], steps: [[0, 'HANDS'], [1.9, 'CALLUSES']], size: 140, color: 'jp', caption: 'WHAT THEY CHECKED', note: 'calluses meant a rifle' },
    ...[[[-1300, -1200], [-3634, -4288], [-4919, -5041]], [[-900, -1800], [-2500, -4400], [-4151, -6225]], [[-600, -2000], [-1600, -4700], [-1983, -7699]], [[-1700, 800], [-3300, 600], [-4400, 900]]].map((p, k) => ({ type: 'line', t0: 35.1 + k * .4, t1: 50.4, path: p, color: '#e3e6e9', width: 6, dash: [4, 12], grow: 1.6 })),
    { type: 'riverGlow', t0: 36.6, t1: 50.4 },

    // 39.4–50.6 the riverbank
    { type: 'ring', t0: 40.2, t1: 50.4, at: 'x-caoxiexia', rpx: 110 },
    { type: 'counter', t0: 43.0, t1: 50.4, screen: [540, 730], from: 0, to: 14777, dur: 2.4, size: 140, caption: 'PRISONERS AT ONE PLACE ON THE BANK', note: "the Japanese army's own count" },
    { type: 'label', t0: 48.4, t1: 50.4, screen: [540, 1230], at: [0, 0], layer: 'hud', text: 'OVER THREE NIGHTS', size: 52, style: 'jp', pin: false },

    // 50.8–78.6 the safety zone
    { type: 'area', t0: 53.6, t1: 78.4, poly: 'zone', stroke: '#ffffff', fill: '#ffffff', fillA: .18, width: 7, grow: 1.6 },
    { type: 'label', t0: 55.2, t1: 60, screen: [540, 1230], at: [0, 0], layer: 'hud', text: 'THE SAFETY ZONE', size: 56, style: 'light', pin: false },
    { type: 'scatter', t0: 56.6, t1: 78.4, area: 'WALL', toArea: 'ZONE', share: .85, m0: 56.8, m1: 59.4, n: 520, r: 3.4, seed: 5 },
    { type: 'counter', t0: 56.9, t1: 60.0, screen: [540, 730], from: 0, to: 250000, dur: 1.4, prefix: '~', size: 130, caption: 'PEOPLE INSIDE THE ZONE', note: 'Smythe survey, 1938: 200,000–250,000' },
    { type: 'info', t0: 60.0, t1: 66.6, screen: [540, 1200], side: 'cn', badge: 'ZONE CHAIR', portrait: 'ep3_rabe.jpg', title: 'JOHN RABE', sub: 'Siemens manager · photo: DrSivle, CC BY-SA 3.0', rowT: [62.0, 63.6, 65.0],
      rows: [['Party', 'Member of the Nazi Party', true], ['The zone', 'Safer'], ['But', 'Not safe', true]] },
    { type: 'card', t0: 52.2, t1: 56.6, screen: [540, 1160], w: 560, h: 360, img: 'ep3_committee.jpg', caption: 'The zone committee · 13 Dec 1937', credit: 'Public domain' },
    { type: 'counter', t0: 67.6, t1: 71.6, screen: [540, 730], from: 0, to: 20000, dur: 1.4, prefix: '~', size: 130, color: 'jp', caption: 'RAPES IN THE FIRST MONTH', note: 'Tokyo tribunal judgment, 1948' },
    { type: 'panel', t0: 72.0, t1: 78.5, y: 640, gap: 330, rows: [{ big: '70,000', small: 'JAPANESE SOLDIERS IN THE CITY', color: 'jp' }, { big: '17', small: 'MILITARY POLICE', note: 'Tokyo tribunal, 1948', delay: 4.1 }] },

    // 78.8–83.6 the parade
    { type: 'ring', t0: 79.4, t1: 83.6, at: ZS, rpx: 70, color: '#ffd24d' },
    { type: 'arrow', t0: 80.2, t1: 83.6, path: [[5200, 700], ZS, [2235, 877], [900, 600]], side: 'jp', grow: 2.4, wpx: 34 },
    { type: 'card', t0: 80.0, t1: 83.6, screen: [540, 1140], w: 600, h: 400, img: 'ep3_parade.jpg', caption: 'The victory parade · 17 Dec 1937', credit: 'Public domain' },
    { type: 'label', t0: 80.4, t1: 83.6, screen: [540, 640], at: [0, 0], layer: 'hud', text: 'VICTORY PARADE · 17 DEC', size: 56, style: 'jp', pin: false },

    // 83.7–89.2 the burning (from 19 Dec)
    { type: 'fires', t0: 84.0, t1: 112, kinds: ['city'] },
    { type: 'counter', t0: 87.6, t1: 89.2, screen: [540, 730], steps: [[0, 'ONE THIRD']], size: 140, color: 'jp', caption: 'OF THE CITY BURNED', note: 'Tokyo tribunal, 1948' },

    // 89.3–105.8 the numbers
    { type: 'panel', t0: 90.9, t1: 102.9, y: 520, gap: 280, dim: .7, rows: [
      { big: '155,000+', small: 'BODIES BURIED', note: 'burial societies (one record disputed)', size: 110 },
      { big: '200,000+', small: 'MURDERED', note: 'Tokyo tribunal, 1948', size: 110, color: 'jp', delay: 5.4 },
      { big: '300,000+', small: 'MURDERED', note: 'Nanjing tribunal, 1947', size: 110, color: 'jp', delay: 10.2 } ] },
    { type: 'info', t0: 103.0, t1: 105.8, screen: [540, 1000], side: 'jp', badge: 'JAPAN', portrait: 'matsui_face.jpg', title: 'MATSUI IWANE', sub: 'Commander at Nanjing', rowT: [103.8],
      rows: [['Tokyo tribunal', 'Hanged, 23 Dec 1948', true]] },
    { type: 'card', t0: 105.9, t1: 112, screen: [540, 760], w: 760, h: 520, img: 'ep3_wall_today.jpg', caption: 'Zhonghua Gate today', credit: 'Vmenkov · CC BY-SA 3.0' },
    { type: 'title', t0: 107.8, t1: 112, text: 'Full film next week.', sub: 'SUBSCRIBE', y: 1180 },
  ],
};
